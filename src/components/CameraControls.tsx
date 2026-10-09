import React from 'react';
import {
  Camera,
  CameraOff,
  Download,
  Pause,
  Play,
  RotateCcw,
} from 'lucide-react';
import type { CameraState } from '../hooks/useCamera';

interface CameraControlsProps {
  cameraState: CameraState;
  onStartCamera: (deviceId?: string) => void;
  onStopCamera: () => void;
  onTogglePause: () => void;
  onCaptureFrame: () => void;
  onResetStats: () => void;
  className?: string;
}

export const CameraControls: React.FC<CameraControlsProps> = ({
  cameraState,
  onStartCamera,
  onStopCamera,
  onTogglePause,
  onCaptureFrame,
  onResetStats,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg ${className}`}
    >
      {/* Primary camera actions */}
      <div className="flex items-center gap-2">
        {!cameraState.isActive ? (
          <button
            type="button"
            onClick={() => onStartCamera(cameraState.selectedDeviceId)}
            disabled={cameraState.isLoading}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 active:bg-sky-700 disabled:opacity-50 rounded-md transition-colors shadow-sm"
          >
            <Camera className="w-4 h-4" />
            {cameraState.isLoading ? 'Accessing Camera...' : 'Start Camera'}
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={onStopCamera}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 border border-rose-200 dark:border-rose-900 rounded-md transition-colors"
            >
              <CameraOff className="w-3.5 h-3.5" />
              Stop Camera
            </button>

            <button
              type="button"
              onClick={onTogglePause}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors"
            >
              {cameraState.isPaused ? (
                <>
                  <Play className="w-3.5 h-3.5 text-emerald-500" />
                  Resume
                </>
              ) : (
                <>
                  <Pause className="w-3.5 h-3.5 text-amber-500" />
                  Pause
                </>
              )}
            </button>
          </>
        )}

        {/* Device selector if multiple cameras exist */}
        {cameraState.devices.length > 1 && (
          <select
            value={cameraState.selectedDeviceId}
            onChange={(e) => onStartCamera(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-2.5 py-2 text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            {cameraState.devices.map((d, i) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label || `Camera ${i + 1}`}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Frame utilities: Snapshot & Reset */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onResetStats}
          title="Reset counting counters and history"
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Counts
        </button>

        <button
          type="button"
          onClick={onCaptureFrame}
          disabled={!cameraState.isActive}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none border border-slate-200 dark:border-slate-700 rounded-md transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-sky-500" />
          Capture Frame
        </button>
      </div>
    </div>
  );
};
