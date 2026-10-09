import type {
  BoundingBox,
  CorridorMetrics,
  CountingStats,
  DensityMetrics,
  DetectionResultItem,
  RoiPoint,
} from '../types/detection';
import { isPointInPolygon } from '../utils/polygonUtils';

interface TrackedObject {
  id: number;
  lastCenter: { x: number; y: number };
  lastBox: BoundingBox;
  lastScore: number;
  consecutiveMisses: number;
  consecutiveHits: number;
  totalHits: number;
  isConfirmed: boolean;
  firstSeen: number;
  lastSeen: number;
  velocity: { vx: number; vy: number };
  crossedLineState?: 'above' | 'below' | 'none';
}

export class TrackingService {
  private nextId = 1;
  private trackedObjects: Map<number, TrackedObject> = new Map();
  private maxMisses = 8; // frames before dropping an ID
  private distanceThreshold = 0.14; // normalized Euclidean distance threshold
  private iouThreshold = 0.15; // minimum intersection-over-union

  // Counting statistics
  private totalUniqueTracked = 0;
  private maxCount = 0;
  private minCount = 0;
  private countHistory: number[] = [];
  private enteredCount = 0;
  private exitedCount = 0;

  public reset() {
    this.nextId = 1;
    this.trackedObjects.clear();
    this.totalUniqueTracked = 0;
    this.maxCount = 0;
    this.minCount = 0;
    this.countHistory = [];
    this.enteredCount = 0;
    this.exitedCount = 0;
  }

  private calculateIoU(boxA: BoundingBox, boxB: BoundingBox): number {
    const xA = Math.max(boxA.normalizedX, boxB.normalizedX);
    const yA = Math.max(boxA.normalizedY, boxB.normalizedY);
    const xB = Math.min(boxA.normalizedX + boxA.normalizedWidth, boxB.normalizedX + boxB.normalizedWidth);
    const yB = Math.min(boxA.normalizedY + boxA.normalizedHeight, boxB.normalizedY + boxB.normalizedHeight);

    const interArea = Math.max(0, xB - xA) * Math.max(0, yB - yA);
    const boxAArea = boxA.normalizedWidth * boxA.normalizedHeight;
    const boxBArea = boxB.normalizedWidth * boxB.normalizedHeight;
    const unionArea = boxAArea + boxBArea - interArea;

    if (unionArea <= 0) return 0;
    return interArea / unionArea;
  }

