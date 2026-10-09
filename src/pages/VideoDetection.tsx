import React, { useEffect, useRef, useState } from 'react';
import {
  Download,
  FileSpreadsheet,
  FileVideo,
  Layers,
  Loader2,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  Shield,
  Sliders,
  Sparkles,
  Users,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { DetectionCanvas } from '../components/DetectionCanvas';
import { DetectionControls } from '../components/DetectionControls';
import { FileUploader } from '../components/FileUploader';
import { PerformancePanel } from '../components/PerformancePanel';
import { RoiControls } from '../components/RoiControls';
import { StatisticsCards } from '../components/StatisticsCards';
import { useDetection } from '../hooks/useDetection';
import { detectorService } from '../services/detectorService';
import { exportService } from '../services/exportService';
import { storageService } from '../services/storageService';
import type { DetectorSettings } from '../types/detection';

const SAMPLE_VIDEOS = [
  {
    name: 'Pedestrians Crossing',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    description: 'City video sample with moving human subjects and outdoor scenery',
  },
  {
    name: 'Action Sequence',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
    description: 'Dynamic movement sequence for testing real-time tracking algorithms',
  },
];

export const VideoDetection: React.FC = () => {
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

  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoName, setVideoName] = useState<string>('');
  const [videoSize, setVideoSize] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState<boolean>(false);
  const [isEditingRoi, setIsEditingRoi] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Initialize detector for video frames
  useEffect(() => {
    initDetector('VIDEO');
  }, [initDetector]);

  // Handle play/pause detection hook
  useEffect(() => {
    if (isPlaying && videoRef.current && isReady) {
      detectorService.resetVideoTimestamp();
      startVideoDetection(videoRef.current);
    } else {
      stopVideoDetection();
    }
  }, [isPlaying, isReady, startVideoDetection, stopVideoDetection]);

  const handleFileSelected = (file: File) => {
    stopVideoDetection();
    detectorService.resetVideoTimestamp();
    resetStats();
    setVideoName(file.name);
    setVideoSize((file.size / (1024 * 1024)).toFixed(1) + ' MB');
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    setIsPlaying(false);
  };

  const handleSampleSelected = (url: string, name: string) => {
    stopVideoDetection();
    detectorService.resetVideoTimestamp();
    resetStats();
    setVideoName(name);
    setVideoSize('Sample Video');
    setVideoUrl(url);
    setIsPlaying(false);
  };

  const handleResetVideo = () => {
    stopVideoDetection();
    detectorService.resetVideoTimestamp();
    resetStats();
    setVideoUrl(null);
    setVideoName('');
    setVideoSize('');
    setIsPlaying(false);
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused || videoRef.current.ended) {
      detectorService.resetVideoTimestamp();
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const time = parseFloat(e.target.value);
    videoRef.current.currentTime = time;
    setCurrentTime(time);
    detectorService.resetVideoTimestamp();
  };

  const handleRestart = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = 0;
    setCurrentTime(0);
    detectorService.resetVideoTimestamp();
    resetStats();
    videoRef.current.play();
    setIsPlaying(true);
  };

  const handleCaptureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;
    exportService.downloadAnnotatedFrame(videoRef.current, canvasRef.current, 'video-frame-capture');

    storageService.addHistory({
      sourceType: 'video',
      title: videoName || 'Video Session',
      peopleCount: countingStats.currentCount,
      maxPeople: countingStats.maxCount,
      avgConfidence:
        detections.length > 0
          ? Math.round(detections.reduce((a, b) => a + b.score, 0) / detections.length)
          : 0,
      durationSeconds: Math.round(currentTime),
      inferenceTimeMs: performanceMetrics.inferenceTimeMs,
      details: {
        model: performanceMetrics.modelName,
        delegate: performanceMetrics.delegate,
      },
    });
  };

  const handleExportCsv = () => {
    exportService.exportDetectionsToCsv(detections, {
      sourceType: 'Recorded Video',
      filename: videoName,
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
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
            Video Human Detection & Crowd Analysis
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Frame-by-frame person detection, temporal tracking IDs, and dynamic population statistics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {videoUrl && (
            <>
              <button
                type="button"
                onClick={handleCaptureFrame}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:border-slate-400 rounded-md transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-sky-500" />
                <span>Capture Frame</span>
              </button>
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
                onClick={handleResetVideo}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-md transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Change Video</span>
              </button>
            </>
          )}

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
              {loadingStage || 'Configuring Video Engine...'}
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

      {/* Quick Sensitivity Toolbar for Video */}
      {videoUrl && (
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
              Video Threshold:
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
      )}

      {/* Main Grid: Viewport + Telemetry Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Video Viewport or Uploader */}
        <div className="lg:col-span-8 space-y-4">
          {!videoUrl ? (
            <FileUploader
              accept="video/mp4,video/webm,video/ogg"
              mediaType="video"
              onFileSelected={handleFileSelected}
              onSampleSelected={handleSampleSelected}
              samples={SAMPLE_VIDEOS}
            />
          ) : (
            <div className="space-y-3">
              {/* ROI Polygon Controls when active */}
              {settings.enableRoi && (
                <RoiControls
                  settings={settings}
                  onUpdateSettings={updateSettings}
                  isEditingRoi={isEditingRoi}
                  onToggleEditRoi={() => setIsEditingRoi(!isEditingRoi)}
                />
              )}

              {/* Media Viewport */}
              <div className="relative w-full aspect-video bg-slate-900 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-center">
                <video
                  ref={videoRef}
                  src={videoUrl}
                  crossOrigin="anonymous"
                  playsInline
                  muted={isMuted}
                  onTimeUpdate={() => {
                    if (videoRef.current) {
                      setCurrentTime(videoRef.current.currentTime);
                    }
                  }}
                  onLoadedMetadata={() => {
                    if (videoRef.current) {
                      setDuration(videoRef.current.duration);
                    }
                  }}
                  onEnded={() => setIsPlaying(false)}
                  className="w-full h-full object-contain"
                />

                {/* Real-time Detection Overlay Canvas */}
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

                {/* Telemetry pill overlay */}
                <div className="absolute top-3 left-3 flex items-center gap-2 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-xs text-white z-20 pointer-events-none">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>
                    People Count:{' '}
                    <span className="font-mono text-sky-400 font-extrabold text-sm">
                      {countingStats.currentCount}
                    </span>
                  </span>
                  {settings.enableRoi && (
                    <>
                      <span className="text-slate-500">|</span>
                      <span className="text-cyan-400 text-[11px] font-semibold">
                        ROI Mask Active
                      </span>
                    </>
                  )}
                  <span className="text-slate-500">|</span>
                  <span className="font-mono text-slate-300">{performanceMetrics.fps} FPS</span>
                </div>
              </div>

              {/* Video Player Scrubber & Controls */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 space-y-2">
                {/* Progress bar */}
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[11px] text-slate-500">
                    {formatTime(currentTime)}
                  </span>
                  <input
                    type="range"
                    min="0"
                    max={duration || 100}
                    step="0.1"
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
                  />
                  <span className="font-mono text-[11px] text-slate-500">
                    {formatTime(duration)}
                  </span>
                </div>

                {/* Playback action buttons */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={togglePlay}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-md transition-colors cursor-pointer"
                    >
                      {isPlaying ? (
                        <>
                          <Pause className="w-3.5 h-3.5" /> Pause
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5" /> Play & Detect
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleRestart}
                      className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md cursor-pointer"
                      title="Restart video from beginning"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsMuted(!isMuted)}
                      className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md cursor-pointer"
                      title={isMuted ? 'Unmute' : 'Mute'}
                    >
                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="text-xs text-slate-500 font-mono">
                    {videoName} ({videoSize})
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Detection Summary Card */}
          {videoUrl && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Video Crowd Analysis Summary
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <div className="text-slate-500 dark:text-slate-400 text-[11px]">Current People</div>
                  <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                    {countingStats.currentCount}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 dark:text-slate-400 text-[11px]">Maximum People</div>
                  <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                    {countingStats.maxCount}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 dark:text-slate-400 text-[11px]">Average People</div>
                  <div className="text-2xl font-black font-mono text-sky-600 dark:text-sky-400">
                    {countingStats.averageCount}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 dark:text-slate-400 text-[11px]">Processing FPS</div>
                  <div className="text-2xl font-black font-mono text-indigo-500">
                    {performanceMetrics.fps}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Statistics & Performance & Settings */}
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
