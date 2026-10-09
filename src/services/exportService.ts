import type { DetectionResultItem } from '../types/detection';

export const exportService = {
  exportDetectionsToCsv(
    detections: DetectionResultItem[],
    contextInfo: {
      sourceType: string;
      filename?: string;
      fps?: number;
      inferenceTimeMs?: number;
    }
  ): void {
    const timestamp = new Date().toISOString();
    const rows = [
      ['Timestamp', 'Source', 'Person ID', 'Category', 'Confidence (%)', 'X (px)', 'Y (px)', 'Width (px)', 'Height (px)', 'Norm X', 'Norm Y', 'Norm W', 'Norm H'],
    ];

    detections.forEach((d) => {
      rows.push([
        timestamp,
        contextInfo.filename || contextInfo.sourceType,
        `Person #${String(d.id || 1).padStart(2, '0')}`,
        d.categoryName,
        d.score.toString(),
        Math.round(d.box.originX).toString(),
        Math.round(d.box.originY).toString(),
        Math.round(d.box.width).toString(),
        Math.round(d.box.height).toString(),
        d.box.normalizedX.toFixed(4),
        d.box.normalizedY.toFixed(4),
        d.box.normalizedWidth.toFixed(4),
        d.box.normalizedHeight.toFixed(4),
      ]);
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `human-detections-${Date.now()}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  downloadAnnotatedFrame(
    mediaElement: HTMLVideoElement | HTMLImageElement,
    canvasOverlay: HTMLCanvasElement,
    filenamePrefix: string = 'detection-capture'
  ): void {
    try {
      const exportCanvas = document.createElement('canvas');
      const width = ('videoWidth' in mediaElement ? mediaElement.videoWidth : mediaElement.naturalWidth) || canvasOverlay.width;
      const height = ('videoHeight' in mediaElement ? mediaElement.videoHeight : mediaElement.naturalHeight) || canvasOverlay.height;

      exportCanvas.width = width;
      exportCanvas.height = height;
      const ctx = exportCanvas.getContext('2d');
      if (!ctx) return;

      // Draw original media frame
      ctx.drawImage(mediaElement, 0, 0, width, height);

      // Draw overlay canvas on top (scaled to original dimensions)
      ctx.drawImage(canvasOverlay, 0, 0, width, height);

      // Watermark header
      ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
      ctx.fillRect(0, 0, width, 40);
      ctx.fillStyle = '#38bdf8';
      ctx.font = '600 16px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('HUMAN DETECTION & COUNTING · Real-Time Computer Vision', 16, 26);

      const timestampStr = new Date().toLocaleTimeString();
      ctx.fillStyle = '#94a3b8';
      ctx.font = '500 13px "JetBrains Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillText(timestampStr, width - 16, 25);

      const dataUrl = exportCanvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${filenamePrefix}-${Date.now()}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error('Failed to export annotated frame:', e);
    }
  },

  downloadReportJson(reportData: any, filename: string = 'detection-report.json'): void {
    const jsonStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(reportData, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', jsonStr);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
};
