import { describe, test, expect } from "bun:test";
import { renderDensity, renderMultiDensity } from "../../src/charts/density.ts";

const defaultOpts = {
  x: "latency",
  theme: "dark" as const,
  width: 60,
  height: 15,
};

const hasBraille = (s: string) => /[\u2800-\u28FF]/.test(s);

describe("renderDensity", () => {
  test("renders without throwing", () => {
    const values = [10, 12, 13, 14, 15, 16, 17, 18, 20, 25];
    const result = renderDensity(values, "latency", defaultOpts);
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  test("contains braille characters for curve", () => {
    const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const result = renderDensity(values, "val", defaultOpts);
    expect(hasBraille(result)).toBe(true);
  });

  test("auto-generates title with field name", () => {
    const values = [1, 2, 3, 4, 5];
    const result = renderDensity(values, "age", defaultOpts);
    expect(result).toContain("Density of age");
  });

  test("uses custom title when provided", () => {
    const values = [1, 2, 3, 4, 5];
    const result = renderDensity(values, "age", { ...defaultOpts, title: "Custom" });
    expect(result).toContain("Custom");
  });

  test("handles identical values", () => {
    const values = [5, 5, 5, 5, 5];
    const result = renderDensity(values, "val", defaultOpts);
    expect(typeof result).toBe("string");
  });

  test("handles large dataset", () => {
    const values = Array.from({ length: 500 }, (_, i) => Math.sin(i) * 50 + 50);
    const result = renderDensity(values, "val", defaultOpts);
    expect(typeof result).toBe("string");
  });
});

describe("renderMultiDensity", () => {
  const groups = [
    { key: "fast", values: [10, 12, 13, 14, 15, 16, 17, 18, 20] },
    { key: "slow", values: [30, 35, 40, 45, 50, 55, 60, 65, 70] },
  ];

  test("renders without throwing", () => {
    const result = renderMultiDensity(groups, defaultOpts);
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  test("contains legend keys", () => {
    const result = renderMultiDensity(groups, defaultOpts);
    expect(result).toContain("fast");
    expect(result).toContain("slow");
  });

  test("contains braille characters", () => {
    const result = renderMultiDensity(groups, defaultOpts);
    expect(hasBraille(result)).toBe(true);
  });
});
