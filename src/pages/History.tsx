import React, { useEffect, useState } from 'react';
import {
  Camera,
  Clock,
  Download,
  FileSpreadsheet,
  History as HistoryIcon,
  Image as ImageIcon,
  Sparkles,
  Trash2,
  Users,
  Video,
} from 'lucide-react';
import { storageService } from '../services/storageService';
import type { HistoryItem } from '../types/detection';

export const History: React.FC = () => {
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);

  const loadHistory = () => {
    setHistoryItems(storageService.getHistory());
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    storageService.deleteHistoryItem(id);
    loadHistory();
    if (selectedItem?.id === id) {
      setSelectedItem(null);
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all detection history?')) {
      storageService.clearHistory();
      loadHistory();
      setSelectedItem(null);
    }
  };

  const handleExportHistoryCsv = () => {
    if (historyItems.length === 0) return;
    const rows = [
      ['ID', 'Timestamp', 'Source Type', 'Title', 'People Count', 'Max People', 'Avg Confidence (%)', 'Inference (ms)', 'Model', 'Delegate'],
    ];

    historyItems.forEach((item) => {
      rows.push([
        item.id,
        item.timestamp,
        item.sourceType,
        `"${item.title.replace(/"/g, '""')}"`,
        item.peopleCount.toString(),
        (item.maxPeople || item.peopleCount).toString(),
        item.avgConfidence.toString(),
        item.inferenceTimeMs.toString(),
        item.details?.model || 'MediaPipe',
        item.details?.delegate || 'GPU',
      ]);
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `detection-history-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'webcam':
        return <Camera className="w-4 h-4 text-sky-500" />;
      case 'image':
        return <ImageIcon className="w-4 h-4 text-emerald-500" />;
      case 'video':
        return <Video className="w-4 h-4 text-indigo-500" />;
      default:
        return <HistoryIcon className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner / Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Detection History
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Locally preserved analysis logs, crowd metrics, confidence scores, and historical captures.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportHistoryCsv}
            disabled={historyItems.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:border-slate-400 rounded-md transition-colors disabled:opacity-40"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export History CSV</span>
          </button>
          <button
            type="button"
            onClick={handleClearAll}
            disabled={historyItems.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-md transition-colors disabled:opacity-40"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        </div>
      </div>

      {historyItems.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <HistoryIcon className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            No Detection Sessions Recorded Yet
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Run a live webcam detection, analyze an image, or process a video. Snapshots and analysis
            summaries will automatically be logged here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* List of items */}
          <div className="lg:col-span-7 space-y-2.5">
            {historyItems.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className={`p-4 bg-white dark:bg-slate-900 border rounded-xl cursor-pointer transition-all flex items-center justify-between group ${
                  selectedItem?.id === item.id
                    ? 'border-sky-500 ring-1 ring-sky-500/30'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                    {getSourceIcon(item.sourceType)}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                      {item.title}
                    </h4>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                      <span>{new Date(item.timestamp).toLocaleString()}</span>
                      <span>·</span>
                      <span className="capitalize">{item.sourceType}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-bold font-mono text-slate-900 dark:text-white">
                      {item.peopleCount} {item.peopleCount === 1 ? 'person' : 'people'}
                    </div>
                    <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                      {item.avgConfidence}% conf
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handleDelete(item.id, e)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                    title="Delete record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Details Column */}
          <div className="lg:col-span-5">
            {selectedItem ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 sticky top-24">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    {getSourceIcon(selectedItem.sourceType)}
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Session Details
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500">
                    {selectedItem.id.slice(0, 14)}...
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-slate-500 text-[11px] block">Title / Source</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {selectedItem.title}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg">
                      <span className="text-slate-500 text-[11px] block">People Count</span>
                      <span className="text-lg font-bold font-mono text-slate-900 dark:text-white">
                        {selectedItem.peopleCount}
                      </span>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg">
                      <span className="text-slate-500 text-[11px] block">Avg Confidence</span>
                      <span className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                        {selectedItem.avgConfidence}%
                      </span>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg">
                      <span className="text-slate-500 text-[11px] block">Inference Latency</span>
                      <span className="text-lg font-bold font-mono text-slate-900 dark:text-white">
                        {selectedItem.inferenceTimeMs} ms
                      </span>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg">
                      <span className="text-slate-500 text-[11px] block">Hardware Delegate</span>
                      <span className="text-lg font-bold font-mono text-sky-600 dark:text-sky-400">
                        {selectedItem.details?.delegate || 'GPU'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 text-[11px] text-slate-500 space-y-1">
                    <div>
                      <span className="font-medium text-slate-700 dark:text-slate-300">Model:</span>{' '}
                      {selectedItem.details?.model || 'MediaPipe Object Detector'}
                    </div>
                    <div>
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        Timestamp:
                      </span>{' '}
                      {new Date(selectedItem.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center text-xs text-slate-400">
                Select an item on the left to inspect detailed telemetry.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
