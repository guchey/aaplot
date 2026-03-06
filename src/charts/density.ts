import type { CommonOptions } from "./types.ts";
import { Canvas, getTerminalSize } from "../renderer/canvas.ts";
import { computeScale, computePlotArea, drawAxes, drawTitle, drawLegend } from "../renderer/axis.ts";
import { resolvePalette, isNoColor, getSeriesColor } from "../renderer/color.ts";
import { BrailleBuffer } from "../renderer/braille.ts";

/** Silverman's rule of thumb for bandwidth */
function silvermanBandwidth(values: number[]): number {
  const n = values.length;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
  const std = Math.sqrt(variance);

  const sorted = [...values].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(n * 0.25)]!;
  const q3 = sorted[Math.floor(n * 0.75)]!;
  const iqr = q3 - q1;

  const spread = Math.min(std, iqr / 1.34);
  return 0.9 * (spread || 1) * Math.pow(n, -0.2);
}

/** Gaussian kernel */
function gaussian(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

/** Compute KDE at a set of evaluation points */
function kde(values: number[], evalPoints: number[], bandwidth: number): number[] {
  const n = values.length;
  return evalPoints.map((x) => {
    let sum = 0;
    for (const xi of values) {
      sum += gaussian((x - xi) / bandwidth);
    }
    return sum / (n * bandwidth);
  });
}

/** Render a single density plot */
export function renderDensity(
  values: number[],
  field: string,
  opts: Omit<CommonOptions, "y">
): string {
  const palette = resolvePalette(opts.theme);
  const nc = isNoColor();
  const term = getTerminalSize(opts.width, opts.height);
  const canvas = new Canvas(term.width, term.height - 1);

  const area = computePlotArea(canvas.width, canvas.height, !!opts.title);

  const h = silvermanBandwidth(values);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const padding = h * 3;
  const evalMin = min - padding;
  const evalMax = max + padding;

  const buf = new BrailleBuffer(area);
  const nEvalPoints = buf.pixWidth;
  const evalPoints = Array.from({ length: nEvalPoints }, (_, i) =>
    evalMin + (i / (nEvalPoints - 1)) * (evalMax - evalMin)
  );
  const densityValues = kde(values, evalPoints, h);

  const xScale = computeScale(evalMin, evalMax);
  const yScale = computeScale(0, Math.max(...densityValues));

  drawAxes(canvas, area, xScale, yScale, null, palette, nc);

  // Fill area under the curve
  const fillBuf = new BrailleBuffer(area);
  for (let i = 0; i < nEvalPoints; i++) {
    const py = fillBuf.mapY(densityValues[i]!, yScale.min, yScale.range);
    fillBuf.fillDown(i, py, fillBuf.pixHeight - 1);
  }
  fillBuf.render(canvas, area, nc ? "" : palette.fill);

  // Draw curve line on top
  for (let i = 1; i < nEvalPoints; i++) {
    buf.line(
      i - 1,
      buf.mapY(densityValues[i - 1]!, yScale.min, yScale.range),
      i,
      buf.mapY(densityValues[i]!, yScale.min, yScale.range)
    );
  }
  buf.render(canvas, area, nc ? "" : palette.line);

  // Draw title after rendering so it's not overwritten
  drawTitle(canvas, opts.title ?? `Density of ${field}`, palette, nc);

  return canvas.render(nc);
}

/** Render multiple density plots overlaid */
export function renderMultiDensity(
  groups: { key: string; values: number[] }[],
  opts: Omit<CommonOptions, "y">
): string {
  const palette = resolvePalette(opts.theme);
  const nc = isNoColor();
  const term = getTerminalSize(opts.width, opts.height);
  const canvas = new Canvas(term.width, term.height - 1);

  const legendRow = canvas.height - 1;
  const area = computePlotArea(canvas.width, canvas.height - 1, !!opts.title);

  const allValues = groups.flatMap((g) => g.values);
  const globalMin = Math.min(...allValues);
  const globalMax = Math.max(...allValues);
  const padding = silvermanBandwidth(allValues) * 3;
  const evalMin = globalMin - padding;
  const evalMax = globalMax + padding;

  const nEvalPoints = area.width * 2; // subpixel resolution
  const evalPoints = Array.from({ length: nEvalPoints }, (_, i) =>
    evalMin + (i / (nEvalPoints - 1)) * (evalMax - evalMin)
  );

  const groupDensities = groups.map((g) => {
    const h = silvermanBandwidth(g.values);
    return kde(g.values, evalPoints, h);
  });

  const maxDensity = Math.max(...groupDensities.flat());
  const xScale = computeScale(evalMin, evalMax);
  const yScale = computeScale(0, maxDensity);

  drawAxes(canvas, area, xScale, yScale, null, palette, nc);
  drawTitle(canvas, opts.title, palette, nc);

  for (let gi = 0; gi < groups.length; gi++) {
    const densityVals = groupDensities[gi]!;
    const color = nc ? "" : getSeriesColor(palette, gi);
    const buf = new BrailleBuffer(area);

    for (let i = 1; i < nEvalPoints; i++) {
      buf.line(
        i - 1,
        buf.mapY(densityVals[i - 1]!, yScale.min, yScale.range),
        i,
        buf.mapY(densityVals[i]!, yScale.min, yScale.range)
      );
    }

    buf.render(canvas, area, color);
  }

  const seriesColors = groups.map((_, i) => getSeriesColor(palette, i));
  drawLegend(canvas, groups.map((g) => g.key), seriesColors, nc, legendRow);

  return canvas.render(nc);
}
