import { useCallback, useEffect, useRef, useState } from 'react';
import { analyticsService } from '../services/analyticsService';
import { detectorService, MODEL_NAMES } from '../services/detectorService';
import { DEFAULT_SETTINGS, storageService } from '../services/storageService';
import { trackingService } from '../services/trackingService';
import type {
  CountingStats,
  DetectionResultItem,
  DetectorSettings,
  PerformanceMetrics,
  RunningMode,
} from '../types/detection';

export function useDetection(initialMode: RunningMode = 'VIDEO') {
  const [settings, setSettings] = useState<DetectorSettings>(() => storageService.getSettings());
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStage, setLoadingStage] = useState('');
  const [modelError, setModelError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  const [detections, setDetections] = useState<DetectionResultItem[]>([]);
  const [countingStats, setCountingStats] = useState<CountingStats>({
    currentCount: 0,
    maxCount: 0,
    minCount: 0,
    averageCount: 0,
    totalUniqueTracked: 0,
    lineCrossings: { entered: 0, exited: 0, inside: 0 },
  });

  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    fps: 0,
    inferenceTimeMs: 0,
    processingState: 'idle',
    delegate: settings.delegate,
    modelName: MODEL_NAMES[settings.model],
    gpuAvailable: detectorService.isGpuSupported(),
  });

  // Animation frame loop refs
  const animationFrameRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(performance.now());
  const frameCountRef = useRef<number>(0);
  const lastFpsCalcRef = useRef<number>(performance.now());
  const isDetectingRef = useRef<boolean>(false);
  const lastTimestampVideoRef = useRef<number>(-1);

  // Initialize or reconfigure detector
  const initDetector = useCallback(
    async (mode: RunningMode = initialMode, forcedSettings?: Partial<DetectorSettings>) => {
      const activeSettings = { ...settings, ...forcedSettings };
      setIsModelLoading(true);
      setModelError(null);
      setLoadingProgress(10);
      setLoadingStage('Preparing vision pipeline...');

      detectorService.setProgressCallback((prog, stage) => {
        setLoadingProgress(prog);
        setLoadingStage(stage);
      });

      try {
        await detectorService.initialize(
          mode,
          activeSettings.model,
          activeSettings.delegate,
          activeSettings.confidenceThreshold,
          activeSettings.maxResults
        );

        setIsReady(true);
        setPerformanceMetrics((prev) => ({
          ...prev,
          delegate: detectorService.getActiveDelegate(),
          modelName: MODEL_NAMES[detectorService.getActiveModel()],
          gpuAvailable: detectorService.isGpuSupported(),
          processingState: 'idle',
        }));
      } catch (err: any) {
        console.error('Detector init failed:', err);
        setModelError(err.message || 'Failed to initialize detection model.');
        setIsReady(false);
      } finally {
        setIsModelLoading(false);
      }
    },
    [initialMode, settings]
  );

  // Update a single setting
  const updateSettings = useCallback(
    (newSettings: Partial<DetectorSettings>) => {
      setSettings((prev) => {
        const next = { ...prev, ...newSettings };
        storageService.saveSettings(next);

        // If model or delegate changed, trigger re-initialization
        if (
          newSettings.model !== undefined ||
          newSettings.delegate !== undefined
        ) {
          initDetector(initialMode, next);
        }

        return next;
      });
    },
    [initDetector, initialMode]
  );

  // Detect single static image
  const detectImage = useCallback(
    async (
      imgElement: HTMLImageElement | HTMLCanvasElement,
      overrideSettings?: Partial<DetectorSettings>
    ) => {
      if (!isReady) {
        await initDetector('IMAGE');
      }

      const activeSettings = { ...settings, ...overrideSettings };

      setPerformanceMetrics((prev) => ({ ...prev, processingState: 'detecting' }));
      try {
        const { detections: rawDets, inferenceTimeMs } = detectorService.detectImage(imgElement, {
          confidenceThreshold: activeSettings.confidenceThreshold,
          maxResults: activeSettings.maxResults,
          crowdMode: activeSettings.crowdMode,
          tileGrid: activeSettings.tileGrid,
          nmsIouThreshold: activeSettings.nmsIouThreshold,
        });

        const { trackedDetections, stats } = trackingService.update(rawDets, {
          enableTracking: activeSettings.showTrackingIds,
          enableCountingLine: false,
          countingLinePosition: activeSettings.countingLinePosition,
          enableZone: activeSettings.showDetectionZone,
          zone: activeSettings.detectionZone,
          enableRoi: activeSettings.enableRoi,
          roiPolygon: activeSettings.roiPolygon,
          roiInvert: activeSettings.roiInvert,
          enableTemporalFilter: false,
          minPersistenceFrames: 1,
        });

        setDetections(trackedDetections);
        setCountingStats(stats);

        const avgScore =
          rawDets.length > 0
            ? Math.round(rawDets.reduce((acc, d) => acc + d.score, 0) / rawDets.length)
            : 0;

        setPerformanceMetrics((prev) => ({
          ...prev,
          inferenceTimeMs,
          fps: inferenceTimeMs > 0 ? Math.round(1000 / inferenceTimeMs) : 0,
          processingState: 'idle',
        }));

        analyticsService.recordDataPoint({
          peopleCount: stats.currentCount,
          fps: inferenceTimeMs > 0 ? Math.round(1000 / inferenceTimeMs) : 0,
          inferenceMs: inferenceTimeMs,
          avgConfidence: avgScore,
        });

        return {
          detections: trackedDetections,
          stats,
          inferenceTimeMs,
          avgConfidence: avgScore,
        };
      } catch (err: any) {
        console.error('Image detection failed:', err);
        setPerformanceMetrics((prev) => ({ ...prev, processingState: 'error' }));
        throw err;
      }
    },
    [initDetector, isReady, settings]
  );

  // Start real-time video/camera detection loop
  const startVideoDetection = useCallback(
    (videoElement: HTMLVideoElement) => {
      if (isDetectingRef.current) return;
      isDetectingRef.current = true;
      lastTimestampVideoRef.current = -1;
      trackingService.reset();

      setPerformanceMetrics((prev) => ({ ...prev, processingState: 'detecting' }));

      let currentFps = 0;
      let lastFrameTime = performance.now();

      const loop = () => {
        if (!isDetectingRef.current) return;

        if (videoElement && videoElement.readyState >= 2 && !videoElement.paused && !videoElement.ended) {
          const now = performance.now();

          // Calculate visual FPS
          frameCountRef.current++;
          if (now - lastFpsCalcRef.current >= 500) {
            const deltaSec = (now - lastFpsCalcRef.current) / 1000;
            currentFps = Math.round(frameCountRef.current / deltaSec);
            frameCountRef.current = 0;
            lastFpsCalcRef.current = now;
          }

          // Use monotonic presentation timestamp
          let videoTime =
            videoElement.currentTime > 0
              ? Math.round(videoElement.currentTime * 1000)
              : Math.round(now);
          if (videoTime <= lastTimestampVideoRef.current) {
            videoTime = lastTimestampVideoRef.current + 1;
          }
          lastTimestampVideoRef.current = videoTime;

          const { detections: rawDets, inferenceTimeMs } = detectorService.detectVideoFrame(
            videoElement,
            videoTime,
            {
              confidenceThreshold: settings.confidenceThreshold,
              maxResults: settings.maxResults,
              enableTemporalFilter: settings.temporalFilter,
              minConsecutiveFrames: settings.minPersistenceFrames ?? 5,
            }
          );

          // detectorService has already performed the 5-frame temporal consistency filter;
          // trackingService now tracks and counts all verified detections immediately.
          const { trackedDetections, stats } = trackingService.update(rawDets, {
            enableTracking: settings.showTrackingIds,
            enableCountingLine: settings.showCountingLine,
            countingLinePosition: settings.countingLinePosition,
            enableZone: settings.showDetectionZone,
            zone: settings.detectionZone,
            enableRoi: settings.enableRoi,
            roiPolygon: settings.roiPolygon,
            roiInvert: settings.roiInvert,
            enableTemporalFilter: false,
            minPersistenceFrames: 1,
          });

          setDetections(trackedDetections);
          setCountingStats(stats);

          const avgScore =
            rawDets.length > 0
              ? Math.round(rawDets.reduce((acc, d) => acc + d.score, 0) / rawDets.length)
              : 0;

          setPerformanceMetrics((prev) => ({
            ...prev,
            fps: currentFps,
            inferenceTimeMs,
            processingState: 'detecting',
            delegate: detectorService.getActiveDelegate(),
          }));

          analyticsService.recordDataPoint({
            peopleCount: stats.currentCount,
            fps: currentFps,
            inferenceMs: inferenceTimeMs,
            avgConfidence: avgScore,
          });
        }

        animationFrameRef.current = requestAnimationFrame(loop);
      };

      animationFrameRef.current = requestAnimationFrame(loop);
    },
    [settings]
  );

  // Stop real-time loop
  const stopVideoDetection = useCallback(() => {
    isDetectingRef.current = false;
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    detectorService.resetTemporalFilter();
    setPerformanceMetrics((prev) => ({
      ...prev,
      processingState: 'idle',
      fps: 0,
    }));
  }, []);

  const resetStats = useCallback(() => {
    detectorService.resetTemporalFilter();
    trackingService.reset();
    setCountingStats({
      currentCount: 0,
      maxCount: 0,
      minCount: 0,
      averageCount: 0,
      totalUniqueTracked: 0,
      lineCrossings: { entered: 0, exited: 0, inside: 0 },
    });
    setDetections([]);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopVideoDetection();
    };
  }, [stopVideoDetection]);

  return {
    settings,
    updateSettings,
    isModelLoading,
    loadingProgress,
    loadingStage,
    modelError,
    isReady,
    detections,
    countingStats,
    performanceMetrics,
    initDetector,
    detectImage,
    startVideoDetection,
    stopVideoDetection,
    resetStats,
  };
}
