import React from 'react';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Compass,
  Cpu,
  Footprints,
  Hash,
  Layers,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  Users,
} from 'lucide-react';
import type { CountingStats } from '../types/detection';

interface StatisticsCardsProps {
  stats: CountingStats;
  avgConfidence: number;
  showLineCrossings?: boolean;
  className?: string;
}

export const StatisticsCards: React.FC<StatisticsCardsProps> = ({
  stats,
  avgConfidence,
  showLineCrossings = false,
  className = '',
}) => {
  const density = stats.densityMetrics;
  const corridor = stats.corridorMetrics;

  const crowdingColors = {
    Low: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30',
    Moderate: 'text-sky-500 bg-sky-500/10 border-sky-500/30',
    Dense: 'text-amber-500 bg-amber-500/10 border-amber-500/30',
    Overcrowded: 'text-rose-500 bg-rose-500/10 border-rose-500/30',
  };

  return (
    <div className={`space-y-3.5 ${className}`}>
      {/* Primary Current Count Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
          <span className="font-semibold uppercase tracking-wider text-[11px]">
            Current Count
          </span>
          <Users className="w-4 h-4 text-sky-500" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-extrabold text-slate-900 dark:text-white font-mono tabular-nums tracking-tight">
            {stats.currentCount}
          </span>
          <span className="text-xs text-slate-500 font-medium">people in frame</span>
        </div>
      </div>

      {/* Grid of Core Numerical Metrics */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Maximum Count */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3">
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-0.5">
            <span>Peak Count</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-slate-100 font-mono tabular-nums">
            {stats.maxCount}
          </div>
        </div>

        {/* Average Count */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3">
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-0.5">
            <span>Average Count</span>
            <Hash className="w-3.5 h-3.5 text-indigo-500" />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-slate-100 font-mono tabular-nums">
            {stats.averageCount}
          </div>
        </div>

        {/* Total Unique People Tracked */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3">
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-0.5">
            <span>Unique Tracked</span>
            <UserCheck className="w-3.5 h-3.5 text-sky-500" />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-slate-100 font-mono tabular-nums">
            {stats.totalUniqueTracked}
          </div>
        </div>

        {/* Average Confidence */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3">
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-0.5">
            <span>Avg Confidence</span>
            <span className="text-[10px] font-mono text-slate-400">Score</span>
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-slate-100 font-mono tabular-nums">
            {avgConfidence}%
          </div>
        </div>
      </div>

      {/* Population Density Analytics Card */}
      {density && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-sky-500" />
              Population Density
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                crowdingColors[density.crowdingLevel]
              }`}
            >
              {density.crowdingLevel}
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>Density Index:</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                {density.densityIndex}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  density.densityIndex > 70
                    ? 'bg-rose-500'
                    : density.densityIndex > 40
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(5, density.densityIndex))}%` }}
              />
            </div>
          </div>

          <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
            <span>Congestion Peak:</span>
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {density.peakSector}
            </span>
          </div>
        </div>
      )}

      {/* Movement Corridor Flow Monitoring */}
      {corridor && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-cyan-500" />
              Movement Corridors
            </span>
            <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded">
              {corridor.activeMovers} Moving
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2 bg-slate-50 dark:bg-slate-800/60 rounded border border-slate-200/60 dark:border-slate-700/60">
              <div className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3 text-cyan-500" />
                Inbound / North
              </div>
              <div className="text-sm font-bold font-mono text-slate-900 dark:text-white mt-0.5">
                {corridor.northboundCount} ppl
              </div>
            </div>

            <div className="p-2 bg-slate-50 dark:bg-slate-800/60 rounded border border-slate-200/60 dark:border-slate-700/60">
              <div className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <ArrowDownRight className="w-3 h-3 text-indigo-500" />
                Outbound / South
              </div>
              <div className="text-sm font-bold font-mono text-slate-900 dark:text-white mt-0.5">
                {corridor.southboundCount} ppl
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Optional Counting Line Crossings */}
      {showLineCrossings && (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 space-y-2">
          <div className="text-xs font-semibold text-amber-700 dark:text-amber-400 flex items-center justify-between">
            <span>Line Crossings</span>
            <span className="font-mono text-[10px]">Gate Active</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center justify-between bg-white/60 dark:bg-slate-900/60 p-2 rounded">
              <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1 text-[11px]">
                <ArrowDownRight className="w-3.5 h-3.5 text-emerald-500" /> In
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                {stats.lineCrossings.entered}
              </span>
            </div>
            <div className="flex items-center justify-between bg-white/60 dark:bg-slate-900/60 p-2 rounded">
              <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1 text-[11px]">
                <ArrowUpRight className="w-3.5 h-3.5 text-rose-500" /> Out
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                {stats.lineCrossings.exited}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Local Inference Engine Security Badge */}
      <div className="p-2.5 bg-emerald-500/5 border border-emerald-500/20 rounded-lg flex items-center gap-2 text-[11px] text-emerald-700 dark:text-emerald-300">
        <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
        <span className="leading-tight">
          <strong>100% Local Inference</strong>: Zero video frames leave this device. MediaPipe runs via WebAssembly SIMD & WebGL 2.0.
        </span>
      </div>
    </div>
  );
};
