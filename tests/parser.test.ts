import { describe, test, expect } from "bun:test";
import { readInput, extractXY, extractColumn, groupRows } from "../src/parser/json.ts";

describe("readInput", () => {
  test("parses inline JSON via --json flag", async () => {
    const rows = await readInput('[{"name":"A","val":"10"}]');
    expect(rows).toEqual([{ name: "A", val: "10" }]);
  });

  test("trims whitespace from inline JSON", async () => {
    const rows = await readInput('  [{"x":"1"}]  ');
    expect(rows).toEqual([{ x: "1" }]);
  });

  test("parses NDJSON (one object per line, bq format)", async () => {
    const ndjson = '{"name":"A","val":"10"}\n{"name":"B","val":"20"}';
    const rows = await readInput(ndjson);
    expect(rows).toEqual([
      { name: "A", val: "10" },
      { name: "B", val: "20" },
    ]);
  });

  test("parses NDJSON with trailing newline", async () => {
    const ndjson = '{"x":"1"}\n{"x":"2"}\n';
    const rows = await readInput(ndjson);
    expect(rows).toHaveLength(2);
  });

  test("parses single-line NDJSON (one row)", async () => {
    const rows = await readInput('{"name":"A","val":"10"}');
    expect(rows).toEqual([{ name: "A", val: "10" }]);
  });

  test("throws on invalid NDJSON line", async () => {
    const bad = '{"name":"A"}\nnot json\n{"name":"B"}';
    await expect(readInput(bad)).rejects.toThrow("Failed to parse line 2");
  });

  test("throws on non-array JSON", async () => {
    await expect(readInput("[]")).rejects.toThrow("Query returned zero rows");
  });
});

describe("extractXY", () => {
  test("extracts numeric x and y", () => {
    const rows = [
      { x: "1", y: "10" },
      { x: "2", y: "20" },
      { x: "3", y: "30" },
    ];
    const { points, xLabels } = extractXY(rows, "x", "y");

    expect(xLabels).toBeNull();
    expect(points).toHaveLength(3);
    expect(points[0]).toEqual({ x: 1, y: 10 });
    expect(points[1]).toEqual({ x: 2, y: 20 });
    expect(points[2]).toEqual({ x: 3, y: 30 });
  });

  test("detects categorical x and assigns indices", () => {
    const rows = [
      { cat: "Apple", val: "5" },
      { cat: "Banana", val: "8" },
      { cat: "Cherry", val: "3" },
    ];
    const { points, xLabels } = extractXY(rows, "cat", "val");

    expect(xLabels).toEqual(["Apple", "Banana", "Cherry"]);
    expect(points[0]).toEqual({ x: 0, y: 5, label: "Apple" });
    expect(points[1]).toEqual({ x: 1, y: 8, label: "Banana" });
    expect(points[2]).toEqual({ x: 2, y: 3, label: "Cherry" });
  });

  test("throws on missing x field", () => {
    const rows = [{ a: "1", b: "2" }];
    expect(() => extractXY(rows, "missing", "b")).toThrow('Field "missing" not found');
  });

  test("throws on missing y field", () => {
    const rows = [{ a: "1", b: "2" }];
    expect(() => extractXY(rows, "a", "missing")).toThrow('Field "missing" not found');
  });

  test("throws on non-numeric y value", () => {
    const rows = [{ x: "1", y: "abc" }];
    expect(() => extractXY(rows, "x", "y")).toThrow("is not a valid number");
  });

  test("handles single row", () => {
    const rows = [{ x: "5", y: "10" }];
    const { points } = extractXY(rows, "x", "y");
    expect(points).toHaveLength(1);
    expect(points[0]).toEqual({ x: 5, y: 10 });
  });

  test("handles negative values", () => {
    const rows = [
      { x: "-1", y: "-10" },
      { x: "0", y: "0" },
    ];
    const { points } = extractXY(rows, "x", "y");
    expect(points[0]).toEqual({ x: -1, y: -10 });
  });

  test("date strings are detected as categorical", () => {
    const rows = [
      { date: "2024-01", val: "10" },
      { date: "2024-02", val: "20" },
    ];
    const { xLabels } = extractXY(rows, "date", "val");
    expect(xLabels).toEqual(["2024-01", "2024-02"]);
  });
});

describe("extractColumn", () => {
  test("extracts a numeric column", () => {
    const rows = [{ score: "72" }, { score: "85" }, { score: "91" }];
    const values = extractColumn(rows, "score");
    expect(values).toEqual([72, 85, 91]);
  });

  test("throws on missing field", () => {
    const rows = [{ a: "1" }];
    expect(() => extractColumn(rows, "missing")).toThrow('Field "missing" not found');
  });

  test("throws on non-numeric value", () => {
    const rows = [{ score: "72" }, { score: "N/A" }];
    expect(() => extractColumn(rows, "score")).toThrow("is not a valid number");
  });

  test("handles float values", () => {
    const rows = [{ val: "1.5" }, { val: "2.7" }];
    const values = extractColumn(rows, "val");
    expect(values[0]).toBeCloseTo(1.5);
    expect(values[1]).toBeCloseTo(2.7);
  });
});

describe("groupRows", () => {
  test("splits rows by group field (categorical x)", () => {
    const rows = [
      { month: "Apr", gid: "A", val: "10" },
      { month: "Apr", gid: "B", val: "20" },
      { month: "May", gid: "A", val: "30" },
      { month: "May", gid: "B", val: "40" },
    ];
    const { series, xLabels } = groupRows(rows, "month", "val", "gid");

    expect(series).toHaveLength(2);
    expect(series[0]!.key).toBe("A");
    expect(series[1]!.key).toBe("B");
    expect(xLabels).toEqual(["Apr", "May"]);

    // Points should have aligned x indices
    expect(series[0]!.points[0]!.x).toBe(0); // Apr
    expect(series[0]!.points[1]!.x).toBe(1); // May
    expect(series[1]!.points[0]!.x).toBe(0); // Apr
    expect(series[1]!.points[1]!.x).toBe(1); // May
  });

  test("splits rows by group field (numeric x)", () => {
    const rows = [
      { x: "1", gid: "A", val: "10" },
      { x: "1", gid: "B", val: "20" },
      { x: "2", gid: "A", val: "30" },
      { x: "2", gid: "B", val: "40" },
    ];
    const { series, xLabels } = groupRows(rows, "x", "val", "gid");

    expect(series).toHaveLength(2);
    expect(xLabels).toBeNull();
    expect(series[0]!.points[0]).toEqual({ x: 1, y: 10 });
    expect(series[1]!.points[0]).toEqual({ x: 1, y: 20 });
  });

  test("throws on missing group field", () => {
    const rows = [{ x: "1", val: "10" }];
    expect(() => groupRows(rows, "x", "val", "missing")).toThrow('Field "missing" not found');
  });

  test("preserves insertion order of group keys", () => {
    const rows = [
      { x: "1", g: "B", y: "1" },
      { x: "1", g: "A", y: "2" },
      { x: "2", g: "B", y: "3" },
      { x: "2", g: "A", y: "4" },
    ];
    const { series } = groupRows(rows, "x", "y", "g");
    expect(series[0]!.key).toBe("B");
    expect(series[1]!.key).toBe("A");
  });
});
