import type { RoiPoint } from '../types/detection';

/**
 * Ray-casting algorithm to test whether a normalized point (0..1) lies inside a polygon.
 */
export function isPointInPolygon(point: RoiPoint, polygon: RoiPoint[]): boolean {
  if (!polygon || polygon.length < 3) return true;

  let inside = false;
  const { x, y } = point;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;

    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi + 0.00000001) + xi;

    if (intersect) {
      inside = !inside;
    }
  }

  return inside;
}

/**
 * Standard ROI Presets (normalized 0..1)
 */
export const ROI_PRESETS: Record<string, { name: string; description: string; points: RoiPoint[] }> = {
  centerFocus: {
    name: 'Center Courtyard',
    description: 'Trapezoidal focus zone ignoring outer colonnades and edges',
    points: [
      { x: 0.18, y: 0.2 },
      { x: 0.82, y: 0.2 },
      { x: 0.92, y: 0.88 },
      { x: 0.08, y: 0.88 },
    ],
  },
  foregroundOnly: {
    name: 'Foreground Walkway',
    description: 'Covers lower foreground floor, masking background crowds',
    points: [
      { x: 0.04, y: 0.42 },
      { x: 0.96, y: 0.42 },
      { x: 0.96, y: 0.96 },
      { x: 0.04, y: 0.96 },
    ],
  },
  innerHexagon: {
    name: 'Hexagonal Stage',
    description: 'Symmetrical 6-point perimeter for circular/gathering areas',
    points: [
      { x: 0.5, y: 0.12 },
      { x: 0.86, y: 0.32 },
      { x: 0.86, y: 0.72 },
      { x: 0.5, y: 0.92 },
      { x: 0.14, y: 0.72 },
      { x: 0.14, y: 0.32 },
    ],
  },
};
