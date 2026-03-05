import type { CommonOptions, DataPoint, HistogramOptions } from "./types.ts";
import { renderBar } from "./bar.ts";

/** Sturges' rule: bins = ceil(log2(n) + 1) */
function sturgesBins(n: number): number {
  return Math.ceil(Math.log2(n) + 1);
}

export function renderHistogram(
  values: number[],
  field: string,
  opts: HistogramOptions
): string {
  const n = values.length;
  const binCount = opts.bins ?? sturgesBins(n);

  const min = Math.min(...values);
  const max = Math.max(...values);
  const binWidth = max === min ? 1 : (max - min) / binCount;

  const counts = new Array<number>(binCount).fill(0);
  for (const v of values) {
    let bin = max === min ? 0 : Math.floor((v - min) / binWidth);
    if (bin >= binCount) bin = binCount - 1;
    counts[bin]!++;
  }

  const points: DataPoint[] = counts.map((count, i) => {
    const lo = min + i * binWidth;
    const hi = lo + binWidth;
    return {
      x: i,
      y: count,
      label: `${formatBinEdge(lo)}-${formatBinEdge(hi)}`,
    };
  });

  const xLabels = points.map((p) => p.label!);

  const barOpts: CommonOptions = {
    x: field,
    y: "count",
    theme: opts.theme,
    title: opts.title ?? `Histogram of ${field}`,
    width: opts.width,
    height: opts.height,
  };

  return renderBar(points, xLabels, barOpts);
}

function formatBinEdge(value: number): string {
  if (Number.isInteger(value)) return value.toString();
  return parseFloat(value.toPrecision(3)).toString();
}