  private calculateDistance(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private smoothBox(prev: BoundingBox, curr: BoundingBox, alpha: number = 0.7): BoundingBox {
    return {
      originX: prev.originX * (1 - alpha) + curr.originX * alpha,
      originY: prev.originY * (1 - alpha) + curr.originY * alpha,
      width: prev.width * (1 - alpha) + curr.width * alpha,
      height: prev.height * (1 - alpha) + curr.height * alpha,
      normalizedX: prev.normalizedX * (1 - alpha) + curr.normalizedX * alpha,
      normalizedY: prev.normalizedY * (1 - alpha) + curr.normalizedY * alpha,
      normalizedWidth: prev.normalizedWidth * (1 - alpha) + curr.normalizedWidth * alpha,
      normalizedHeight: prev.normalizedHeight * (1 - alpha) + curr.normalizedHeight * alpha,
    };
  }

  public update(
    detections: DetectionResultItem[],
    options: {
      enableTracking: boolean;
      enableCountingLine: boolean;
      countingLinePosition: number;
      enableZone: boolean;
      zone?: { x: number; y: number; width: number; height: number };
      enableTemporalFilter?: boolean;
      minPersistenceFrames?: number;
      enableRoi?: boolean;
      roiPolygon?: RoiPoint[];
      roiInvert?: boolean;
    }
  ): {
    trackedDetections: DetectionResultItem[];
    stats: CountingStats;
  } {
    const now = performance.now();
    const useTemporal = options.enableTemporalFilter !== false;
    const minPersistence = Math.max(1, options.minPersistenceFrames ?? 5);

    let activeDetections = detections;

    // 1. If Detection Zone is active, filter detections within rectangular zone
    if (options.enableZone && options.zone) {
      const z = options.zone;
      activeDetections = activeDetections.filter((d) => {
        const cx = d.center.x;
        const cy = d.center.y;
        return cx >= z.x && cx <= z.x + z.width && cy >= z.y && cy <= z.y + z.height;
      });
    }

    // 2. Region of Interest (ROI) Polygon Mask boundary check
    if (options.enableRoi && options.roiPolygon && options.roiPolygon.length >= 3) {
      const poly = options.roiPolygon;
      const invert = options.roiInvert === true;

      activeDetections = activeDetections.filter((d) => {
        const cx = d.center.x;
        const cy = d.center.y;
        const inside = isPointInPolygon({ x: cx, y: cy }, poly);
        return invert ? !inside : inside;
      });
    }

    if (!options.enableTracking) {
      // Basic static mode without temporal tracking IDs
      const count = activeDetections.length;
      this.maxCount = Math.max(this.maxCount, count);
      this.minCount = this.minCount === 0 ? count : Math.min(this.minCount, count);
      this.countHistory.push(count);
      if (this.countHistory.length > 300) this.countHistory.shift();

      const avg = this.countHistory.reduce((a, b) => a + b, 0) / (this.countHistory.length || 1);

      return {
        trackedDetections: activeDetections.map((d, i) => ({
          ...d,
          id: i + 1,
        })),
        stats: {
          currentCount: count,
          maxCount: this.maxCount,
          minCount: this.minCount,
          averageCount: Number(avg.toFixed(1)),
          totalUniqueTracked: count,
          lineCrossings: {
            entered: this.enteredCount,
            exited: this.exitedCount,
            inside: count,
          },
          densityMetrics: {
            crowdingLevel: count > 15 ? 'Overcrowded' : count > 8 ? 'Dense' : count > 3 ? 'Moderate' : 'Low',
            densityIndex: Math.min(100, Math.round((count / 20) * 100)),
            peakSector: 'Static Field',
          },
          corridorMetrics: {
            northboundCount: 0,
            southboundCount: 0,
            activeMovers: 0,
            flowRatePerMin: 0,
          },
        },
      };
    }

    // Centroid + IoU Matching
    const matchedTrackIds = new Set<number>();
    const matchedDetectionIndices = new Set<number>();
    const matches: { trackId: number; detIndex: number; cost: number }[] = [];

    this.trackedObjects.forEach((track, trackId) => {
      activeDetections.forEach((det, detIdx) => {
        const dist = this.calculateDistance(track.lastCenter, det.center);
        const iou = this.calculateIoU(track.lastBox, det.box);

        if (dist < this.distanceThreshold || iou > this.iouThreshold) {
          const cost = dist - iou * 0.5;
          matches.push({ trackId, detIndex: detIdx, cost });
        }
      });
    });

    matches.sort((a, b) => a.cost - b.cost);

    const confirmedResults: DetectionResultItem[] = [];

    // 1. Process matched tracks (temporal consistency confirmation)
    for (const match of matches) {
      if (matchedTrackIds.has(match.trackId) || matchedDetectionIndices.has(match.detIndex)) {
        continue;
      }

      matchedTrackIds.add(match.trackId);
      matchedDetectionIndices.add(match.detIndex);

      const track = this.trackedObjects.get(match.trackId)!;
      const det = activeDetections[match.detIndex];

      // Update velocity vector
      const dx = det.center.x - track.lastCenter.x;
      const dy = det.center.y - track.lastCenter.y;
      track.velocity = {
        vx: track.velocity ? track.velocity.vx * 0.5 + dx * 0.5 : dx,
        vy: track.velocity ? track.velocity.vy * 0.5 + dy * 0.5 : dy,
      };

      // Update temporal consistency counters
      track.consecutiveHits++;
      track.totalHits++;
      track.consecutiveMisses = 0;
      track.lastScore = det.score;
      track.lastSeen = now;

      if (!track.isConfirmed) {
        if (!useTemporal || track.consecutiveHits >= minPersistence) {
          track.isConfirmed = true;
          this.totalUniqueTracked++;
        }
      }

      // Smooth coordinates
      const smoothedBox = this.smoothBox(track.lastBox, det.box, 0.7);
      track.lastBox = smoothedBox;
      track.lastCenter = {
        x: smoothedBox.normalizedX + smoothedBox.normalizedWidth / 2,
        y: smoothedBox.normalizedY + smoothedBox.normalizedHeight / 2,
      };

      // Counting line check: ONLY evaluated for confirmed persistent people
      if (track.isConfirmed && options.enableCountingLine) {
        const lineY = options.countingLinePosition;
        const prevY = track.lastCenter.y;
        const currY = det.center.y;

        if (prevY < lineY && currY >= lineY) {
          this.enteredCount++;
          track.crossedLineState = 'below';
        } else if (prevY > lineY && currY <= lineY) {
          this.exitedCount++;
          track.crossedLineState = 'above';
        }
      }

      // Only confirmed persistent detections are emitted and counted!
      if (track.isConfirmed) {
        confirmedResults.push({
          ...det,
          id: track.id,
          box: track.lastBox,
          center: track.lastCenter,
          firstSeen: track.firstSeen,
          lastSeen: track.lastSeen,
          velocity: track.velocity,
        });
      }
    }

    // 2. Create new probationary tracks for unmatched detections
    activeDetections.forEach((det, detIdx) => {
      if (!matchedDetectionIndices.has(detIdx)) {
        const newId = this.nextId++;
        const isImmediate = !useTemporal || minPersistence <= 1;

        if (isImmediate) {
          this.totalUniqueTracked++;
        }

        const newTrack: TrackedObject = {
          id: newId,
          lastCenter: det.center,
          lastBox: det.box,
          lastScore: det.score,
          consecutiveMisses: 0,
          consecutiveHits: 1,
          totalHits: 1,
          isConfirmed: isImmediate,
          firstSeen: now,
          lastSeen: now,
          velocity: { vx: 0, vy: 0 },
          crossedLineState: det.center.y < options.countingLinePosition ? 'above' : 'below',
        };

        this.trackedObjects.set(newId, newTrack);

        if (isImmediate) {
          confirmedResults.push({
            ...det,
            id: newId,
            firstSeen: now,
            lastSeen: now,
            velocity: { vx: 0, vy: 0 },
          });
        }
      }
    });

    // 3. Age unmatched tracks and prune dead/flicker candidates
    this.trackedObjects.forEach((track, trackId) => {
      if (!matchedTrackIds.has(trackId)) {
        track.consecutiveMisses++;
        track.consecutiveHits = 0;

        const dropThreshold = track.isConfirmed ? this.maxMisses : 1;
        if (track.consecutiveMisses > dropThreshold) {
          this.trackedObjects.delete(trackId);
        }
      }
    });

    // 4. Calculate population metrics
    const currentCount = confirmedResults.length;
    this.maxCount = Math.max(this.maxCount, currentCount);
    this.minCount = this.minCount === 0 ? currentCount : Math.min(this.minCount, currentCount);
    this.countHistory.push(currentCount);
    if (this.countHistory.length > 300) this.countHistory.shift();

    const averageCount =
      this.countHistory.reduce((a, b) => a + b, 0) / (this.countHistory.length || 1);

    // 5. Calculate Population Density & Movement Corridors
    const sectorNames = [
      ['North-West', 'North-Central', 'North-East'],
      ['Mid-West', 'Central Plaza', 'Mid-East'],
      ['South-West', 'South Corridor', 'South-East'],
    ];
    const sectorCounts: Record<string, number> = {};

    let northboundCount = 0;
    let southboundCount = 0;
    let activeMovers = 0;

    confirmedResults.forEach((d) => {
      const col = Math.min(2, Math.max(0, Math.floor(d.center.x * 3)));
      const row = Math.min(2, Math.max(0, Math.floor(d.center.y * 3)));
      const sec = sectorNames[row][col];
      sectorCounts[sec] = (sectorCounts[sec] || 0) + 1;

      if (d.velocity) {
        const speed = Math.hypot(d.velocity.vx, d.velocity.vy);
        if (speed > 0.003) {
          activeMovers++;
          if (d.velocity.vy < -0.001) northboundCount++;
          else if (d.velocity.vy > 0.001) southboundCount++;
        }
      }
    });

    let peakSector = 'Evenly Distributed';
    let maxSecVal = 0;
    Object.entries(sectorCounts).forEach(([sec, cnt]) => {
      if (cnt > maxSecVal && cnt >= 2) {
        maxSecVal = cnt;
        peakSector = `${sec} (${cnt} ppl)`;
      }
    });

    let crowdingLevel: 'Low' | 'Moderate' | 'Dense' | 'Overcrowded' = 'Low';
    if (currentCount > 15) crowdingLevel = 'Overcrowded';
    else if (currentCount > 8) crowdingLevel = 'Dense';
    else if (currentCount > 3) crowdingLevel = 'Moderate';

    const densityMetrics: DensityMetrics = {
      crowdingLevel,
      densityIndex: Math.min(100, Math.round((currentCount / 20) * 100)),
      peakSector,
    };

    const corridorMetrics: CorridorMetrics = {
      northboundCount,
      southboundCount,
      activeMovers,
      flowRatePerMin: Math.round((this.enteredCount + this.exitedCount) * 3 + activeMovers),
    };

    return {
      trackedDetections: confirmedResults,
      stats: {
        currentCount,
        maxCount: this.maxCount,
        minCount: this.minCount,
        averageCount: Number(averageCount.toFixed(1)),
        totalUniqueTracked: this.totalUniqueTracked,
        lineCrossings: {
          entered: this.enteredCount,
          exited: this.exitedCount,
          inside: currentCount,
        },
        densityMetrics,
        corridorMetrics,
      },
    };
  }

  public getStats(): CountingStats {
    let confirmedCount = 0;
    this.trackedObjects.forEach((t) => {
      if (t.isConfirmed) confirmedCount++;
    });

    const avg =
      this.countHistory.reduce((a, b) => a + b, 0) / (this.countHistory.length || 1);

    return {
      currentCount: confirmedCount,
      maxCount: this.maxCount,
      minCount: this.minCount,
      averageCount: Number(avg.toFixed(1)),
      totalUniqueTracked: this.totalUniqueTracked,
      lineCrossings: {
        entered: this.enteredCount,
        exited: this.exitedCount,
        inside: confirmedCount,
      },
      densityMetrics: {
        crowdingLevel: confirmedCount > 15 ? 'Overcrowded' : confirmedCount > 8 ? 'Dense' : confirmedCount > 3 ? 'Moderate' : 'Low',
        densityIndex: Math.min(100, Math.round((confirmedCount / 20) * 100)),
        peakSector: 'Field Observation',
      },
      corridorMetrics: {
        northboundCount: 0,
        southboundCount: 0,
        activeMovers: 0,
        flowRatePerMin: Math.round((this.enteredCount + this.exitedCount) * 3),
      },
    };
  }
}

export const trackingService = new TrackingService();
