import React, { useState } from 'react';
import {
  Check,
  Cpu,
  Eye,
  RefreshCw,
  RotateCcw,
  Sliders,
  Sparkles,
  Zap,
} from 'lucide-react';
import { DetectionControls } from '../components/DetectionControls';
import { detectorService, MODEL_NAMES } from '../services/detectorService';
import { DEFAULT_SETTINGS, storageService } from '../services/storageService';
import type { DetectorSettings } from '../types/detection';

interface SettingsPageProps {
  settings: DetectorSettings;
  onUpdateSettings: (newSettings: Partial<DetectorSettings>) => void;
  gpuAvailable: boolean;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  settings,
  onUpdateSettings,
  gpuAvailable,
}) => {
  const [savedNotification, setSavedNotification] = useState(false);

  const handleUpdate = (updated: Partial<DetectorSettings>) => {
    onUpdateSettings(updated);
    setSavedNotification(true);
    setTimeout(() => setSavedNotification(false), 2000);
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset all detection and visualization settings to default values?')) {
      onUpdateSettings(DEFAULT_SETTINGS);
      storageService.saveSettings(DEFAULT_SETTINGS);
      setSavedNotification(true);
      setTimeout(() => setSavedNotification(false), 2000);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-4xl mx-auto">
      {/* Top Banner / Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            System & Detection Settings
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Configure MediaPipe Tasks Vision runtime thresholds, hardware acceleration, and visual overlays.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {savedNotification && (
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Saved to LocalStorage
            </span>
          )}
          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:border-slate-400 rounded-md transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Defaults</span>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs">
        <DetectionControls
          settings={settings}
          onUpdateSettings={handleUpdate}
          gpuAvailable={gpuAvailable}
          activeDelegate={detectorService.getActiveDelegate()}
        />
      </div>

      {/* Model Spec Card */}
      <div className="bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Hardware & Execution Profile
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-slate-500 text-[11px] block">Active Engine</span>
            <span className="font-semibold text-slate-900 dark:text-white font-mono">
              @mediapipe/tasks-vision 0.10.20
            </span>
          </div>
          <div>
            <span className="text-slate-500 text-[11px] block">GPU Capability</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
              {gpuAvailable ? 'WebGL 2.0 Hardware Acceleration' : 'CPU Software Mode'}
            </span>
          </div>
          <div>
            <span className="text-slate-500 text-[11px] block">Class Filter</span>
            <span className="font-semibold text-sky-600 dark:text-sky-400 font-mono">
              categoryAllowlist: ['person']
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
