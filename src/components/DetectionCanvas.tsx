import React, { useEffect, useRef, useState } from 'react';
import type { DetectionResultItem, DetectorSettings, RoiPoint } from '../types/detection';

interface DetectionCanvasProps {
  mediaElement: HTMLVideoElement | HTMLImageElement | null;
  detections: DetectionResultItem[];
  settings: DetectorSettings;
  className?: string;
  onCanvasRef?: (canvas: HTMLCanvasElement | null) => void;
  isEditingRoi?: boolean;
  onUpdateRoiPolygon?: (polygon: RoiPoint[]) => void;
}

export const DetectionCanvas: React.FC<DetectionCanvasProps> = ({
  mediaElement,
  detections,
  settings,
  className = '',
  onCanvasRef,
  isEditingRoi = false,
  onUpdateRoiPolygon,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [draggingVertexIndex, setDraggingVertexIndex] = useState<number | null>(null);
  const [hoveredVertexIndex, setHoveredVertexIndex] = useState<number | null>(null);

  // Expose canvas ref if requested (for export frame)
  useEffect(() => {
    if (onCanvasRef) {
      onCanvasRef(canvasRef.current);
    }
  }, [onCanvasRef]);

  // Main Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !mediaElement) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const updateCanvasSize = () => {
      const rect = mediaElement.getBoundingClientRect();
      const displayWidth = Math.round(rect.width);
      const displayHeight = Math.round(rect.height);

      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
      }
    };

    updateCanvasSize();
    const resizeObserver = new ResizeObserver(() => {
      updateCanvasSize();
    });
    resizeObserver.observe(mediaElement);

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const width = canvas.width;
    const height = canvas.height;
    if (width === 0 || height === 0) return;

    // 1. Draw Region of Interest (ROI) Polygon Mask if enabled
    if (settings.enableRoi && settings.roiPolygon && settings.roiPolygon.length >= 3) {
      const poly = settings.roiPolygon;
      const invert = settings.roiInvert === true;

      ctx.save();

      if (!invert) {
        // Darken EVERYTHING OUTSIDE the polygon using even-odd fill rule
        ctx.beginPath();
        // Outer bounds
        ctx.rect(0, 0, width, height);
        // Inner polygon cutout
        ctx.moveTo(poly[0].x * width, poly[0].y * height);
        for (let i = 1; i < poly.length; i++) {
          ctx.lineTo(poly[i].x * width, poly[i].y * height);
        }
        ctx.closePath();
        ctx.fillStyle = 'rgba(15, 23, 42, 0.48)'; // darkened background mask
        ctx.fill('evenodd');
      } else {
        // Darken INSIDE the polygon (excluded area)
        ctx.beginPath();
        ctx.moveTo(poly[0].x * width, poly[0].y * height);
        for (let i = 1; i < poly.length; i++) {
          ctx.lineTo(poly[i].x * width, poly[i].y * height);
        }
        ctx.closePath();
        ctx.fillStyle = 'rgba(15, 23, 42, 0.55)';
        ctx.fill();
      }

      // Stroke Polygon Boundary
      ctx.beginPath();
      ctx.moveTo(poly[0].x * width, poly[0].y * height);
      for (let i = 1; i < poly.length; i++) {
        ctx.lineTo(poly[i].x * width, poly[i].y * height);
      }
      ctx.closePath();

      ctx.strokeStyle = '#06b6d4'; // Cyan neon
      ctx.lineWidth = isEditingRoi ? 3 : 2;
      ctx.setLineDash([8, 6]);
      ctx.stroke();

      // Subtle glow
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.restore();

      // Draw ROI Boundary Label
      const firstX = poly[0].x * width;
      const firstY = poly[0].y * height;
      ctx.save();
      const roiLabel = invert ? 'ROI: EXCLUDED ZONE' : 'REGION OF INTEREST (ACTIVE)';
      ctx.font = '700 10px "JetBrains Mono", monospace';
      const labelW = ctx.measureText(roiLabel).width + 12;
      ctx.fillStyle = '#0891b2';
      ctx.fillRect(Math.max(4, firstX - 2), Math.max(4, firstY - 20), labelW, 16);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(roiLabel, Math.max(8, firstX + 4), Math.max(16, firstY - 8));
      ctx.restore();

      // Draw Interactive Vertex Handles when Editing
      if (isEditingRoi) {
        poly.forEach((pt, idx) => {
          const px = pt.x * width;
          const py = pt.y * height;
          const isHovered = hoveredVertexIndex === idx || draggingVertexIndex === idx;

          ctx.save();
          ctx.beginPath();
          ctx.arc(px, py, isHovered ? 9 : 7, 0, Math.PI * 2);

          ctx.fillStyle = isHovered ? '#22c55e' : '#ffffff';
          ctx.fill();

          ctx.lineWidth = 2.5;
          ctx.strokeStyle = '#06b6d4';
          ctx.stroke();

          // Vertex index badge
          ctx.fillStyle = '#0f172a';
          ctx.font = 'bold 9px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(idx + 1), px, py);
          ctx.restore();
        });
      }
    }

    // 2. Draw Counting Line if enabled
    if (settings.showCountingLine) {
      const lineY = settings.countingLinePosition * height;

      ctx.save();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([8, 6]);

      ctx.beginPath();
      ctx.moveTo(0, lineY);
      ctx.lineTo(width, lineY);
      ctx.stroke();

      const labelText = 'COUNTING LINE';
      ctx.font = '600 11px "JetBrains Mono", monospace';
      const textMetrics = ctx.measureText(labelText);
      const bgW = textMetrics.width + 16;
      const bgH = 20;

      ctx.fillStyle = 'rgba(245, 158, 11, 0.9)';
      ctx.fillRect(width / 2 - bgW / 2, lineY - bgH / 2, bgW, bgH);

      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(labelText, width / 2, lineY);
      ctx.restore();
    }

    // 3. Draw Population Density Heatmap if enabled
    if (settings.showDensityHeatmap && detections.length > 0) {
      ctx.save();
      detections.forEach((d) => {
        const cx = (d.box.normalizedX + d.box.normalizedWidth / 2) * width;
        const cy = (d.box.normalizedY + d.box.normalizedHeight / 2) * height;
        const radius = Math.max(50, Math.min(180, d.box.normalizedWidth * width * 1.6));

        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        grad.addColorStop(0, 'rgba(239, 68, 68, 0.42)'); // High density core (Red)
        grad.addColorStop(0.35, 'rgba(245, 158, 11, 0.28)'); // Medium density (Amber)
        grad.addColorStop(0.7, 'rgba(34, 197, 94, 0.16)'); // Low density perimeter (Green)
        grad.addColorStop(1, 'rgba(14, 165, 233, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    }

    // 4. Draw Detections
    detections.forEach((det, idx) => {
      const { box, id, score } = det;
      if (!box) return;

      const normX = Number.isFinite(box.normalizedX) ? box.normalizedX : 0;
      const normY = Number.isFinite(box.normalizedY) ? box.normalizedY : 0;
      const normW = Number.isFinite(box.normalizedWidth) ? box.normalizedWidth : 0;
      const normH = Number.isFinite(box.normalizedHeight) ? box.normalizedHeight : 0;

      const x = Math.max(0, normX * width);
      const y = Math.max(0, normY * height);
      const w = Math.min(width - x, normW * width);
      const h = Math.min(height - y, normH * height);

      if (w <= 2 || h <= 2) return;

      // Unique hue based on person ID
      const personNum = id || idx + 1;
      const hue = (personNum * 67) % 360;
      const primaryColor = `hsl(${hue}, 85%, 60%)`;
      const badgeBg = `hsla(${hue}, 80%, 20%, 0.92)`;

      // Draw Bounding Box
      if (settings.showBoundingBoxes) {
        ctx.save();

        // Subtle box fill
        ctx.fillStyle = `hsla(${hue}, 80%, 50%, 0.08)`;
        ctx.fillRect(x, y, w, h);

        // Box border
        ctx.strokeStyle = primaryColor;
        ctx.lineWidth = 2.5;
        ctx.strokeRect(x, y, w, h);

        // Corner brackets
        const cornerLength = Math.min(18, w * 0.25, h * 0.25);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;

        // Top-left
        ctx.beginPath();
        ctx.moveTo(x, y + cornerLength);
        ctx.lineTo(x, y);
        ctx.lineTo(x + cornerLength, y);
        ctx.stroke();

        // Top-right
        ctx.beginPath();
        ctx.moveTo(x + w - cornerLength, y);
        ctx.lineTo(x + w, y);
        ctx.lineTo(x + w, y + cornerLength);
        ctx.stroke();

        // Bottom-left
        ctx.beginPath();
        ctx.moveTo(x, y + h - cornerLength);
        ctx.lineTo(x, y + h);
        ctx.lineTo(x + cornerLength, y + h);
        ctx.stroke();

        // Bottom-right
        ctx.beginPath();
        ctx.moveTo(x + w - cornerLength, y + h);
        ctx.lineTo(x + w, y + h);
        ctx.lineTo(x + w, y + h - cornerLength);
        ctx.stroke();

        ctx.restore();
      }

      // Draw Centroid Keypoint
      if (settings.showCentroids) {
        const cx = (normX + normW / 2) * width;
        const cy = (normY + normH / 2) * height;

        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = primaryColor;
        ctx.stroke();
        ctx.restore();
      }

      // Draw Movement Corridor Flow Direction Vector
      if (settings.showCorridorVectors && det.velocity) {
        const speed = Math.hypot(det.velocity.vx, det.velocity.vy);
        if (speed > 0.002) {
          const cx = (normX + normW / 2) * width;
          const cy = (normY + normH) * height;
          const angle = Math.atan2(det.velocity.vy * height, det.velocity.vx * width);
          const arrowLen = Math.min(32, Math.max(14, speed * width * 6));

          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(angle);

          ctx.strokeStyle = primaryColor;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(arrowLen, 0);
          ctx.stroke();

          ctx.fillStyle = primaryColor;
          ctx.beginPath();
          ctx.moveTo(arrowLen, 0);
          ctx.lineTo(arrowLen - 6, -4);
          ctx.lineTo(arrowLen - 6, 4);
          ctx.closePath();
          ctx.fill();

          ctx.restore();
        }
      }

      // Draw Label Badge (Person #01 · 89%)
      if (settings.showLabels || settings.showConfidence || settings.showTrackingIds) {
        ctx.save();

        let labelText = '';
        if (settings.showTrackingIds) {
          labelText += `Person #${String(personNum).padStart(2, '0')}`;
        } else if (settings.showLabels) {
          labelText += 'Person';
        }

        if (settings.showConfidence) {
          if (labelText) labelText += ' · ';
          labelText += `${score}%`;
        }

        ctx.font = '600 11px "JetBrains Mono", monospace';
        const textMetrics = ctx.measureText(labelText);
        const paddingX = 8;
        const badgeW = textMetrics.width + paddingX * 2;
        const badgeH = 22;

        const badgeX = Math.max(0, Math.min(width - badgeW, x));
        const badgeY = y >= badgeH ? y - badgeH : y;

        ctx.fillStyle = badgeBg;
        ctx.fillRect(badgeX, badgeY, badgeW, badgeH);

        ctx.fillStyle = primaryColor;
        ctx.fillRect(badgeX, badgeY, 3, badgeH);

        ctx.fillStyle = '#ffffff';
        ctx.textBaseline = 'middle';
        ctx.fillText(labelText, badgeX + paddingX + 2, badgeY + badgeH / 2);

        ctx.restore();
      }
    });

    return () => {
      resizeObserver.disconnect();
    };
  }, [mediaElement, detections, settings, isEditingRoi, draggingVertexIndex, hoveredVertexIndex]);

  // Mouse Handlers for Interactive Vertex Dragging
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isEditingRoi || !canvasRef.current || !settings.roiPolygon) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const width = canvasRef.current.width;
    const height = canvasRef.current.height;

    // Check if clicked near an existing vertex (radius <= 14px)
    const thresholdPx = 16;
    let foundIndex: number | null = null;

    settings.roiPolygon.forEach((pt, idx) => {
      const vx = pt.x * width;
      const vy = pt.y * height;
      const dist = Math.hypot(vx - clickX, vy - clickY);
      if (dist <= thresholdPx) {
        foundIndex = idx;
      }
    });

    if (foundIndex !== null) {
      setDraggingVertexIndex(foundIndex);
    } else if (settings.roiPolygon.length < 16) {
      // Add a new point to the polygon at the click location
      const newPoint: RoiPoint = {
        x: Math.max(0.01, Math.min(0.99, clickX / width)),
        y: Math.max(0.01, Math.min(0.99, clickY / height)),
      };
      const updated = [...settings.roiPolygon, newPoint];
      onUpdateRoiPolygon?.(updated);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isEditingRoi || !canvasRef.current || !settings.roiPolygon) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const curX = e.clientX - rect.left;
    const curY = e.clientY - rect.top;
    const width = canvasRef.current.width;
    const height = canvasRef.current.height;

    if (draggingVertexIndex !== null) {
      // Move dragged vertex
      const newPoint: RoiPoint = {
        x: Math.max(0.01, Math.min(0.99, curX / width)),
        y: Math.max(0.01, Math.min(0.99, curY / height)),
      };
      const updated = [...settings.roiPolygon];
      updated[draggingVertexIndex] = newPoint;
      onUpdateRoiPolygon?.(updated);
    } else {
      // Check hover for cursor change
      let hoverIdx: number | null = null;
      settings.roiPolygon.forEach((pt, idx) => {
        const vx = pt.x * width;
        const vy = pt.y * height;
        if (Math.hypot(vx - curX, vy - curY) <= 16) {
          hoverIdx = idx;
        }
      });
      setHoveredVertexIndex(hoverIdx);
    }
  };

  const handleMouseUp = () => {
    if (draggingVertexIndex !== null) {
      setDraggingVertexIndex(null);
    }
  };

  const handleContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Right click removes vertex if length > 3
    if (!isEditingRoi || !canvasRef.current || !settings.roiPolygon || settings.roiPolygon.length <= 3) return;
    e.preventDefault();

    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const width = canvasRef.current.width;
    const height = canvasRef.current.height;

    let targetIdx: number | null = null;
    settings.roiPolygon.forEach((pt, idx) => {
      const vx = pt.x * width;
      const vy = pt.y * height;
      if (Math.hypot(vx - clickX, vy - clickY) <= 16) {
        targetIdx = idx;
      }
    });

    if (targetIdx !== null) {
      const updated = settings.roiPolygon.filter((_, i) => i !== targetIdx);
      onUpdateRoiPolygon?.(updated);
    }
  };

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onContextMenu={handleContextMenu}
      className={`absolute inset-0 w-full h-full pointer-events-auto ${
        isEditingRoi
          ? hoveredVertexIndex !== null
            ? 'cursor-grab'
            : 'cursor-crosshair'
          : 'pointer-events-none'
      } ${className}`}
    />
  );
};
