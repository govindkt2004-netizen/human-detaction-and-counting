import React from 'react';
import {
  Check,
  Edit3,
  Layers,
  Maximize,
  Move,
  Plus,
  RefreshCw,
  RotateCcw,
  Scissors,
  Shield,
  Trash2,
} from 'lucide-react';
import type { DetectorSettings, RoiPoint } from '../types/detection';
import { ROI_PRESETS } from '../utils/polygonUtils';

interface RoiControlsProps {
  settings: DetectorSettings;
  onUpdateSettings: (newSettings: Partial<DetectorSettings>) => void;
  isEditingRoi: boolean;
  onToggleEditRoi: () => void;
  className?: string;
}

export const RoiControls: React.FC<RoiControlsProps> = ({
  settings,
  onUpdateSettings,
  isEditingRoi,
  onToggleEditRoi,
  className = '',
}) => {
  const applyPreset = (presetKey: string) => {
    const preset = ROI_PRESETS[presetKey];
    if (preset) {
      onUpdateSettings({
        enableRoi: true,
        roiPolygon: [...preset.points],
      });
    }
  };

  const handleResetFullScreen = () => {
    onUpdateSettings({
      enableRoi: true,
      roiPolygon: [
        { x: 0.05, y: 0.05 },
        { x: 0.95, y: 0.05 },
        { x: 0.95, y: 0.95 },
        { x: 0.05, y: 0.95 },
      ],
    });
  };

  return (
    <div className={`p-3.5 bg-slate-900/90 dark:bg-slate-900 border border-cyan-500/30 rounded-xl space-y-3 shadow-md ${className}`}>
      {/* Header & Main Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-cyan-400" />
          <div>
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              Region of Interest (ROI) Mask
              {settings.enableRoi && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 bg-cyan-500/20 text-cyan-300 rounded border border-cyan-500/40">
                  ACTIVE
                </span>
              )}
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.enableRoi}
              onChange={(e) => onUpdateSettings({ enableRoi: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500" />
          </label>
        </div>
      </div>

      <p className="text-[11px] text-slate-400 leading-relaxed">
        Defines an arbitrary polygon boundary. People outside (or in the background/edges) are
        completely excluded from counting and detection.
      </p>

      {settings.enableRoi && (
        <div className="space-y-2.5 pt-2 border-t border-slate-800">
          {/* Action Row: Interactive Editor & Invert Mask */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={onToggleEditRoi}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer ${
                isEditingRoi
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md ring-2 ring-cyan-400/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border-cyan-500/40'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditingRoi ? 'Done Editing Mask' : 'Edit Polygon on Canvas'}</span>
            </button>

            <button
              type="button"
              onClick={() => onUpdateSettings({ roiInvert: !settings.roiInvert })}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer ${
                settings.roiInvert
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
              }`}
              title="Invert Mask: exclude detections inside polygon instead of outside"
            >
              <Scissors className="w-3.5 h-3.5" />
              <span>{settings.roiInvert ? 'Mode: Exclude Inside' : 'Mode: Keep Inside'}</span>
            </button>
          </div>

          {/* Edit instructions banner when editing */}
          {isEditingRoi && (
            <div className="p-2.5 bg-cyan-950/40 border border-cyan-500/40 rounded-lg text-[11px] text-cyan-200 space-y-1">
              <div className="font-semibold flex items-center gap-1">
                <Move className="w-3.5 h-3.5 text-cyan-400" />
                Interactive Polygon Editing:
              </div>
              <ul className="list-disc list-inside text-cyan-300/80 space-y-0.5 pl-1">
                <li>Click & drag any vertex handle to reshape the boundary.</li>
                <li>Click anywhere along canvas to add new polygon vertices.</li>
                <li>Right-click (or double click) a vertex to remove it.</li>
              </ul>
            </div>
          )}

          {/* Quick Shape Presets */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-400">
              Quick Shape Presets:
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              {Object.keys(ROI_PRESETS).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => applyPreset(key)}
                  className="px-2 py-1.5 text-[11px] font-medium bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md text-slate-200 transition-colors text-center cursor-pointer"
                >
                  {ROI_PRESETS[key].name}
                </button>
              ))}
            </div>
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400 font-mono">
            <span>Vertices: {settings.roiPolygon?.length || 0} points</span>
            <button
              type="button"
              onClick={handleResetFullScreen}
              className="text-slate-400 hover:text-cyan-300 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Boundary</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
