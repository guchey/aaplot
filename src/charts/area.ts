import type { DataPoint, CommonOptions, Series } from "./types.ts";
import { Canvas, getTerminalSize } from "../renderer/canvas.ts";
import { computeScale, computePlotArea, drawAxes, drawTitle, drawLegend } from "../renderer/axis.ts";
import { resolvePalette, isNoColor, getSeriesColor } from "../renderer/color.ts";

export function renderArea(
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

  const baselineY = area.top + area.height - 1;

  drawAxes(canvas, area, xLabels ? null : xScale, yScale, xLabels, palette, nc);
  drawTitle(canvas, opts.title, palette, nc);

  const fillColor = nc ? "" : palette.fill;
  const lineColor = nc ? "" : palette.line;

  // For each column, interpolate y and fill below
  for (let col = 0; col < area.width; col++) {
    const dataX = xScale.range === 0
      ? xScale.min
      : xScale.min + (col / (area.width - 1)) * xScale.range;

    // Linear interpolation
    let y: number | null = null;
    for (let i = 1; i < points.length; i++) {
      const p0 = points[i - 1]!;
      const p1 = points[i]!;
      if (dataX >= p0.x && dataX <= p1.x) {
        const t = p1.x === p0.x ? 0 : (dataX - p0.x) / (p1.x - p0.x);
        y = p0.y + t * (p1.y - p0.y);
        break;
      }
    }

    if (y === null) continue;

    const canvasY = yScale.range === 0
      ? area.top + Math.floor(area.height / 2)
      : area.top + area.height - 1 - Math.round(((y - yScale.min) / yScale.range) * (area.height - 1));

    // Line pixel
    canvas.set(area.left + col, canvasY, "▄", lineColor);

    // Fill below
    for (let row = canvasY + 1; row <= baselineY; row++) {
      canvas.set(area.left + col, row, "░", fillColor);
    }
  }

  return canvas.render(nc);
}

export function renderMultiArea(
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

  const allPoints = series.flatMap((s) => s.points);
  const xValues = allPoints.map((p) => p.x);
  const yValues = allPoints.map((p) => p.y);
  const xScale = computeScale(Math.min(...xValues), Math.max(...xValues));
  const yScale = computeScale(Math.min(...yValues), Math.max(...yValues));

  const baselineY = area.top + area.height - 1;

  drawAxes(canvas, area, xLabels ? null : xScale, yScale, xLabels, palette, nc);
  drawTitle(canvas, opts.title, palette, nc);

  // Draw each series (later series draw on top)
  for (let si = 0; si < series.length; si++) {
    const s = series[si]!;
    const fillColor = nc ? "" : getSeriesColor(palette, si);
    const lineColor = fillColor;

    for (let col = 0; col < area.width; col++) {
      const dataX = xScale.range === 0
        ? xScale.min
        : xScale.min + (col / (area.width - 1)) * xScale.range;

      let y: number | null = null;
      for (let i = 1; i < s.points.length; i++) {
        const p0 = s.points[i - 1]!;
        const p1 = s.points[i]!;
        if (dataX >= p0.x && dataX <= p1.x) {
          const t = p1.x === p0.x ? 0 : (dataX - p0.x) / (p1.x - p0.x);
          y = p0.y + t * (p1.y - p0.y);
          break;
        }
      }

      if (y === null) continue;

      const canvasY = yScale.range === 0
        ? area.top + Math.floor(area.height / 2)
        : area.top + area.height - 1 - Math.round(((y - yScale.min) / yScale.range) * (area.height - 1));

      canvas.set(area.left + col, canvasY, "▄", lineColor);
      for (let row = canvasY + 1; row <= baselineY; row++) {
        canvas.set(area.left + col, row, "░", fillColor);
      }
    }
  }

  const seriesColors = series.map((_, i) => getSeriesColor(palette, i));
  drawLegend(canvas, series.map((s) => s.key), seriesColors, nc, legendRow);

  return canvas.render(nc);
}
