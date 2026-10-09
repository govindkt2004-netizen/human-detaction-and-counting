import { FilesetResolver, ObjectDetector } from '@mediapipe/tasks-vision';
import type {
  BoundingBox,
  DelegateType,
  DetectionResultItem,
  ModelType,
  RunningMode,
} from '../types/detection';

interface TemporalCandidate {
  id: number;
  center: { x: number; y: number };
  box: BoundingBox;
  consecutiveFrames: number;
  missedFrames: number;
  latestDetection: DetectionResultItem;
}

const MODEL_URLS: Record<ModelType, string> = {
  efficientdet_lite0: 'https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float32/1/efficientdet_lite0.tflite',
  efficientdet_lite2: 'https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite2/float32/1/efficientdet_lite2.tflite',
  mobilenet_v2: 'https://storage.googleapis.com/mediapipe-models/object_detector/ssd_mobilenet_v2/float32/1/ssd_mobilenet_v2.tflite',
};

export const MODEL_NAMES: Record<ModelType, string> = {
  efficientdet_lite0: 'EfficientDet-Lite0 (Fast & Mobile)',
  efficientdet_lite2: 'EfficientDet-Lite2 (High Accuracy)',
  mobilenet_v2: 'SSD MobileNet v2 (Balanced)',
};

export interface ImageDetectOptions {
  confidenceThreshold?: number;
  maxResults?: number;
  crowdMode?: boolean;
  tileGrid?: '2x2' | '3x2' | '4x2';
  nmsIouThreshold?: number;
}

class DetectorService {
  private visionWasmResolver: any = null;
  private detector: ObjectDetector | null = null;
  private currentMode: RunningMode = 'IMAGE';
  private currentModel: ModelType = 'efficientdet_lite0';
  private currentDelegate: DelegateType = 'GPU';
  private currentBaseScoreThreshold: number = 0.15;
  private currentMaxResults: number = 80;
  private isInitializing: boolean = false;
  private gpuAvailable: boolean = true;
  private onInitProgress?: (progress: number, stage: string) => void;
  private offscreenCanvas: HTMLCanvasElement | null = null;

  // Temporal consistency filter state for video stream detection
  // Requires candidates to persist across a minimum number of consecutive frames (default: 5)
  // before being confirmed and added to the count, suppressing flickering false positives.
  private temporalCandidates: Map<number, TemporalCandidate> = new Map();
  private nextTemporalCandidateId: number = 1;

  public resetTemporalFilter() {
    this.temporalCandidates.clear();
    this.nextTemporalCandidateId = 1;
  }

  constructor() {
    this.checkGpuAvailability();
  }

