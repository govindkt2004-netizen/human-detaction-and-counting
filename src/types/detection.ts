export type RunningMode = 'IMAGE' | 'VIDEO';

export type DelegateType = 'GPU' | 'CPU';

export type ModelType = 'efficientdet_lite0' | 'efficientdet_lite2' | 'mobilenet_v2';

export interface BoundingBox {
  originX: number;
  originY: number;
  width: number;
  height: number;
  // Normalized 0..1 coordinates for responsive drawing
  normalizedX: number;
  normalizedY: number;
  normalizedWidth: number;
  normalizedHeight: number;
}

export interface DetectionResultItem {
  id?: number;
  categoryName: string;
  score: number;
  box: BoundingBox;
  center: { x: number; y: number }; // normalized
  trail?: { x: number; y: number }[];
  firstSeen?: number;
  lastSeen?: number;
  velocity?: { vx: number; vy: number };
}

export interface DetectionFrameResult {
  timestamp: number;
  detections: DetectionResultItem[];
  inferenceTimeMs: number;
  count: number;
  fps: number;
}

export interface RoiPoint {
  x: number;
  y: number;
}

export interface DetectorSettings {
  model: ModelType;
  confidenceThreshold: number;
  maxResults: number;
  delegate: DelegateType;
  crowdMode: boolean; // Enable Multi-Scale Tiling (SAHI) for group/crowd images
  tileGrid: '2x2' | '3x2' | '4x2'; // Tiling resolution for small/distant people
  nmsIouThreshold: number; // Non-Maximum Suppression overlap threshold
  temporalFilter: boolean; // Temporal consistency filter to suppress flickering false-positives
  minPersistenceFrames: number; // Minimum consecutive frames required before confirming a detection
  enableRoi: boolean; // Region of Interest (ROI) polygon mask
  roiPolygon: RoiPoint[]; // Normalized polygon vertices
  roiInvert: boolean; // Invert mask: ignore inside polygon instead of outside
  showBoundingBoxes: boolean;
  showLabels: boolean;
  showTrackingIds: boolean;
  showConfidence: boolean;
  showCentroids: boolean;
  showTrails: boolean;
  showDensityHeatmap: boolean;
  showCorridorVectors: boolean;
  showCountingLine: boolean;
  countingLinePosition: number; // 0..1 vertical fraction
  showDetectionZone: boolean;
  detectionZone: { x: number; y: number; width: number; height: number }; // normalized
}

export interface DensityMetrics {
  crowdingLevel: 'Low' | 'Moderate' | 'Dense' | 'Overcrowded';
  densityIndex: number; // 0..100
  peakSector: string;
}

export interface CorridorMetrics {
  northboundCount: number;
  southboundCount: number;
  activeMovers: number;
  flowRatePerMin: number;
}

export interface CountingStats {
  currentCount: number;
  maxCount: number;
  minCount: number;
  averageCount: number;
  totalUniqueTracked: number;
  lineCrossings: {
    entered: number;
    exited: number;
    inside: number;
  };
  densityMetrics?: DensityMetrics;
  corridorMetrics?: CorridorMetrics;
}

export interface HistoryItem {
  id: string;
  timestamp: string;
  sourceType: 'webcam' | 'image' | 'video';
  title: string;
  peopleCount: number;
  maxPeople?: number;
  avgConfidence: number;
  durationSeconds?: number;
  inferenceTimeMs: number;
  previewThumbnail?: string;
  details?: {
    model: string;
    delegate: string;
    framesProcessed?: number;
  };
}

export interface PerformanceMetrics {
  fps: number;
  inferenceTimeMs: number;
  processingState: 'idle' | 'loading' | 'detecting' | 'paused' | 'error';
  delegate: DelegateType;
  modelName: string;
  gpuAvailable: boolean;
}
