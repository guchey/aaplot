import { describe, test, expect } from "bun:test";
import { renderCount } from "../../src/charts/count.ts";

const defaultOpts = {
  x: "status",
  theme: "dark" as const,
  width: 40,
  height: 15,
};

describe("renderCount", () => {
  test("renders without throwing", () => {
    const values = ["active", "pending", "active", "error", "active"];
    const result = renderCount(values, "status", defaultOpts);
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  test("contains block characters", () => {
    const values = ["a", "a", "a", "b", "b", "c"];
    const result = renderCount(values, "category", defaultOpts);
    expect(result).toMatch(/[▁▂▃▄▅▆▇█]/);
  });

  test("auto-generates title with field name", () => {
    const values = ["x", "y", "x"];
    const result = renderCount(values, "type", defaultOpts);
    expect(result).toContain("Count of type");
  });

  test("uses custom title when provided", () => {
    const values = ["x", "y", "x"];
    const result = renderCount(values, "type", { ...defaultOpts, title: "My Count" });
    expect(result).toContain("My Count");
    expect(result).not.toContain("Count of type");
  });

  test("handles single unique value", () => {
    const values = ["same", "same", "same"];
    const result = renderCount(values, "val", defaultOpts);
    expect(typeof result).toBe("string");
  });

  test("handles all unique values", () => {
    const values = ["a", "b", "c", "d", "e"];
    const result = renderCount(values, "val", defaultOpts);
    expect(typeof result).toBe("string");
  });

  test("preserves insertion order", () => {
    const values = ["banana", "apple", "banana", "cherry"];
    const result = renderCount(values, "fruit", defaultOpts);
    // banana should appear before apple in the output
    const bananaIdx = result.indexOf("banana");
    const appleIdx = result.indexOf("apple");
    expect(bananaIdx).toBeLessThan(appleIdx);
  });
});
