import type { DetectorSettings, HistoryItem } from '../types/detection';

const SETTINGS_KEY = 'human_detection_settings_v1';
const HISTORY_KEY = 'human_detection_history_v1';
const THEME_KEY = 'human_detection_theme_v1';

export const DEFAULT_SETTINGS: DetectorSettings = {
  model: 'efficientdet_lite0',
  confidenceThreshold: 0.25,
  maxResults: 80,
  delegate: 'GPU',
  crowdMode: true,
  tileGrid: '3x2',
  nmsIouThreshold: 0.45,
  temporalFilter: true,
  minPersistenceFrames: 5,
  enableRoi: false,
  roiPolygon: [
    { x: 0.12, y: 0.18 },
    { x: 0.88, y: 0.18 },
    { x: 0.94, y: 0.88 },
    { x: 0.06, y: 0.88 },
  ],
  roiInvert: false,
  showBoundingBoxes: true,
  showLabels: true,
  showTrackingIds: true,
  showConfidence: true,
  showCentroids: false,
  showTrails: false,
  showDensityHeatmap: false,
  showCorridorVectors: true,
  showCountingLine: false,
  countingLinePosition: 0.5,
  showDetectionZone: false,
  detectionZone: { x: 0.15, y: 0.15, width: 0.7, height: 0.7 },
};

export const storageService = {
  getSettings(): DetectorSettings {
    try {
      const data = localStorage.getItem(SETTINGS_KEY);
      if (data) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(data), showTrails: false };
      }
    } catch (e) {
      console.warn('Failed to load settings:', e);
    }
    return DEFAULT_SETTINGS;
  },

  saveSettings(settings: DetectorSettings): void {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to save settings:', e);
    }
  },

  getHistory(): HistoryItem[] {
    try {
      const data = localStorage.getItem(HISTORY_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Failed to load history:', e);
    }
    return [];
  },

  addHistory(item: Omit<HistoryItem, 'id' | 'timestamp'>): HistoryItem {
    const newItem: HistoryItem = {
      ...item,
      id: 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      timestamp: new Date().toISOString(),
    };

    try {
      const current = this.getHistory();
      const updated = [newItem, ...current].slice(0, 50); // keep last 50 items
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save history item:', e);
    }

    return newItem;
  },

  deleteHistoryItem(id: string): void {
    try {
      const current = this.getHistory();
      const filtered = current.filter((h) => h.id !== id);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));
    } catch (e) {
      console.warn('Failed to delete history item:', e);
    }
  },

  clearHistory(): void {
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch (e) {
      console.warn('Failed to clear history:', e);
    }
  },

  getTheme(): 'light' | 'dark' {
    try {
      const theme = localStorage.getItem(THEME_KEY);
      if (theme === 'light' || theme === 'dark') return theme;
    } catch {}
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'dark'; // default to modern dark theme for computer vision
  },

  setTheme(theme: 'light' | 'dark'): void {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (e) {
      console.warn('Failed to save theme:', e);
    }
  },
};
