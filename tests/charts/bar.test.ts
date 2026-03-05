import { describe, test, expect } from "bun:test";
import { renderBar, renderGroupedBar } from "../../src/charts/bar.ts";
import type { DataPoint, CommonOptions, Series } from "../../src/charts/types.ts";

const defaultOpts: CommonOptions = {
  x: "name",
  y: "val",
  theme: "dark",
  width: 40,
  height: 15,
};

describe("renderBar", () => {
  test("renders without throwing", () => {
    const points: DataPoint[] = [
      { x: 0, y: 10, label: "A" },
      { x: 1, y: 25, label: "B" },
      { x: 2, y: 15, label: "C" },
    ];
    const result = renderBar(points, ["A", "B", "C"], defaultOpts);
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  test("output contains block characters for non-zero values", () => {
    const points: DataPoint[] = [
      { x: 0, y: 10, label: "A" },
      { x: 1, y: 20, label: "B" },
    ];
    const result = renderBar(points, ["A", "B"], defaultOpts);
    expect(result).toMatch(/[▁▂▃▄▅▆▇█]/);
  });

  test("output contains axis characters", () => {
    const points: DataPoint[] = [{ x: 0, y: 10, label: "A" }];
    const result = renderBar(points, ["A"], defaultOpts);
    expect(result).toContain("│");
    expect(result).toContain("─");
    expect(result).toContain("└");
  });

  test("renders title when provided", () => {
    const points: DataPoint[] = [{ x: 0, y: 10, label: "A" }];
    const opts = { ...defaultOpts, title: "My Chart" };
    const result = renderBar(points, ["A"], opts);
    expect(result).toContain("My Chart");
  });

  test("handles single data point", () => {
    const points: DataPoint[] = [{ x: 0, y: 42, label: "Only" }];
    const result = renderBar(points, ["Only"], defaultOpts);
    expect(result).toContain("█");
  });

  test("handles zero values", () => {
    const points: DataPoint[] = [
      { x: 0, y: 0, label: "A" },
      { x: 1, y: 10, label: "B" },
    ];
    const result = renderBar(points, ["A", "B"], defaultOpts);
    expect(typeof result).toBe("string");
  });

  test("handles all same values", () => {
    const points: DataPoint[] = [
      { x: 0, y: 5, label: "A" },
      { x: 1, y: 5, label: "B" },
      { x: 2, y: 5, label: "C" },
    ];
    const result = renderBar(points, ["A", "B", "C"], defaultOpts);
    expect(typeof result).toBe("string");
  });

  test("respects width and height options", () => {
    const points: DataPoint[] = [{ x: 0, y: 10, label: "A" }];
    const result = renderBar(points, ["A"], { ...defaultOpts, width: 30, height: 10 });
    const lines = result.split("\n");
    // height - 1 (canvas) lines
    expect(lines.length).toBe(9);
    // each line should be at most 30 chars (excluding ANSI codes)
    for (const line of lines) {
      const stripped = line.replace(/\x1b\[[0-9;]*m/g, "");
      expect(stripped.length).toBeLessThanOrEqual(30);
    }
  });
});

describe("renderGroupedBar", () => {
  const multiSeries: Series[] = [
    { key: "44", points: [{ x: 0, y: 10, label: "Apr" }, { x: 1, y: 30, label: "May" }] },
    { key: "40", points: [{ x: 0, y: 20, label: "Apr" }, { x: 1, y: 15, label: "May" }] },
  ];

  test("renders without throwing", () => {
    const result = renderGroupedBar(multiSeries, ["Apr", "May"], defaultOpts);
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  test("contains block characters", () => {
    const result = renderGroupedBar(multiSeries, ["Apr", "May"], defaultOpts);
    expect(result).toMatch(/[▁▂▃▄▅▆▇█]/);
  });

  test("contains legend keys", () => {
    const result = renderGroupedBar(multiSeries, ["Apr", "May"], defaultOpts);
    expect(result).toContain("44");
    expect(result).toContain("40");
  });
});
