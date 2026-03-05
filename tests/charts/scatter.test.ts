import { describe, test, expect } from "bun:test";
import { renderScatter } from "../../src/charts/scatter.ts";
import type { DataPoint, CommonOptions } from "../../src/charts/types.ts";

const defaultOpts: CommonOptions = {
  x: "x",
  y: "y",
  theme: "dark",
  width: 40,
  height: 15,
};

describe("renderScatter", () => {
  test("renders without throwing", () => {
    const points: DataPoint[] = [
      { x: 1, y: 5 },
      { x: 3, y: 15 },
      { x: 7, y: 8 },
    ];
    const result = renderScatter(points, null, defaultOpts);
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  test("contains braille characters", () => {
    const points: DataPoint[] = [
      { x: 1, y: 10 },
      { x: 5, y: 20 },
      { x: 9, y: 15 },
    ];
    const result = renderScatter(points, null, defaultOpts);
    // Braille characters are in range U+2800–U+28FF
    const hasBraille = /[\u2800-\u28FF]/.test(result);
    expect(hasBraille).toBe(true);
  });

  test("contains axis characters", () => {
    const points: DataPoint[] = [{ x: 1, y: 10 }];
    const result = renderScatter(points, null, defaultOpts);
    expect(result).toContain("│");
    expect(result).toContain("─");
    expect(result).toContain("└");
  });

  test("handles single point", () => {
    const points: DataPoint[] = [{ x: 5, y: 10 }];
    const result = renderScatter(points, null, defaultOpts);
    const hasBraille = /[\u2800-\u28FF]/.test(result);
    expect(hasBraille).toBe(true);
  });

  test("handles many points (density)", () => {
    const points: DataPoint[] = [];
    for (let i = 0; i < 50; i++) {
      points.push({ x: i, y: i * 2 + (i % 3) });
    }
    const result = renderScatter(points, null, defaultOpts);
    expect(typeof result).toBe("string");
  });

  test("handles identical points", () => {
    const points: DataPoint[] = [
      { x: 5, y: 5 },
      { x: 5, y: 5 },
      { x: 5, y: 5 },
    ];
    const result = renderScatter(points, null, defaultOpts);
    expect(typeof result).toBe("string");
  });

  test("renders title", () => {
    const points: DataPoint[] = [
      { x: 1, y: 5 },
      { x: 2, y: 10 },
    ];
    const result = renderScatter(points, null, { ...defaultOpts, title: "Scatter" });
    expect(result).toContain("Scatter");
  });
});
