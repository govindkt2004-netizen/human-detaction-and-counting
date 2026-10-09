export interface TimeSeriesPoint {
  time: string;
  timestamp: number;
  peopleCount: number;
  fps: number;
  inferenceMs: number;
  avgConfidence: number;
}

class AnalyticsService {
  private liveBuffer: TimeSeriesPoint[] = [];
  private maxBufferSize = 60; // 60 seconds / entries
  private listeners: Set<(data: TimeSeriesPoint[]) => void> = new Set();
  private lastRecordedSec = 0;

  public recordDataPoint(point: {
    peopleCount: number;
    fps: number;
    inferenceMs: number;
    avgConfidence: number;
  }) {
    const now = Date.now();
    // throttle to at most ~1 point per second for clean charts
    if (now - this.lastRecordedSec < 800) return;
    this.lastRecordedSec = now;

    const timeStr = new Date(now).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const newPoint: TimeSeriesPoint = {
      time: timeStr,
      timestamp: now,
      peopleCount: point.peopleCount,
      fps: Math.round(point.fps),
      inferenceMs: Math.round(point.inferenceMs),
      avgConfidence: Math.round(point.avgConfidence),
    };

    this.liveBuffer.push(newPoint);
    if (this.liveBuffer.length > this.maxBufferSize) {
      this.liveBuffer.shift();
    }

    this.notify();
  }

  public getHistory(): TimeSeriesPoint[] {
    return [...this.liveBuffer];
  }

  public clear() {
    this.liveBuffer = [];
    this.notify();
  }

  public subscribe(cb: (data: TimeSeriesPoint[]) => void): () => void {
    this.listeners.add(cb);
    cb(this.getHistory());
    return () => this.listeners.delete(cb);
  }

  private notify() {
    const data = this.getHistory();
    this.listeners.forEach((cb) => cb(data));
  }
}

export const analyticsService = new AnalyticsService();
