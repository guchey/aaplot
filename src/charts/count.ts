import type { CommonOptions, DataPoint } from "./types.ts";
import { renderBar } from "./bar.ts";

/** Count occurrences of each unique value in a column and render as bar chart */
export function renderCount(
  values: string[],
  field: string,
  opts: Omit<CommonOptions, "y">
): string {
  // Count occurrences, preserving insertion order
  const counts = new Map<string, number>();
  for (const v of values) {
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }

  const entries = [...counts.entries()];
  const points: DataPoint[] = entries.map(([label, count], i) => ({
    x: i,
    y: count,
    label,
  }));
  const xLabels = entries.map(([label]) => label);

  const barOpts: CommonOptions = {
    x: field,
    y: "count",
    theme: opts.theme,
    title: opts.title ?? `Count of ${field}`,
    width: opts.width,
    height: opts.height,
  };

  return renderBar(points, xLabels, barOpts);
}
