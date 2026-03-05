import type { DataPoint, CommonOptions, Series } from "./types.ts";
import { Canvas, getTerminalSize } from "../renderer/canvas.ts";
import { computeScale, computePlotArea, drawAxes, drawTitle, drawLegend } from "../renderer/axis.ts";
import { resolvePalette, isNoColor, getSeriesColor } from "../renderer/color.ts";

function toCanvasX(x: number, xMin: number, xRange: number, area: { left: number; width: number }): number {
  if (xRange === 0) return area.left;
  return area.left + Math.round(((x - xMin) / xRange) * (area.width - 1));
}

function toCanvasY(y: number, yMin: number, yRange: number, area: { top: number; height: number }): number {
  if (yRange === 0) return area.top + Math.floor(area.height / 2);
  return area.top + area.height - 1 - Math.round(((y - yMin) / yRange) * (area.height - 1));
}

function drawSegment(canvas: Canvas, x0: number, y0: number, x1: number, y1: number, ansi: string): void {
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  let cx = x0;
  let cy = y0;

  while (true) {
    canvas.set(cx, cy, "─", ansi);
    if (cx === x1 && cy === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      cx += sx;
    }
    if (e2 < dx) {
      err += dx;
      cy += sy;
    }
  }
}

export function renderLine(
  points: DataPoint[],
  xLabels: string[] | null,
  opts: CommonOptions
): string {
  const palette = resolvePalette(opts.theme);
  const nc = isNoColor();
  const term = getTerminalSize(opts.width, opts.height);
  const canvas = new Canvas(term.width, term.height - 1);

  const area = computePlotArea(canvas.width, canvas.height, !!opts.title);

  const xValues = points.map((p) => p.x);
  const yValues = points.map((p) => p.y);
  const xScale = computeScale(Math.min(...xValues), Math.max(...xValues));
  const yScale = computeScale(Math.min(...yValues), Math.max(...yValues));

  drawAxes(canvas, area, xLabels ? null : xScale, yScale, xLabels, palette, nc);
  drawTitle(canvas, opts.title, palette, nc);

  const lineColor = nc ? "" : palette.line;

  // Connect consecutive points
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]!;
    const curr = points[i]!;
    const cx0 = toCanvasX(prev.x, xScale.min, xScale.range, area);
    const cy0 = toCanvasY(prev.y, yScale.min, yScale.range, area);
    const cx1 = toCanvasX(curr.x, xScale.min, xScale.range, area);
    const cy1 = toCanvasY(curr.y, yScale.min, yScale.range, area);
    drawSegment(canvas, cx0, cy0, cx1, cy1, lineColor);
  }

  // Draw point markers on top
  for (const point of points) {
    const cx = toCanvasX(point.x, xScale.min, xScale.range, area);
    const cy = toCanvasY(point.y, yScale.min, yScale.range, area);
    canvas.set(cx, cy, "●", lineColor);
  }

  return canvas.render(nc);
}

export function renderMultiLine(
  series: Series[],
  xLabels: string[] | null,
  opts: CommonOptions
): string {
  const palette = resolvePalette(opts.theme);
  const nc = isNoColor();
  const term = getTerminalSize(opts.width, opts.height);
  const canvas = new Canvas(term.width, term.height - 1);

  const legendRow = canvas.height - 1;
  const area = computePlotArea(canvas.width, canvas.height - 1, !!opts.title);

  // Compute unified scales across all series
  const allPoints = series.flatMap((s) => s.points);
  const xValues = allPoints.map((p) => p.x);
  const yValues = allPoints.map((p) => p.y);
  const xScale = computeScale(Math.min(...xValues), Math.max(...xValues));
  const yScale = computeScale(Math.min(...yValues), Math.max(...yValues));

  drawAxes(canvas, area, xLabels ? null : xScale, yScale, xLabels, palette, nc);
  drawTitle(canvas, opts.title, palette, nc);

  // Draw each series
  for (let si = 0; si < series.length; si++) {
    const s = series[si]!;
    const color = nc ? "" : getSeriesColor(palette, si);

    for (let i = 1; i < s.points.length; i++) {
      const prev = s.points[i - 1]!;
      const curr = s.points[i]!;
      const cx0 = toCanvasX(prev.x, xScale.min, xScale.range, area);
      const cy0 = toCanvasY(prev.y, yScale.min, yScale.range, area);
      const cx1 = toCanvasX(curr.x, xScale.min, xScale.range, area);
      const cy1 = toCanvasY(curr.y, yScale.min, yScale.range, area);
      drawSegment(canvas, cx0, cy0, cx1, cy1, color);
    }

    for (const point of s.points) {
      const cx = toCanvasX(point.x, xScale.min, xScale.range, area);
      const cy = toCanvasY(point.y, yScale.min, yScale.range, area);
      canvas.set(cx, cy, "●", color);
    }
  }

  // Legend
  const seriesColors = series.map((_, i) => getSeriesColor(palette, i));
  drawLegend(canvas, series.map((s) => s.key), seriesColors, nc, legendRow);

  return canvas.render(nc);
}
