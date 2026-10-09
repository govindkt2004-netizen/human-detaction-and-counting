import React, { useEffect, useState } from 'react';
import {
  Activity,
  BarChart3,
  Clock,
  Download,
  Gauge,
  LineChart as LineChartIcon,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { analyticsService, type TimeSeriesPoint } from '../services/analyticsService';
import { exportService } from '../services/exportService';

export const Analytics: React.FC = () => {
  const [dataPoints, setDataPoints] = useState<TimeSeriesPoint[]>([]);

  useEffect(() => {
    const unsubscribe = analyticsService.subscribe((points) => {
      setDataPoints([...points]);
    });
    return () => unsubscribe();
  }, []);

  // Compute aggregate statistics
  const totalSamples = dataPoints.length;
  const maxPeople = totalSamples > 0 ? Math.max(...dataPoints.map((d) => d.peopleCount)) : 0;
  const avgPeople =
    totalSamples > 0
      ? Number((dataPoints.reduce((acc, d) => acc + d.peopleCount, 0) / totalSamples).toFixed(1))
      : 0;
  const avgConfidence =
    totalSamples > 0
      ? Math.round(dataPoints.reduce((acc, d) => acc + d.avgConfidence, 0) / totalSamples)
      : 0;
  const avgFps =
    totalSamples > 0
      ? Math.round(dataPoints.reduce((acc, d) => acc + d.fps, 0) / totalSamples)
      : 0;
  const avgInference =
    totalSamples > 0
      ? Math.round(dataPoints.reduce((acc, d) => acc + d.inferenceMs, 0) / totalSamples)
      : 0;

  // Fallback demo points if no active session yet
  const chartData =
    dataPoints.length > 0
      ? dataPoints
      : [
          { time: '00:01', timestamp: 1, peopleCount: 2, fps: 28, inferenceMs: 34, avgConfidence: 94 },
          { time: '00:05', timestamp: 2, peopleCount: 4, fps: 29, inferenceMs: 32, avgConfidence: 96 },
          { time: '00:10', timestamp: 3, peopleCount: 5, fps: 27, inferenceMs: 35, avgConfidence: 92 },
          { time: '00:15', timestamp: 4, peopleCount: 7, fps: 29, inferenceMs: 31, avgConfidence: 95 },
          { time: '00:20', timestamp: 5, peopleCount: 6, fps: 30, inferenceMs: 30, avgConfidence: 97 },
          { time: '00:25', timestamp: 6, peopleCount: 8, fps: 28, inferenceMs: 33, avgConfidence: 93 },
          { time: '00:30', timestamp: 7, peopleCount: 7, fps: 29, inferenceMs: 32, avgConfidence: 96 },
        ];

  const handleExportData = () => {
    exportService.downloadReportJson(
      {
        summary: {
          totalSamples,
          maxPeople,
          avgPeople,
          avgConfidence,
          avgFps,
          avgInference,
        },
        timeSeries: chartData,
      },
      `analytics-telemetry-${Date.now()}.json`
    );
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner / Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Computer Vision Analytics
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time population telemetry, temporal density trends, framerate consistency, and model inference latency.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportData}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:border-slate-400 rounded-md transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-sky-500" />
            <span>Export Analytics JSON</span>
          </button>
          <button
            type="button"
            onClick={() => analyticsService.clear()}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-rose-600 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Clear Buffer</span>
          </button>
        </div>
      </div>

      {/* Aggregate KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5">
          <div className="text-[11px] text-slate-500 mb-1 flex items-center justify-between">
            <span>Buffer Samples</span>
            <Activity className="w-3.5 h-3.5 text-sky-500" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">
            {totalSamples || chartData.length}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5">
          <div className="text-[11px] text-slate-500 mb-1 flex items-center justify-between">
            <span>Peak Count</span>
            <Users className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {maxPeople || 8}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5">
          <div className="text-[11px] text-slate-500 mb-1 flex items-center justify-between">
            <span>Avg Population</span>
            <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">
            {avgPeople || 5.6}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5">
          <div className="text-[11px] text-slate-500 mb-1 flex items-center justify-between">
            <span>Avg Confidence</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400">
            {avgConfidence || 95}%
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5">
          <div className="text-[11px] text-slate-500 mb-1 flex items-center justify-between">
            <span>Avg Framerate</span>
            <Gauge className="w-3.5 h-3.5 text-sky-500" />
          </div>
          <div className="text-xl font-bold font-mono text-sky-600 dark:text-sky-400">
            {avgFps || 29} <span className="text-xs text-slate-400 font-normal">FPS</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5">
          <div className="text-[11px] text-slate-500 mb-1 flex items-center justify-between">
            <span>Avg Latency</span>
            <Zap className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">
            {avgInference || 32} <span className="text-xs text-slate-400 font-normal">ms</span>
          </div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: People Count Over Time */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-sky-500" />
                Human Count Over Time
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Dynamic count of detected individuals in the camera/video frame
              </p>
            </div>
            <span className="text-xs font-mono text-sky-500 font-semibold">Active Session</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #1e293b',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#f8fafc',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="peopleCount"
                  name="People Count"
                  stroke="#0284c7"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCount)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Model Confidence Trend */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Detection Confidence (%)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Mean confidence score across all identified bounding boxes
              </p>
            </div>
            <span className="text-xs font-mono text-amber-500 font-semibold">0% - 100%</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                <YAxis domain={[50, 100]} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #1e293b',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#f8fafc',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="avgConfidence"
                  name="Confidence (%)"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Framerate Stability (FPS) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Gauge className="w-4 h-4 text-emerald-500" />
                Framerate (FPS)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Rendering and inference frequency stability
              </p>
            </div>
            <span className="text-xs font-mono text-emerald-500 font-semibold">Real-Time</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 45]} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #1e293b',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#f8fafc',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="fps"
                  name="FPS"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Neural Inference Latency (ms) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-rose-500" />
                Inference Latency (Milliseconds)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Time required by the TFLite runtime to forward-pass a frame
              </p>
            </div>
            <span className="text-xs font-mono text-rose-500 font-semibold">ms / frame</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #1e293b',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#f8fafc',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="inferenceMs"
                  name="Latency (ms)"
                  stroke="#f43f5e"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorLatency)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
