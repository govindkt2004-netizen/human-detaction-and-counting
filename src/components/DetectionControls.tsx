import React from 'react';
import {
  Cpu,
  Eye,
  Grid,
  Layers,
  RotateCcw,
  Scissors,
  Shield,
  ShieldCheck,
  Sliders,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react';
import { MODEL_NAMES } from '../services/detectorService';
import type { DelegateType, DetectorSettings, ModelType } from '../types/detection';
import { ROI_PRESETS } from '../utils/polygonUtils';

interface DetectionControlsProps {
  settings: DetectorSettings;
  onUpdateSettings: (newSettings: Partial<DetectorSettings>) => void;
  gpuAvailable: boolean;
  activeDelegate: DelegateType;
  className?: string;
  isImageMode?: boolean;
}

export const DetectionControls: React.FC<DetectionControlsProps> = ({
  settings,
  onUpdateSettings,
  gpuAvailable,
  activeDelegate,
  className = '',
  isImageMode = true,
}) => {
  // Preset handlers for 1-click optimization
  const applyPreset = (preset: 'standard' | 'crowd' | 'ultra') => {
    if (preset === 'standard') {
      onUpdateSettings({
        confidenceThreshold: 0.45,
        maxResults: 25,
        crowdMode: false,
      });
    } else if (preset === 'crowd') {
      onUpdateSettings({
        confidenceThreshold: 0.25,
        maxResults: 60,
        crowdMode: true,
        tileGrid: '3x2',
        nmsIouThreshold: 0.45,
      });
    } else if (preset === 'ultra') {
      onUpdateSettings({
        confidenceThreshold: 0.15,
        maxResults: 100,
        crowdMode: true,
        tileGrid: '4x2',
        nmsIouThreshold: 0.4,
      });
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-sky-500" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Detection Configuration
          </h3>
        </div>
        <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
          MediaPipe Vision
        </span>
      </div>

      {/* Quick Sensitivity / Crowd Presets */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Detection Mode Preset
          </span>
          <span className="text-[11px] text-slate-500">1-Click Tuning</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => applyPreset('standard')}
            className={`px-2 py-2 text-xs font-medium rounded-md border text-center transition-all ${
              !settings.crowdMode && settings.confidenceThreshold >= 0.4
                ? 'bg-sky-500/10 border-sky-500/50 text-sky-600 dark:text-sky-400 font-semibold'
                : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-400'
            }`}
          >
            <div>Standard</div>
            <div className="text-[10px] text-slate-400">1–5 People</div>
          </button>
          <button
            type="button"
            onClick={() => applyPreset('crowd')}
            className={`px-2 py-2 text-xs font-medium rounded-md border text-center transition-all ${
              settings.crowdMode && settings.confidenceThreshold >= 0.2 && settings.confidenceThreshold < 0.4
                ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-600 dark:text-emerald-400 font-semibold'
                : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-400'
            }`}
          >
            <div>Group & Crowd</div>
            <div className="text-[10px] text-emerald-500">Dense Scenes</div>
          </button>
          <button
            type="button"
            onClick={() => applyPreset('ultra')}
            className={`px-2 py-2 text-xs font-medium rounded-md border text-center transition-all ${
              settings.crowdMode && settings.confidenceThreshold < 0.2
                ? 'bg-amber-500/10 border-amber-500/50 text-amber-600 dark:text-amber-400 font-semibold'
                : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-400'
            }`}
          >
            <div>High Sensitivity</div>
            <div className="text-[10px] text-amber-500">Max Recall</div>
          </button>
        </div>
      </div>

      {/* High-Density Crowd Scanning Toggle (SAHI Multi-Scale Tiling) */}
      {isImageMode && (
        <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                Multi-Scale Crowd Scanning
              </span>
            </div>
            <input
              type="checkbox"
              checked={settings.crowdMode}
              onChange={(e) => onUpdateSettings({ crowdMode: e.target.checked })}
              className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 cursor-pointer"
            />
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            Slices the image into high-resolution overlapping crops (SAHI) so small, distant, and
            occluded individuals in groups are detected rather than missed.
          </p>

          {settings.crowdMode && (
            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-emerald-500/20">
              <button
                type="button"
                onClick={() => onUpdateSettings({ tileGrid: '2x2' })}
                className={`px-2 py-1 text-[11px] rounded border ${
                  settings.tileGrid === '2x2'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold'
                    : 'bg-white/60 dark:bg-slate-900/60 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                2×2 Grid
              </button>
              <button
                type="button"
                onClick={() => onUpdateSettings({ tileGrid: '3x2' })}
                className={`px-2 py-1 text-[11px] rounded border ${
                  settings.tileGrid === '3x2'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold'
                    : 'bg-white/60 dark:bg-slate-900/60 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                3×2 (Optimal)
              </button>
              <button
                type="button"
                onClick={() => onUpdateSettings({ tileGrid: '4x2' })}
                className={`px-2 py-1 text-[11px] rounded border ${
                  settings.tileGrid === '4x2'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold'
                    : 'bg-white/60 dark:bg-slate-900/60 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                4×2 Panoramic
              </button>
            </div>
          )}
        </div>
      )}

      {/* Temporal Consistency Filter for Video & Live Webcam */}
      {!isImageMode && (
        <div className="p-3 bg-sky-500/5 border border-sky-500/20 rounded-lg space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                Temporal Consistency Filter
              </span>
            </div>
            <input
              type="checkbox"
              checked={settings.temporalFilter}
              onChange={(e) => onUpdateSettings({ temporalFilter: e.target.checked })}
              className="rounded text-sky-600 focus:ring-sky-500 w-4 h-4 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 cursor-pointer"
            />
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            Requires a detection to persist across a minimum number of consecutive frames before
            confirming and counting, suppressing optical flickering and transient false-positives.
          </p>

          {settings.temporalFilter && (
            <div className="pt-2 border-t border-sky-500/20 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-400 text-[11px]">
                  Persistence Requirement:
                </span>
                <span className="font-mono text-xs font-bold text-sky-600 dark:text-sky-400">
                  {settings.minPersistenceFrames} {settings.minPersistenceFrames === 1 ? 'frame' : 'frames'}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[1, 3, 5, 8].map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => onUpdateSettings({ minPersistenceFrames: f })}
                    className={`py-1 text-[11px] rounded border font-mono transition-all cursor-pointer ${
                      settings.minPersistenceFrames === f
                        ? 'bg-sky-500 text-white border-sky-600 font-bold shadow-xs'
                        : 'bg-white/60 dark:bg-slate-900/60 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    {f} {f === 1 ? 'frame' : 'frames'}
                  </button>
                ))}
              </div>
              {settings.minPersistenceFrames === 5 && (
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                  ✓ High-stability filter active (5 consecutive frames required).
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Model Selection */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center justify-between">
          <span>Vision Model</span>
          <span className="text-[11px] text-slate-500">TFLite WebAssembly</span>
        </label>
        <select
          value={settings.model}
          onChange={(e) => onUpdateSettings({ model: e.target.value as ModelType })}
          className="w-full text-xs font-medium bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500 transition-colors"
        >
          {(Object.keys(MODEL_NAMES) as ModelType[]).map((m) => (
            <option key={m} value={m}>
              {MODEL_NAMES[m]}
            </option>
          ))}
        </select>
        <p className="text-[10px] text-slate-400">
          Tip: <strong>EfficientDet-Lite2</strong> offers highest accuracy for small background figures.
        </p>
      </div>

      {/* Confidence Threshold */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="font-medium text-slate-700 dark:text-slate-300">
            Confidence Threshold
          </span>
          <span className="font-mono tabular-nums text-sky-600 dark:text-sky-400 font-bold text-sm">
            {Math.round(settings.confidenceThreshold * 100)}%
          </span>
        </div>
        <input
          type="range"
          min="0.10"
          max="0.90"
          step="0.05"
          value={settings.confidenceThreshold}
          onChange={(e) => onUpdateSettings({ confidenceThreshold: parseFloat(e.target.value) })}
          className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
        />
        <div className="flex justify-between text-[10px] text-slate-400 font-mono">
          <span>10% (Dense Crowds)</span>
          <span>50% (Standard)</span>
          <span>90% (Strict)</span>
        </div>
      </div>

      {/* Maximum Results */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="font-medium text-slate-700 dark:text-slate-300">
            Max Headcount Limit
          </span>
          <span className="font-mono tabular-nums text-slate-800 dark:text-slate-200 font-semibold">
            {settings.maxResults} people
          </span>
        </div>
        <input
          type="range"
          min="5"
          max="100"
          step="5"
          value={settings.maxResults}
          onChange={(e) => onUpdateSettings({ maxResults: parseInt(e.target.value, 10) })}
          className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
        />
        <div className="flex justify-between text-[10px] text-slate-400 font-mono">
          <span>5 people</span>
          <span>100 people max</span>
        </div>
      </div>

      {/* Processing Delegate */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center justify-between">
          <span>Hardware Acceleration</span>
          <span className="text-[11px] text-slate-500">
            {activeDelegate === 'GPU' ? 'WebGL 2.0' : 'WASM CPU'}
          </span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onUpdateSettings({ delegate: 'GPU' })}
            disabled={!gpuAvailable}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md border transition-all ${
              settings.delegate === 'GPU' && gpuAvailable
                ? 'bg-sky-500/10 border-sky-500/50 text-sky-600 dark:text-sky-400'
                : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-400'
            } ${!gpuAvailable ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            <Zap className="w-3.5 h-3.5" />
            GPU (WebGL)
          </button>
          <button
            type="button"
            onClick={() => onUpdateSettings({ delegate: 'CPU' })}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md border transition-all ${
              settings.delegate === 'CPU' || !gpuAvailable
                ? 'bg-sky-500/10 border-sky-500/50 text-sky-600 dark:text-sky-400'
                : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-400'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            CPU (Wasm)
          </button>
        </div>
        {!gpuAvailable && (
          <p className="text-[11px] text-amber-600 dark:text-amber-400">
            GPU unavailable in this browser. Using CPU WebAssembly fallback.
          </p>
        )}
      </div>

      {/* Region of Interest (ROI) Polygon Mask */}
      <div className="p-3 bg-cyan-500/5 border border-cyan-500/20 rounded-lg space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              Region of Interest (ROI) Mask
            </span>
          </div>
          <input
            type="checkbox"
            checked={settings.enableRoi}
            onChange={(e) => onUpdateSettings({ enableRoi: e.target.checked })}
            className="rounded text-cyan-600 focus:ring-cyan-500 w-4 h-4 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 cursor-pointer"
          />
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
          Ignore people detected outside the defined polygon mask, preventing double-counting in
          backgrounds or along camera edges.
        </p>

        {settings.enableRoi && (
          <div className="pt-2 border-t border-cyan-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-mono">
                Polygon Vertices: {settings.roiPolygon?.length || 0} pts
              </span>
              <button
                type="button"
                onClick={() => onUpdateSettings({ roiInvert: !settings.roiInvert })}
                className="text-[11px] text-cyan-600 dark:text-cyan-400 font-medium hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Scissors className="w-3 h-3" />
                <span>{settings.roiInvert ? 'Mode: Exclude Inside' : 'Mode: Keep Inside'}</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-1.5 pt-1">
              {Object.keys(ROI_PRESETS).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() =>
                    onUpdateSettings({
                      roiPolygon: [...ROI_PRESETS[key].points],
                      enableRoi: true,
                    })
                  }
                  className="px-2 py-1 text-[10px] font-medium bg-white/70 dark:bg-slate-800/70 hover:bg-cyan-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded text-slate-700 dark:text-slate-300 transition-colors text-center cursor-pointer"
                >
                  {ROI_PRESETS[key].name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Visualization Elements */}
      <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
        <label className="text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
          <Eye className="w-3.5 h-3.5 text-sky-500" />
          Visualization Layers
        </label>
        <div className="space-y-2 text-xs">
          <label className="flex items-center justify-between cursor-pointer group">
            <span className="text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200">
              Bounding Boxes
            </span>
            <input
              type="checkbox"
              checked={settings.showBoundingBoxes}
              onChange={(e) => onUpdateSettings({ showBoundingBoxes: e.target.checked })}
              className="rounded text-sky-500 focus:ring-sky-500 w-4 h-4 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700"
            />
          </label>
          <label className="flex items-center justify-between cursor-pointer group">
            <span className="text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200">
              Confidence Labels
            </span>
            <input
              type="checkbox"
              checked={settings.showConfidence}
              onChange={(e) => onUpdateSettings({ showConfidence: e.target.checked })}
              className="rounded text-sky-500 focus:ring-sky-500 w-4 h-4 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700"
            />
          </label>
          <label className="flex items-center justify-between cursor-pointer group">
            <span className="text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200">
              Tracking IDs (Person #01...)
            </span>
            <input
              type="checkbox"
              checked={settings.showTrackingIds}
              onChange={(e) => onUpdateSettings({ showTrackingIds: e.target.checked })}
              className="rounded text-sky-500 focus:ring-sky-500 w-4 h-4 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700"
            />
          </label>
          <label className="flex items-center justify-between cursor-pointer group">
            <span className="text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200">
              Centroid Keypoints
            </span>
            <input
              type="checkbox"
              checked={settings.showCentroids}
              onChange={(e) => onUpdateSettings({ showCentroids: e.target.checked })}
              className="rounded text-sky-500 focus:ring-sky-500 w-4 h-4 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700"
            />
          </label>
          <label className="flex items-center justify-between cursor-pointer group">
            <span className="text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200">
              Population Density Heatmap
            </span>
            <input
              type="checkbox"
              checked={settings.showDensityHeatmap}
              onChange={(e) => onUpdateSettings({ showDensityHeatmap: e.target.checked })}
              className="rounded text-sky-500 focus:ring-sky-500 w-4 h-4 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700"
            />
          </label>
          <label className="flex items-center justify-between cursor-pointer group">
            <span className="text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200">
              Movement Corridor Flow Vectors
            </span>
            <input
              type="checkbox"
              checked={settings.showCorridorVectors}
              onChange={(e) => onUpdateSettings({ showCorridorVectors: e.target.checked })}
              className="rounded text-sky-500 focus:ring-sky-500 w-4 h-4 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700"
            />
          </label>
        </div>
      </div>
    </div>
  );
};
