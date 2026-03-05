import type { DataPoint, CommonOptions, Series } from "./types.ts";
import { Canvas, getTerminalSize } from "../renderer/canvas.ts";
import { computeScale, computePlotArea, drawAxes, drawTitle, drawLegend } from "../renderer/axis.ts";
import { resolvePalette, isNoColor, getSeriesColor } from "../renderer/color.ts";

// Braille dot bit positions in a 2x4 grid:
//  col 0  col 1
//  dot1   dot4   (row 0)
//  dot2   dot5   (row 1)
//  dot3   dot6   (row 2)
//  dot7   dot8   (row 3)
const BRAILLE_DOTS: number[][] = [
  [0x01, 0x08], // row 0
  [0x02, 0x10], // row 1
  [0x04, 0x20], // row 2
  [0x40, 0x80], // row 3
];
const BRAILLE_BASE = 0x2800;

export function renderScatter(
  points: DataPoint[],
  xLabels: string[] | null,
  opts: CommonOptions
): string {
  const palette = resolvePalette(opts.theme);
  const nc = isNoColor();
  const term = getTerminalSize(opts.width, opts.height);
  const canvas = new Canvas(term.width, term.height - 1);

  const area = computePlotArea(canvas.width, canvas.height, !!opts.title);

  const pixWidth = area.width * 2;
  const pixHeight = area.height * 4;
  const pixels = new Uint8Array(pixWidth * pixHeight);

  const xValues = points.map((p) => p.x);
  const yValues = points.map((p) => p.y);
  const xScale = computeScale(Math.min(...xValues), Math.max(...xValues));
  const yScale = computeScale(Math.min(...yValues), Math.max(...yValues));

  drawAxes(canvas, area, xLabels ? null : xScale, yScale, xLabels, palette, nc);
  drawTitle(canvas, opts.title, palette, nc);

  // Map data points to pixel coordinates
  for (const point of points) {
    const px = xScale.range === 0
      ? Math.floor(pixWidth / 2)
      : Math.round(((point.x - xScale.min) / xScale.range) * (pixWidth - 1));
    const py = yScale.range === 0
      ? Math.floor(pixHeight / 2)
      : pixHeight - 1 - Math.round(((point.y - yScale.min) / yScale.range) * (pixHeight - 1));

    if (px >= 0 && px < pixWidth && py >= 0 && py < pixHeight) {
      pixels[py * pixWidth + px] = 1;
    }
  }

  // Convert pixel buffer to braille characters
  const dotColor = nc ? "" : palette.line;
  for (let cy = 0; cy < area.height; cy++) {
    for (let cx = 0; cx < area.width; cx++) {
      let bits = 0;
      for (let dr = 0; dr < 4; dr++) {
        for (let dc = 0; dc < 2; dc++) {
          const px = cx * 2 + dc;
          const py = cy * 4 + dr;
          if (pixels[py * pixWidth + px]) {
            bits |= BRAILLE_DOTS[dr]![dc]!;
          }
        }
      }
      if (bits > 0) {
        canvas.set(
          area.left + cx,
          area.top + cy,
          String.fromCodePoint(BRAILLE_BASE | bits),
          dotColor
        );
      }
    }
  }

  return canvas.render(nc);
}

export function renderMultiScatter(
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

  const pixWidth = area.width * 2;
  const pixHeight = area.height * 4;

  const allPoints = series.flatMap((s) => s.points);
  const xValues = allPoints.map((p) => p.x);
  const yValues = allPoints.map((p) => p.y);
  const xScale = computeScale(Math.min(...xValues), Math.max(...xValues));
  const yScale = computeScale(Math.min(...yValues), Math.max(...yValues));

  drawAxes(canvas, area, xLabels ? null : xScale, yScale, xLabels, palette, nc);
  drawTitle(canvas, opts.title, palette, nc);

  // Each series gets its own pixel buffer so colors don't merge
  for (let si = 0; si < series.length; si++) {
    const s = series[si]!;
    const pixels = new Uint8Array(pixWidth * pixHeight);
    const dotColor = nc ? "" : getSeriesColor(palette, si);

    for (const point of s.points) {
      const px = xScale.range === 0
        ? Math.floor(pixWidth / 2)
        : Math.round(((point.x - xScale.min) / xScale.range) * (pixWidth - 1));
      const py = yScale.range === 0
        ? Math.floor(pixHeight / 2)
        : pixHeight - 1 - Math.round(((point.y - yScale.min) / yScale.range) * (pixHeight - 1));

      if (px >= 0 && px < pixWidth && py >= 0 && py < pixHeight) {
        pixels[py * pixWidth + px] = 1;
      }
    }

    for (let cy = 0; cy < area.height; cy++) {
      for (let cx = 0; cx < area.width; cx++) {
        let bits = 0;
        for (let dr = 0; dr < 4; dr++) {
          for (let dc = 0; dc < 2; dc++) {
            const px = cx * 2 + dc;
            const py = cy * 4 + dr;
            if (pixels[py * pixWidth + px]) {
              bits |= BRAILLE_DOTS[dr]![dc]!;
            }
          }
        }
        if (bits > 0) {
          canvas.set(
            area.left + cx,
            area.top + cy,
            String.fromCodePoint(BRAILLE_BASE | bits),
            dotColor
          );
        }
      }
    }
  }

  const seriesColors = series.map((_, i) => getSeriesColor(palette, i));
  drawLegend(canvas, series.map((s) => s.key), seriesColors, nc, legendRow);

  return canvas.render(nc);
}
