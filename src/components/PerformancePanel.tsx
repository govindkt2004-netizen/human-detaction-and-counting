import React from 'react';
import { Activity, Cpu, Gauge, Zap } from 'lucide-react';
import type { PerformanceMetrics } from '../types/detection';

interface PerformancePanelProps {
  metrics: PerformanceMetrics;
  className?: string;
}

export const PerformancePanel: React.FC<PerformancePanelProps> = ({
  metrics,
  className = '',
}) => {
  return (
    <div
      className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 space-y-3 ${className}`}
    >
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
          <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
            Pipeline Performance
          </h4>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-mono">
          <span
            className={`w-2 h-2 rounded-full ${
              metrics.processingState === 'detecting'
                ? 'bg-emerald-500'
                : metrics.processingState === 'loading'
                ? 'bg-amber-500 animate-ping'
                : 'bg-slate-400'
            }`}
          />
          <span className="capitalize text-slate-500 dark:text-slate-400">
            {metrics.processingState}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        {/* FPS */}
        <div className="space-y-0.5">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Gauge className="w-3 h-3 text-sky-500" />
            <span>Framerate</span>
          </div>
          <div className="font-mono tabular-nums text-base font-bold text-slate-900 dark:text-white">
            {metrics.fps}{' '}
            <span className="text-[11px] font-normal text-slate-500">FPS</span>
          </div>
        </div>

        {/* Inference Latency */}
        <div className="space-y-0.5">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-500" />
            <span>Inference Latency</span>
          </div>
          <div className="font-mono tabular-nums text-base font-bold text-slate-900 dark:text-white">
            {metrics.inferenceTimeMs}{' '}
            <span className="text-[11px] font-normal text-slate-500">ms</span>
          </div>
        </div>

        {/* Delegate */}
        <div className="space-y-0.5">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Cpu className="w-3 h-3 text-indigo-500" />
            <span>Execution Delegate</span>
          </div>
          <div className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
            {metrics.delegate === 'GPU' ? 'GPU (WebGL 2)' : 'CPU (WebAssembly)'}
          </div>
        </div>

        {/* Engine */}
        <div className="space-y-0.5">
          <div className="text-[11px] text-slate-500 dark:text-slate-400">Model Runtime</div>
          <div className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
            MediaPipe Tasks
          </div>
        </div>
      </div>
    </div>
  );
};
