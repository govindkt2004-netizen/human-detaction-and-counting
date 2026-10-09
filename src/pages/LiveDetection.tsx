import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Camera,
  Download,
  FileSpreadsheet,
  Layers,
  Loader2,
  Maximize2,
  RefreshCw,
  Shield,
  Sliders,
  Sparkles,
  Users,
} from 'lucide-react';
import { CameraControls } from '../components/CameraControls';
import { DetectionCanvas } from '../components/DetectionCanvas';
import { DetectionControls } from '../components/DetectionControls';
import { PerformancePanel } from '../components/PerformancePanel';
import { RoiControls } from '../components/RoiControls';
import { StatisticsCards } from '../components/StatisticsCards';
import { useCamera } from '../hooks/useCamera';
import { useDetection } from '../hooks/useDetection';
import { detectorService } from '../services/detectorService';
import { exportService } from '../services/exportService';
import { storageService } from '../services/storageService';
import type { DetectorSettings } from '../types/detection';

export const LiveDetection: React.FC = () => {
  const { videoRef, cameraState, startCamera, stopCamera, togglePause } = useCamera();
  const {
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
    startVideoDetection,
    stopVideoDetection,
    resetStats,
  } = useDetection('VIDEO');

  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);
  const [isEditingRoi, setIsEditingRoi] = useState(false);
  const sessionStartTimeRef = useRef<number | null>(null);

  // Initialize detector on mount
  useEffect(() => {
    initDetector('VIDEO');
  }, [initDetector]);

  // Hook detection loop to active video element
  useEffect(() => {
    if (cameraState.isActive && !cameraState.isPaused && videoRef.current && isReady) {
      detectorService.resetVideoTimestamp();
      startVideoDetection(videoRef.current);
      if (!sessionStartTimeRef.current) {
        sessionStartTimeRef.current = Date.now();
      }
    } else {
      stopVideoDetection();
    }
  }, [cameraState.isActive, cameraState.isPaused, isReady, startVideoDetection, stopVideoDetection, videoRef]);

  // Handle capture frame
  const handleCaptureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;
    exportService.downloadAnnotatedFrame(videoRef.current, canvasRef.current, 'webcam-capture');

    storageService.addHistory({
      sourceType: 'webcam',
      title: 'Live Camera Capture',
      peopleCount: countingStats.currentCount,
      maxPeople: countingStats.maxCount,
      avgConfidence:
        detections.length > 0
          ? Math.round(detections.reduce((a, b) => a + b.score, 0) / detections.length)
          : 0,
      inferenceTimeMs: performanceMetrics.inferenceTimeMs,
      details: {
        model: performanceMetrics.modelName,
        delegate: performanceMetrics.delegate,
      },
    });
  };

  const handleExportCsv = () => {
    exportService.exportDetectionsToCsv(detections, {
      sourceType: 'Webcam Live Stream',
      fps: performanceMetrics.fps,
      inferenceTimeMs: performanceMetrics.inferenceTimeMs,
    });
  };

  const handleQuickPreset = (preset: 'crowd' | 'ultra' | 'standard') => {
    let newS: Partial<DetectorSettings> = {};
    if (preset === 'crowd') {
      newS = {
        confidenceThreshold: 0.25,
        maxResults: 60,
      };
    } else if (preset === 'ultra') {
      newS = {
        confidenceThreshold: 0.15,
        maxResults: 80,
      };
    } else if (preset === 'standard') {
      newS = {
        confidenceThreshold: 0.45,
        maxResults: 25,
      };
    }
    updateSettings(newS);
  };

  const avgConfidence =
    detections.length > 0
      ? Math.round(detections.reduce((a, b) => a + b.score, 0) / detections.length)
      : 0;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner / Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Live Webcam Detection & Crowd Counting
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time human body detection, bounding boxes, persistent trajectory IDs, and group headcount.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={detections.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:border-slate-400 rounded-md transition-colors disabled:opacity-40 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={() => setShowSettingsDrawer(!showSettingsDrawer)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:border-sky-500 rounded-md transition-colors cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5 text-sky-500" />
            <span>{showSettingsDrawer ? 'Hide Settings' : 'Settings'}</span>
          </button>
        </div>
      </div>

      {/* Model Loading State Banner */}
      {isModelLoading && (
        <div className="bg-sky-500/10 border border-sky-500/20 rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-sky-700 dark:text-sky-300 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-sky-500" />
              {loadingStage || 'Initializing Computer Vision Model...'}
            </span>
            <span className="font-mono text-sky-600 dark:text-sky-400 font-bold">
              {loadingProgress}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-sky-200 dark:bg-sky-950 rounded-full overflow-hidden">
            <div
              className="h-full bg-sky-500 transition-all duration-300 ease-out"
              style={{ width: `${loadingProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Quick Sensitivity / Crowd Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 mr-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Sensitivity Preset:
          </span>
          <button
            type="button"
            onClick={() => handleQuickPreset('crowd')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md border flex items-center gap-1.5 transition-all cursor-pointer ${
              settings.confidenceThreshold === 0.25
                ? 'bg-emerald-500 text-white border-emerald-600 shadow-xs'
                : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Group & Crowd (25%)</span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickPreset('ultra')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md border flex items-center gap-1.5 transition-all cursor-pointer ${
              settings.confidenceThreshold === 0.15
                ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Ultra Recall (15%)</span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickPreset('standard')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-all cursor-pointer ${
              settings.confidenceThreshold >= 0.4
                ? 'bg-slate-800 text-white border-slate-900'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <span>Standard (45%)</span>
          </button>

          <button
            type="button"
            onClick={() => updateSettings({ enableRoi: !settings.enableRoi })}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md border flex items-center gap-1.5 transition-all cursor-pointer ${
              settings.enableRoi
                ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-cyan-500'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>ROI Polygon {settings.enableRoi ? '(Active)' : '(Off)'}</span>
          </button>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400 shrink-0">
            Live Threshold:
          </span>
          <input
            type="range"
            min="0.10"
            max="0.80"
            step="0.05"
            value={settings.confidenceThreshold}
            onChange={(e) => updateSettings({ confidenceThreshold: parseFloat(e.target.value) })}
            className="w-28 sm:w-36 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
          />
          <span className="font-mono text-xs font-bold text-sky-600 dark:text-sky-400 w-10 text-right">
            {Math.round(settings.confidenceThreshold * 100)}%
          </span>
        </div>
      </div>

      {/* Error state */}
      {(cameraState.error || modelError) && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <span className="font-semibold text-rose-800 dark:text-rose-300">
              Camera / Device Notification
            </span>
            <p className="text-rose-700 dark:text-rose-400">
              {cameraState.error || modelError}
            </p>
          </div>
        </div>
      )}

      {/* Main Grid: Viewport + Telemetry Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Camera Viewport */}
        <div className="lg:col-span-8 space-y-4">
          {/* ROI Polygon Controls when active */}
          {settings.enableRoi && (
            <RoiControls
              settings={settings}
              onUpdateSettings={updateSettings}
              isEditingRoi={isEditingRoi}
              onToggleEditRoi={() => setIsEditingRoi(!isEditingRoi)}
            />
          )}

          <div
            ref={containerRef}
            className="relative w-full aspect-video bg-slate-900 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-center"
          >
            {/* Real HTML5 Video element */}
            <video
              ref={videoRef}
              playsInline
              autoPlay
              muted
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                cameraState.isActive ? 'opacity-100' : 'opacity-0'
              }`}
            />

            {/* Real-time Detection Overlay Canvas */}
            {cameraState.isActive && (
              <DetectionCanvas
                mediaElement={videoRef.current}
                detections={detections}
                settings={settings}
                onCanvasRef={(c) => {
                  canvasRef.current = c;
                }}
                isEditingRoi={isEditingRoi}
                onUpdateRoiPolygon={(newPoly) =>
                  updateSettings({ roiPolygon: newPoly, enableRoi: true })
                }
              />
            )}

            {/* Offline / Standby State Placeholder */}
            {!cameraState.isActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-4 bg-slate-900/90 text-white">
                <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-sky-400">
                  <Camera className="w-8 h-8" />
                </div>
                <div className="max-w-md space-y-1">
                  <h3 className="text-base font-semibold text-white">
                    Webcam is Inactive
                  </h3>
                  <p className="text-xs text-slate-400">
                    Click 'Start Camera' to grant camera access and begin real-time person detection and counting.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => startCamera()}
                  disabled={cameraState.isLoading || isModelLoading}
                  className="px-5 py-2.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg shadow-sm transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>Start Camera Now</span>
                </button>
              </div>
            )}

            {/* Top Telemetry Overlay Badge on active camera */}
            {cameraState.isActive && (
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-20">
                <div className="flex items-center gap-2 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-semibold text-white">
                    People: <span className="font-mono text-sky-400 font-extrabold text-sm">{countingStats.currentCount}</span>
                  </span>
                  <span className="text-slate-500">|</span>
                  <span className="font-mono text-slate-300">{performanceMetrics.fps} FPS</span>
                  <span className="text-slate-500">|</span>
                  <span className="font-mono text-slate-300">{performanceMetrics.inferenceTimeMs} ms</span>
                </div>

                <div className="bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-md border border-slate-800 text-[11px] font-mono text-sky-300">
                  {settings.delegate} · {settings.model.split('_')[0].toUpperCase()}
                </div>
              </div>
            )}
          </div>

          {/* Camera controls toolbar */}
          <CameraControls
            cameraState={cameraState}
            onStartCamera={(id) => startCamera(id)}
            onStopCamera={stopCamera}
            onTogglePause={togglePause}
            onCaptureFrame={handleCaptureFrame}
            onResetStats={resetStats}
          />
        </div>

        {/* Right Column: Statistics & Performance */}
        <div className="lg:col-span-4 space-y-4">
          <StatisticsCards
            stats={countingStats}
            avgConfidence={avgConfidence}
            showLineCrossings={settings.showCountingLine}
          />

          <PerformancePanel metrics={performanceMetrics} />

          {/* Quick Settings drawer/panel */}
          {showSettingsDrawer && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5">
              <DetectionControls
                settings={settings}
                onUpdateSettings={updateSettings}
                gpuAvailable={performanceMetrics.gpuAvailable}
                activeDelegate={performanceMetrics.delegate}
                isImageMode={false}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
