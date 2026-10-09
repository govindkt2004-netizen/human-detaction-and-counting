import React from 'react';
import {
  Activity,
  ArrowRight,
  BarChart3,
  Camera,
  Cpu,
  History,
  Image as ImageIcon,
  Layers,
  ShieldCheck,
  Sparkles,
  Users,
  Video,
  Zap,
} from 'lucide-react';
import type { NavTab } from '../components/Sidebar';
import { storageService } from '../services/storageService';

interface DashboardProps {
  onNavigate: (tab: NavTab) => void;
  gpuAvailable: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate, gpuAvailable }) => {
  const history = storageService.getHistory();
  const totalSessions = history.length;
  const totalPeopleObserved = history.reduce((acc, h) => acc + (h.maxPeople || h.peopleCount || 0), 0);
  const avgOverallConfidence =
    history.length > 0
      ? Math.round(history.reduce((acc, h) => acc + h.avgConfidence, 0) / history.length)
      : 94;

  return (
    <div className="p-4 sm:p-6 space-y-8 max-w-7xl mx-auto">
      {/* Hero Welcome Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-sky-950 text-white p-6 sm:p-10 border border-slate-700/50 shadow-md">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 text-xs font-medium border border-sky-500/30">
            <Zap className="w-3.5 h-3.5 text-sky-400" />
            <span>Google AI Edge MediaPipe Tasks Vision Architecture</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Human Detection & Counting
          </h2>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Professional browser-based computer vision analytics. Detect whole-human figures,
            track IDs across consecutive frames, calculate population densities, and monitor
            movement corridors—all running 100% locally on your machine via WebAssembly & WebGL.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => onNavigate('live')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span>Launch Live Camera</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => onNavigate('image')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-white font-semibold text-xs sm:text-sm border border-slate-600 transition-all cursor-pointer"
            >
              <ImageIcon className="w-4 h-4" />
              <span>Detect Image</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('video')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-white font-semibold text-xs sm:text-sm border border-slate-600 transition-all cursor-pointer"
            >
              <Video className="w-4 h-4" />
              <span>Analyze Video</span>
            </button>
          </div>
        </div>

        {/* Decorative corner visual */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
      </div>

      {/* Aggregate Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between mb-1">
            <span>Historical Sessions</span>
            <History className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {totalSessions}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Stored in browser local storage</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between mb-1">
            <span>Detections Logged</span>
            <Users className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {totalPeopleObserved}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Total human figures recognized</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between mb-1">
            <span>Avg Model Confidence</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {avgOverallConfidence}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Person category classification</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between mb-1">
            <span>Hardware Pipeline</span>
            <Cpu className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-lg font-bold font-mono text-slate-900 dark:text-white">
            {gpuAvailable ? 'GPU Accelerated' : 'CPU Wasm'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {gpuAvailable ? 'WebGL 2.0 Shader Engine' : 'WebAssembly Multi-Thread'}
          </div>
        </div>
      </div>

      {/* Main Feature Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Detection Pipelines
          </h3>
          <span className="text-xs text-slate-500">Choose your input mode</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Live Webcam */}
          <div
            onClick={() => onNavigate('live')}
            className="group cursor-pointer bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-sky-500 dark:hover:border-sky-500 rounded-xl p-6 transition-all shadow-xs hover:shadow-md flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Camera className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                Live Webcam Detection
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Connect your device camera for 30+ FPS real-time person detection, dynamic bounding
                boxes, persistent tracking IDs, and directional line counting.
              </p>
            </div>
            <div className="mt-5 flex items-center text-xs font-semibold text-sky-600 dark:text-sky-400 gap-1.5">
              <span>Start Camera Stream</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 2: Image Detection */}
          <div
            onClick={() => onNavigate('image')}
            className="group cursor-pointer bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-sky-500 dark:hover:border-sky-500 rounded-xl p-6 transition-all shadow-xs hover:shadow-md flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <ImageIcon className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                Static Image Detection
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Upload or drag & drop high-resolution photographs to perform comprehensive headcount
                audits, export annotated snapshots, and download CSV spreadsheets.
              </p>
            </div>
            <div className="mt-5 flex items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400 gap-1.5">
              <span>Upload Photograph</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 3: Video Detection */}
          <div
            onClick={() => onNavigate('video')}
            className="group cursor-pointer bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-sky-500 dark:hover:border-sky-500 rounded-xl p-6 transition-all shadow-xs hover:shadow-md flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Video className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                Recorded Video Analysis
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Process MP4 and WebM videos frame-by-frame. Monitor population peaks, average density,
                and review chronological timestamps with full scrub controls.
              </p>
            </div>
            <div className="mt-5 flex items-center text-xs font-semibold text-indigo-600 dark:text-indigo-400 gap-1.5">
              <span>Process Video File</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* System Highlights Banner */}
      <div className="bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 text-sky-500">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Privacy First & Local Architecture
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Zero frames are transmitted to remote servers. All neural network weights execute
              strictly within your browser sandbox.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('about')}
          className="text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 flex items-center gap-1.5 shrink-0"
        >
          <span>Read Technical Specifications</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