  private checkGpuAvailability(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      this.gpuAvailable = !!gl;
      return this.gpuAvailable;
    } catch {
      this.gpuAvailable = false;
      return false;
    }
  }

  public isGpuSupported(): boolean {
    return this.gpuAvailable;
  }

  public setProgressCallback(cb?: (progress: number, stage: string) => void) {
    this.onInitProgress = cb;
  }

  public async initialize(
    mode: RunningMode = 'IMAGE',
    model: ModelType = 'efficientdet_lite0',
    delegate: DelegateType = 'GPU',
    scoreThreshold: number = 0.3,
    maxResults: number = 60
  ): Promise<ObjectDetector> {
    // We configure the base engine with a permissive threshold (e.g. 0.15)
    // so it doesn't clip background people in groups, and we filter dynamically in JS.
    const baseScoreThreshold = Math.min(0.15, scoreThreshold);
    const baseMaxResults = Math.max(80, maxResults);

    if (
      this.detector &&
      this.currentMode === mode &&
      this.currentModel === model &&
      this.currentDelegate === delegate
    ) {
      return this.detector;
    }

    if (this.isInitializing) {
      let tries = 0;
      while (this.isInitializing && tries < 50) {
        await new Promise((r) => setTimeout(r, 100));
        tries++;
      }
      if (this.detector) return this.detector;
    }

    this.isInitializing = true;
    try {
      this.onInitProgress?.(25, 'Loading WebAssembly vision runtime...');
      if (!this.visionWasmResolver) {
        this.visionWasmResolver = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.20/wasm'
        );
      }

      this.onInitProgress?.(55, `Loading ${MODEL_NAMES[model]} neural network...`);

      let targetDelegate: DelegateType = delegate;
      if (targetDelegate === 'GPU' && !this.checkGpuAvailability()) {
        targetDelegate = 'CPU';
      }

      const modelUrl = MODEL_URLS[model] || MODEL_URLS.efficientdet_lite0;

      if (this.detector) {
        try {
          this.detector.close();
        } catch (e) {
          console.warn('Error closing previous detector:', e);
        }
        this.detector = null;
      }

      this.onInitProgress?.(80, `Compiling model with ${targetDelegate} acceleration...`);

      try {
        this.detector = await ObjectDetector.createFromOptions(this.visionWasmResolver, {
          baseOptions: {
            modelAssetPath: modelUrl,
            delegate: targetDelegate,
          },
          scoreThreshold: baseScoreThreshold,
          maxResults: baseMaxResults,
          runningMode: mode,
          categoryAllowlist: ['person'],
        });
        this.currentDelegate = targetDelegate;
      } catch (gpuError) {
        if (targetDelegate === 'GPU') {
          console.warn('GPU delegate failed, falling back to CPU:', gpuError);
          this.onInitProgress?.(88, 'GPU delegate unavailable. Falling back to CPU...');
          this.detector = await ObjectDetector.createFromOptions(this.visionWasmResolver, {
            baseOptions: {
              modelAssetPath: modelUrl,
              delegate: 'CPU',
            },
            scoreThreshold: baseScoreThreshold,
            maxResults: baseMaxResults,
            runningMode: mode,
            categoryAllowlist: ['person'],
          });
          this.currentDelegate = 'CPU';
        } else {
          throw gpuError;
        }
      }

      this.currentMode = mode;
      this.currentModel = model;
      this.currentBaseScoreThreshold = baseScoreThreshold;
      this.currentMaxResults = baseMaxResults;

      this.onInitProgress?.(100, 'Human Detection Model Ready');
      return this.detector;
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Helper: Non-Maximum Suppression (NMS) to eliminate overlapping redundant bounding boxes
   */
  private applyNMS(
    detections: DetectionResultItem[],
    iouThreshold: number = 0.45
  ): DetectionResultItem[] {
    if (detections.length <= 1) return detections;

    // Sort by score descending
    const sorted = [...detections].sort((a, b) => b.score - a.score);
    const selected: DetectionResultItem[] = [];

    for (let i = 0; i < sorted.length; i++) {
      const current = sorted[i];
      let shouldSelect = true;

      for (let j = 0; j < selected.length; j++) {
        const kept = selected[j];
        const iou = this.calculateIoU(current.box, kept.box);

        if (iou > iouThreshold) {
          shouldSelect = false;
          break;
        }

        // Also check if current box is largely nested inside kept box (containment)
        const containment = this.calculateContainment(current.box, kept.box);
        if (containment > 0.8) {
          shouldSelect = false;
          break;
        }
      }

      if (shouldSelect) {
        selected.push(current);
      }
    }

    return selected;
  }

  private calculateIoU(boxA: any, boxB: any): number {
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

  private calculateContainment(boxA: any, boxB: any): number {
    const xA = Math.max(boxA.normalizedX, boxB.normalizedX);
    const yA = Math.max(boxA.normalizedY, boxB.normalizedY);
    const xB = Math.min(boxA.normalizedX + boxA.normalizedWidth, boxB.normalizedX + boxB.normalizedWidth);
    const yB = Math.min(boxA.normalizedY + boxA.normalizedHeight, boxB.normalizedY + boxB.normalizedHeight);

    const interArea = Math.max(0, xB - xA) * Math.max(0, yB - yA);
    const boxAArea = boxA.normalizedWidth * boxA.normalizedHeight;
    if (boxAArea <= 0) return 0;
    return interArea / boxAArea;
  }

  private calculateDistance(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Temporal consistency filter for video frames.
   * A candidate person detection must exist across a minimum of consecutive frames
   * (default: 5 frames) before it is confirmed and added to the count.
   * Single-frame or transient flickering optical artifacts are dropped immediately.
   */
  private applyTemporalConsistencyFilter(
    rawDetections: DetectionResultItem[],
    minConsecutiveFrames: number = 5
  ): DetectionResultItem[] {
    const matchedCandidateIds = new Set<number>();
    const matchedDetectionIndices = new Set<number>();
    const matches: { candidateId: number; detIndex: number; cost: number }[] = [];

    // Spatial proximity and IoU matching
    this.temporalCandidates.forEach((candidate, candidateId) => {
      rawDetections.forEach((det, detIdx) => {
        const dist = this.calculateDistance(candidate.center, det.center);
        const iou = this.calculateIoU(candidate.box, det.box);

        // Generous spatial matching (dist < 0.28 or IoU > 0.08) to accommodate natural human posture movements
        if (dist < 0.28 || iou > 0.08) {
          const cost = dist - iou * 0.5;
          matches.push({ candidateId, detIndex: detIdx, cost });
        }
      });
    });

    matches.sort((a, b) => a.cost - b.cost);

    // 1. Process matched candidates
    for (const match of matches) {
      if (
        matchedCandidateIds.has(match.candidateId) ||
        matchedDetectionIndices.has(match.detIndex)
      ) {
        continue;
      }
      matchedCandidateIds.add(match.candidateId);
      matchedDetectionIndices.add(match.detIndex);

      const candidate = this.temporalCandidates.get(match.candidateId)!;
      const det = rawDetections[match.detIndex];

      candidate.consecutiveFrames++;
      candidate.missedFrames = 0;
      candidate.center = det.center;
      candidate.box = det.box;
      candidate.latestDetection = det;
    }

    // 2. Unmatched raw detections become new candidates (consecutiveFrames = 1)
    rawDetections.forEach((det, detIdx) => {
      if (!matchedDetectionIndices.has(detIdx)) {
        const id = this.nextTemporalCandidateId++;
        this.temporalCandidates.set(id, {
          id,
          center: det.center,
          box: det.box,
          consecutiveFrames: 1,
          missedFrames: 0,
          latestDetection: det,
        });
      }
    });

    // 3. Process unmatched candidates (age & prune false positives)
    this.temporalCandidates.forEach((candidate, id) => {
      if (!matchedCandidateIds.has(id)) {
        candidate.missedFrames++;
        // If not yet confirmed (< minConsecutiveFrames), allow up to 2 misses before dropping
        // If confirmed, allow up to 5 misses before dropping to prevent flickering on quick turns
        const maxMiss = candidate.consecutiveFrames >= minConsecutiveFrames ? 5 : 2;
        if (candidate.missedFrames > maxMiss) {
          this.temporalCandidates.delete(id);
        }
      }
    });

    // 4. Return confirmed candidates (consecutiveFrames >= minConsecutiveFrames)
    const confirmedDetections: DetectionResultItem[] = [];
    this.temporalCandidates.forEach((candidate) => {
      if (candidate.consecutiveFrames >= minConsecutiveFrames && candidate.missedFrames <= 1) {
        confirmedDetections.push(candidate.latestDetection);
      }
    });

    return confirmedDetections;
  }

  /**
   * Run single detection pass on a canvas or image
   */
  private runSinglePass(
    source: HTMLImageElement | HTMLCanvasElement,
    sourceW: number,
    sourceH: number,
    offsetX: number = 0,
    offsetY: number = 0,
    cropW?: number,
    cropH?: number
  ): DetectionResultItem[] {
    if (!this.detector) return [];

    let result: any = null;
    try {
      result = this.detector.detect(source);
    } catch (e) {
      console.warn('Single pass error:', e);
      return [];
    }

    if (!result || !result.detections) return [];

    const effectiveCropW = cropW || sourceW;
    const effectiveCropH = cropH || sourceH;

    const list: DetectionResultItem[] = [];

    for (const det of result.detections) {
      const primaryCat = det.categories[0];
      const catName = primaryCat?.categoryName?.toLowerCase() || '';

      if (catName === 'person' || catName === '') {
        const bb = det.boundingBox;
        if (!bb) continue;

        // Map box from cropped tile back to full image coordinate space
        const scaleX = effectiveCropW / (('width' in source ? source.width : sourceW) || 1);
        const scaleY = effectiveCropH / (('height' in source ? source.height : sourceH) || 1);

        const localX = Math.max(0, bb.originX) * scaleX;
        const localY = Math.max(0, bb.originY) * scaleY;
        const localW = bb.width * scaleX;
        const localH = bb.height * scaleY;

        const globalX = offsetX + localX;
        const globalY = offsetY + localY;
        const globalW = Math.min(sourceW - globalX, localW);
        const globalH = Math.min(sourceH - globalY, localH);

        const normX = globalX / sourceW;
        const normY = globalY / sourceH;
        const normW = globalW / sourceW;
        const normH = globalH / sourceH;

        list.push({
          categoryName: 'Person',
          score: Math.round((primaryCat?.score || 0) * 100),
          box: {
            originX: globalX,
            originY: globalY,
            width: globalW,
            height: globalH,
            normalizedX: normX,
            normalizedY: normY,
            normalizedWidth: normW,
            normalizedHeight: normH,
          },
          center: {
            x: normX + normW / 2,
            y: normY + normH / 2,
          },
        });
      }
    }

    return list;
  }

  /**
   * Main image detection with Slicing Aided Hyper Inference (SAHI) for dense crowds
   */
  public detectImage(
    imageElement: HTMLImageElement | HTMLCanvasElement,
    options: ImageDetectOptions = {}
  ): {
    detections: DetectionResultItem[];
    inferenceTimeMs: number;
  } {
    if (!this.detector) {
      throw new Error('Detector has not been initialized');
    }

    const start = performance.now();

    const fullWidth = ('naturalWidth' in imageElement ? imageElement.naturalWidth : imageElement.width) || 1;
    const fullHeight = ('naturalHeight' in imageElement ? imageElement.naturalHeight : imageElement.height) || 1;

    const thresholdPercent = Math.round((options.confidenceThreshold ?? 0.3) * 100);
    const maxResults = options.maxResults ?? 60;
    const crowdMode = options.crowdMode ?? true;
    const nmsIouThreshold = options.nmsIouThreshold ?? 0.45;

    let allCandidates: DetectionResultItem[] = [];

    // Pass 1: Global full-image scan (best for foreground people)
    const globalDetections = this.runSinglePass(imageElement, fullWidth, fullHeight, 0, 0);
    allCandidates.push(...globalDetections);

    // Pass 2: High-Density Multi-Scale Tiling (SAHI)
    // Slices the image into overlapping windows so small/background people
    // occupy larger pixel regions in the neural network's input tensor
    if (crowdMode && fullWidth > 400 && fullHeight > 300) {
      if (!this.offscreenCanvas) {
        this.offscreenCanvas = document.createElement('canvas');
      }

      // Select grid dimensions based on aspect ratio and setting
      let cols = 3;
      let rows = 2;
      if (options.tileGrid === '2x2') {
        cols = 2;
        rows = 2;
      } else if (options.tileGrid === '4x2') {
        cols = 4;
        rows = 2;
      } else {
        // default 3x2: ideal for standard landscape/panoramic photos
        const aspect = fullWidth / fullHeight;
        if (aspect > 2.0) {
          cols = 4;
          rows = 2;
        } else if (aspect < 0.9) {
          cols = 2;
          rows = 3;
        }
      }

      // Overlap factor ~25%
      const overlapX = 0.25;
      const overlapY = 0.25;

      const tileW = Math.round(fullWidth / (cols - (cols - 1) * overlapX));
      const tileH = Math.round(fullHeight / (rows - (rows - 1) * overlapY));

      const stepX = Math.round(tileW * (1 - overlapX));
      const stepY = Math.round(tileH * (1 - overlapY));

      // Fixed tile canvas size for model ingestion
      const canvasTargetW = 640;
      const canvasTargetH = Math.round(640 * (tileH / tileW));
      this.offscreenCanvas.width = canvasTargetW;
      this.offscreenCanvas.height = canvasTargetH;
      const ctx = this.offscreenCanvas.getContext('2d', { willReadFrequently: true });

      if (ctx) {
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const cropX = Math.min(c * stepX, Math.max(0, fullWidth - tileW));
            const cropY = Math.min(r * stepY, Math.max(0, fullHeight - tileH));
            const cropW = Math.min(tileW, fullWidth - cropX);
            const cropH = Math.min(tileH, fullHeight - cropY);

            ctx.clearRect(0, 0, canvasTargetW, canvasTargetH);
            ctx.drawImage(
              imageElement,
              cropX,
              cropY,
              cropW,
              cropH,
              0,
              0,
              canvasTargetW,
              canvasTargetH
            );

            const tileDets = this.runSinglePass(
              this.offscreenCanvas,
              fullWidth,
              fullHeight,
              cropX,
              cropY,
              cropW,
              cropH
            );

            allCandidates.push(...tileDets);
          }
        }
      }
    }

    // Pass 3: Filter by confidence threshold
    const filteredByScore = allCandidates.filter((d) => d.score >= thresholdPercent);

    // Pass 4: Apply Non-Maximum Suppression (NMS) to eliminate duplicate boxes
    const deduplicated = this.applyNMS(filteredByScore, nmsIouThreshold);

    // Pass 5: Cap by maxResults
    const finalDetections = deduplicated.slice(0, maxResults);

    const inferenceTimeMs = Math.round(performance.now() - start);

    return {
      detections: finalDetections,
      inferenceTimeMs,
    };
  }

  private lastVideoTimestampMs: number = -1;

  public resetVideoTimestamp() {
    this.lastVideoTimestampMs = -1;
  }

  public detectVideoFrame(
    videoElement: HTMLVideoElement | HTMLCanvasElement,
    timestampMs: number,
    options: {
      confidenceThreshold?: number;
      maxResults?: number;
      enableTemporalFilter?: boolean;
      minConsecutiveFrames?: number;
    } = {}
  ): {
    detections: DetectionResultItem[];
    inferenceTimeMs: number;
  } {
    if (!this.detector || !videoElement) {
      return { detections: [], inferenceTimeMs: 0 };
    }

    // Check if video element is ready to prevent decoding errors
    if ('readyState' in videoElement && videoElement.readyState < 2) {
      return { detections: [], inferenceTimeMs: 0 };
    }

    const width =
      ('videoWidth' in videoElement ? videoElement.videoWidth : videoElement.width) || 0;
    const height =
      ('videoHeight' in videoElement ? videoElement.videoHeight : videoElement.height) || 0;

    if (width <= 0 || height <= 0) {
      return { detections: [], inferenceTimeMs: 0 };
    }

    // Ensure strictly monotonically increasing integer timestamp for MediaPipe
    const safeTimestamp = Math.max(
      Math.round(timestampMs),
      Math.round(this.lastVideoTimestampMs + 1)
    );
    this.lastVideoTimestampMs = safeTimestamp;

    const start = performance.now();
    let result: any = null;
    try {
      result = this.detector.detectForVideo(videoElement, safeTimestamp);
    } catch (err) {
      console.warn('MediaPipe detectForVideo frame execution warning:', err);
      return { detections: [], inferenceTimeMs: 0 };
    }
    const inferenceTimeMs = Math.round(performance.now() - start);

    const thresholdPercent = Math.round((options.confidenceThreshold ?? 0.25) * 100);
    const maxResults = options.maxResults ?? 80;

    const personDetections: DetectionResultItem[] = [];

    if (result && result.detections) {
      for (const det of result.detections) {
        const primaryCat = det.categories[0];
        const catName = primaryCat?.categoryName?.toLowerCase() || '';
        if (catName === 'person' || catName === '') {
          const score = Math.round((primaryCat?.score || 0) * 100);
          if (score < thresholdPercent) continue;

          const bb = det.boundingBox;
          if (!bb) continue;

          const originX = Math.max(0, bb.originX);
          const originY = Math.max(0, bb.originY);
          const bbWidth = Math.min(width - originX, bb.width);
          const bbHeight = Math.min(height - originY, bb.height);

          const normX = originX / width;
          const normY = originY / height;
          const normW = bbWidth / width;
          const normH = bbHeight / height;

          personDetections.push({
            categoryName: 'Person',
            score,
            box: {
              originX,
              originY,
              width: bbWidth,
              height: bbHeight,
              normalizedX: normX,
              normalizedY: normY,
              normalizedWidth: normW,
              normalizedHeight: normH,
            },
            center: {
              x: normX + normW / 2,
              y: normY + normH / 2,
            },
          });
        }
      }
    }

    const deduplicated = this.applyNMS(personDetections, 0.45);

    // Temporal Consistency Filter:
    // Requires a candidate person detection to persist across a minimum number of consecutive frames
    // (default: 5 consecutive frames) before it is confirmed and added to the count.
    const useTemporal = options.enableTemporalFilter !== false;
    const minConsecutiveFrames = Math.max(1, options.minConsecutiveFrames ?? 5);

    const filteredDetections = useTemporal
      ? this.applyTemporalConsistencyFilter(deduplicated, minConsecutiveFrames)
      : deduplicated;

    return {
      detections: filteredDetections.slice(0, maxResults),
      inferenceTimeMs,
    };
  }

  public getActiveDelegate(): DelegateType {
    return this.currentDelegate;
  }

  public getActiveModel(): ModelType {
    return this.currentModel;
  }

  public destroy() {
    if (this.detector) {
      try {
        this.detector.close();
      } catch (e) {
        console.warn('Error closing detector:', e);
      }
      this.detector = null;
    }
  }
}

export const detectorService = new DetectorService();
