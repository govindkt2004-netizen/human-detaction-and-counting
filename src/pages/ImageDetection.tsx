import React, { useEffect, useRef, useState } from 'react';
import {
  Check,
  Download,
  FileSpreadsheet,
  Image as ImageIcon,
  Layers,
  Loader2,
  RefreshCw,
  Shield,
  Sliders,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react';
import { DetectionCanvas } from '../components/DetectionCanvas';
import { DetectionControls } from '../components/DetectionControls';
import { FileUploader } from '../components/FileUploader';
import { PerformancePanel } from '../components/PerformancePanel';
import { RoiControls } from '../components/RoiControls';
import { StatisticsCards } from '../components/StatisticsCards';
import { useDetection } from '../hooks/useDetection';
import { MODEL_NAMES } from '../services/detectorService';
import { exportService } from '../services/exportService';
import { storageService } from '../services/storageService';
import type { DetectorSettings, ModelType } from '../types/detection';

const SAMPLE_IMAGES = [
  {
    name: 'Ancient Historical Courtyard',
    url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1400&q=80',
    description: 'High-density historical gathering with background crowds and artisans',
  },
  {
    name: 'Outdoor Public Gathering',
    url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
    description: 'Multiple people seated and standing in a public venue',
  },
  {
    name: 'Dense Urban Street',
    url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80',
    description: 'Crowd of pedestrians walking together in an urban plaza',
  },
];

export const ImageDetection: React.FC = () => {
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
    detectImage,
    resetStats,
  } = useDetection('IMAGE');

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string>('');
  const [imageSize, setImageSize] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState<boolean>(false);
  const [isEditingRoi, setIsEditingRoi] = useState<boolean>(false);

  const imgRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Initialize detector for static images
  useEffect(() => {
    initDetector('IMAGE');
  }, [initDetector]);

  const runDetectionOnImage = async (imgEl: HTMLImageElement, customSettings?: Partial<DetectorSettings>) => {
    setIsProcessing(true);
    try {
      const res = await detectImage(imgEl, customSettings);

      storageService.addHistory({
        sourceType: 'image',
        title: imageName || 'Uploaded Image',
        peopleCount: res.stats.currentCount,
        maxPeople: res.stats.currentCount,
        avgConfidence: res.avgConfidence,
        inferenceTimeMs: res.inferenceTimeMs,
        details: {
          model: performanceMetrics.modelName,
          delegate: performanceMetrics.delegate,
        },
      });
    } catch (e) {
      console.error('Image processing error:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileSelected = (file: File) => {
    resetStats();
    setImageName(file.name);
    setImageSize((file.size / 1024).toFixed(1) + ' KB');
    const url = URL.createObjectURL(file);
    setImageUrl(url);
  };

  const handleSampleSelected = (url: string, name: string) => {
    resetStats();
    setImageName(name);
    setImageSize('Sample Image');
    setImageUrl(url);
  };

  const handleResetImage = () => {
    setImageUrl(null);
    setImageName('');
    setImageSize('');
    resetStats();
  };

  const handleDownloadAnnotated = () => {
    if (!imgRef.current || !canvasRef.current) return;
    exportService.downloadAnnotatedFrame(imgRef.current, canvasRef.current, `image-detect-${imageName || 'result'}`);
  };

  const handleExportCsv = () => {
    exportService.exportDetectionsToCsv(detections, {
      sourceType: 'Static Image',
      filename: imageName,
      inferenceTimeMs: performanceMetrics.inferenceTimeMs,
    });
  };

  const handleQuickPreset = (preset: 'crowd' | 'standard' | 'ultra') => {
    let newS: Partial<DetectorSettings> = {};
    if (preset === 'crowd') {
      newS = {
        confidenceThreshold: 0.25,
        maxResults: 60,
        crowdMode: true,
        tileGrid: '3x2',
        nmsIouThreshold: 0.45,
      };
    } else if (preset === 'standard') {
      newS = {
        confidenceThreshold: 0.45,
        maxResults: 25,
        crowdMode: false,
      };
    } else if (preset === 'ultra') {
      newS = {
        confidenceThreshold: 0.15,
        maxResults: 100,
        crowdMode: true,
        tileGrid: '4x2',
        nmsIouThreshold: 0.4,
      };
    }

    updateSettings(newS);
    if (imgRef.current) {
      runDetectionOnImage(imgRef.current, newS);
    }
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
            Image Human Detection & Crowd Counting
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Identify all individuals in single photos, including dense crowds, small background figures, and seated artisans.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {imageUrl && (
            <>
              <button
                type="button"
                onClick={handleDownloadAnnotated}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:border-slate-400 rounded-md transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-sky-500" />
                <span>Save Image</span>
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
                onClick={handleResetImage}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-md transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset</span>
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
              {loadingStage || 'Initializing Model...'}
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

      {/* Quick Action Toolbar for Group Images (Always Visible when image loaded) */}
      {imageUrl && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mr-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Quick Tuning:
            </span>
            <button
              type="button"
              onClick={() => handleQuickPreset('crowd')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md border flex items-center gap-1.5 transition-all cursor-pointer ${
                settings.crowdMode && settings.confidenceThreshold === 0.25
                  ? 'bg-emerald-500 text-white border-emerald-600 shadow-xs'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Group & Crowd Mode (25%)</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickPreset('ultra')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md border flex items-center gap-1.5 transition-all cursor-pointer ${
                settings.crowdMode && settings.confidenceThreshold === 0.15
                  ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                  : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-100'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Ultra Recall / Small Figures (15%)</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickPreset('standard')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-all cursor-pointer ${
                !settings.crowdMode
                  ? 'bg-slate-800 text-white border-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <span>Standard (45%)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const nextRoi = !settings.enableRoi;
                updateSettings({ enableRoi: nextRoi });
                if (imgRef.current) {
                  runDetectionOnImage(imgRef.current, { enableRoi: nextRoi });
                }
              }}
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

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 flex-1 md:flex-initial">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400 shrink-0">
                Confidence:
              </span>
              <input
                type="range"
                min="0.10"
                max="0.80"
                step="0.05"
                value={settings.confidenceThreshold}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  updateSettings({ confidenceThreshold: val });
                  if (imgRef.current) {
                    runDetectionOnImage(imgRef.current, { confidenceThreshold: val });
                  }
                }}
                className="w-28 sm:w-36 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
              />
              <span className="font-mono text-xs font-bold text-sky-600 dark:text-sky-400 w-10 text-right">
                {Math.round(settings.confidenceThreshold * 100)}%
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                if (imgRef.current) {
                  runDetectionOnImage(imgRef.current);
                }
              }}
              disabled={isProcessing}
              className="px-3 py-1.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 active:bg-sky-700 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
              <span>Re-Scan</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Image Viewport or Uploader */}
        <div className="lg:col-span-8 space-y-4">
          {!imageUrl ? (
            <FileUploader
              accept="image/jpeg,image/png,image/webp,image/jpg"
              mediaType="image"
              onFileSelected={handleFileSelected}
              onSampleSelected={handleSampleSelected}
              samples={SAMPLE_IMAGES}
            />
          ) : (
            <div className="space-y-3">
              {/* ROI Polygon Controls when active */}
              {settings.enableRoi && (
                <RoiControls
                  settings={settings}
                  onUpdateSettings={(newS) => {
                    updateSettings(newS);
                    if (imgRef.current) {
                      runDetectionOnImage(imgRef.current, newS);
                    }
                  }}
                  isEditingRoi={isEditingRoi}
                  onToggleEditRoi={() => setIsEditingRoi(!isEditingRoi)}
                />
              )}

              {/* Media Container */}
              <div className="relative w-full max-h-[640px] bg-slate-900 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-center">
                <img
                  ref={imgRef}
                  src={imageUrl}
                  alt="Detection Subject"
                  crossOrigin="anonymous"
                  onLoad={(e) => runDetectionOnImage(e.currentTarget)}
                  className="max-h-[640px] w-auto h-auto object-contain mx-auto block"
                />

                {/* Canvas Overlay with ROI Polygon interaction */}
                <DetectionCanvas
                  mediaElement={imgRef.current}
                  detections={detections}
                  settings={settings}
                  onCanvasRef={(c) => {
                    canvasRef.current = c;
                  }}
                  isEditingRoi={isEditingRoi}
                  onUpdateRoiPolygon={(newPoly) => {
                    updateSettings({ roiPolygon: newPoly, enableRoi: true });
                    if (imgRef.current) {
                      runDetectionOnImage(imgRef.current, { roiPolygon: newPoly, enableRoi: true });
                    }
                  }}
                />

                {/* Processing Spinner Overlay */}
                {isProcessing && (
                  <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex flex-col items-center justify-center text-white z-20 space-y-2">
                    <Loader2 className="w-8 h-8 animate-spin text-sky-400" />
                    <span className="text-xs font-semibold">
                      {settings.crowdMode
                        ? `Executing Multi-Scale Crowd Scan (${settings.tileGrid} tiles + NMS)...`
                        : 'Detecting Human Figures...'}
                    </span>
                  </div>
                )}

                {/* Floating Headcount Badge */}
                <div className="absolute top-3 left-3 flex items-center gap-2 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-xs text-white z-20 pointer-events-none">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>
                    People Count:{' '}
                    <span className="font-mono text-sky-400 font-extrabold text-sm">
                      {detections.length}
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
                  {settings.crowdMode && (
                    <>
                      <span className="text-slate-500">|</span>
                      <span className="text-emerald-400 text-[11px] font-semibold">
                        Multi-Scale SAHI Active
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* File Info Bar */}
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1 font-mono">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-3.5 h-3.5 text-sky-500" />
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{imageName}</span>
                  <span>·</span>
                  <span>{imageSize}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {detections.length} {detections.length === 1 ? 'person' : 'people'} identified
                  </span>
                  <span>·</span>
                  <span>Avg Conf: {avgConfidence}%</span>
                </div>
              </div>
            </div>
          )}

          {/* Detection Summary Card */}
          {imageUrl && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Headcount Analysis Summary
                </h4>
                {settings.crowdMode && (
                  <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/60">
                    Slicing Aided Hyper Inference (SAHI) Enabled
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <div className="text-slate-500 dark:text-slate-400 text-[11px]">People Detected</div>
                  <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                    {detections.length}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 dark:text-slate-400 text-[11px]">Average Confidence</div>
                  <div className="text-2xl font-black font-mono text-sky-600 dark:text-sky-400">
                    {avgConfidence}%
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 dark:text-slate-400 text-[11px]">Scan Latency</div>
                  <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                    {performanceMetrics.inferenceTimeMs} ms
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 dark:text-slate-400 text-[11px]">Detection Engine</div>
                  <div className="text-sm font-bold font-mono text-indigo-500 mt-1">
                    {performanceMetrics.delegate} ({settings.model.split('_')[0]})
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
            showLineCrossings={false}
          />

          <PerformancePanel metrics={performanceMetrics} />

          {/* Quick Settings drawer/panel */}
          {showSettingsDrawer && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5">
              <DetectionControls
                settings={settings}
                onUpdateSettings={(newS) => {
                  updateSettings(newS);
                  if (imgRef.current) {
                    runDetectionOnImage(imgRef.current, newS);
                  }
                }}
                gpuAvailable={performanceMetrics.gpuAvailable}
                activeDelegate={performanceMetrics.delegate}
                isImageMode={true}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
