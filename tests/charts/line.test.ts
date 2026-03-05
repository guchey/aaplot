import { describe, test, expect } from "bun:test";
import { renderLine, renderMultiLine } from "../../src/charts/line.ts";
import type { DataPoint, CommonOptions, Series } from "../../src/charts/types.ts";

const defaultOpts: CommonOptions = {
  x: "x",
  y: "y",
  theme: "dark",
  width: 40,
  height: 15,
};

describe("renderLine", () => {
  test("renders without throwing", () => {
    const points: DataPoint[] = [
      { x: 1, y: 5 },
      { x: 2, y: 15 },
      { x: 3, y: 8 },
    ];
    const result = renderLine(points, null, defaultOpts);
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  test("contains point markers", () => {
    const points: DataPoint[] = [
      { x: 1, y: 10 },
      { x: 2, y: 20 },
    ];
    const result = renderLine(points, null, defaultOpts);
    expect(result).toContain("●");
  });

  test("contains line drawing characters", () => {
    const points: DataPoint[] = [
      { x: 1, y: 10 },
      { x: 5, y: 20 },
    ];
    const result = renderLine(points, null, defaultOpts);
    expect(result).toContain("─");
  });

  test("renders with categorical x labels", () => {
    const points: DataPoint[] = [
      { x: 0, y: 10, label: "Jan" },
      { x: 1, y: 20, label: "Feb" },
      { x: 2, y: 15, label: "Mar" },
    ];
    const result = renderLine(points, ["Jan", "Feb", "Mar"], defaultOpts);
    expect(result).toContain("Jan");
    expect(result).toContain("Mar");
  });

  test("handles single point", () => {
    const points: DataPoint[] = [{ x: 5, y: 10 }];
    const result = renderLine(points, null, defaultOpts);
    expect(result).toContain("●");
  });

  test("handles two points", () => {
    const points: DataPoint[] = [
      { x: 0, y: 0 },
      { x: 10, y: 10 },
    ];
    const result = renderLine(points, null, defaultOpts);
    expect(result).toContain("●");
  });

  test("renders title", () => {
    const points: DataPoint[] = [
      { x: 1, y: 5 },
      { x: 2, y: 10 },
    ];
    const result = renderLine(points, null, { ...defaultOpts, title: "Trend" });
    expect(result).toContain("Trend");
  });
});

describe("renderMultiLine", () => {
  const multiSeries: Series[] = [
    { key: "A", points: [{ x: 0, y: 10, label: "Jan" }, { x: 1, y: 20, label: "Feb" }] },
    { key: "B", points: [{ x: 0, y: 5, label: "Jan" }, { x: 1, y: 15, label: "Feb" }] },
  ];

  test("renders without throwing", () => {
    const result = renderMultiLine(multiSeries, ["Jan", "Feb"], defaultOpts);
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  test("contains point markers", () => {
    const result = renderMultiLine(multiSeries, ["Jan", "Feb"], defaultOpts);
    expect(result).toContain("●");
  });

  test("contains legend keys", () => {
    const result = renderMultiLine(multiSeries, ["Jan", "Feb"], defaultOpts);
    expect(result).toContain("A");
    expect(result).toContain("B");
  });

  test("renders with numeric x", () => {
    const series: Series[] = [
      { key: "S1", points: [{ x: 1, y: 10 }, { x: 2, y: 20 }] },
      { key: "S2", points: [{ x: 1, y: 5 }, { x: 2, y: 15 }] },
    ];
    const result = renderMultiLine(series, null, defaultOpts);
    expect(result).toContain("●");
  });
});
