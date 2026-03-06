import { describe, test, expect } from "bun:test";
import { getSchema, getAllSchemas } from "../src/schema.ts";

describe("getSchema", () => {
  test("returns valid JSON for bar command", () => {
    const result = JSON.parse(getSchema("bar"));
    expect(result.command).toBe("bar");
    expect(result.description).toBeDefined();
    expect(result.required.x).toBeDefined();
    expect(result.required.y).toBeDefined();
    expect(result.optional.width).toBeDefined();
    expect(result.optional.theme).toBeDefined();
    expect(result.optional["dry-run"]).toBeDefined();
    expect(result.optional.json).toBeDefined();
    expect(result.input).toBeDefined();
    expect(result.input_example).toBeArray();
  });

  test("returns valid JSON for all known commands", () => {
    for (const cmd of ["bar", "line", "area", "scatter", "histogram", "count", "boxplot", "density"]) {
      const result = JSON.parse(getSchema(cmd));
      expect(result.command).toBe(cmd);
      expect(result.required).toBeDefined();
      expect(result.optional).toBeDefined();
    }
  });

  test("histogram has bins in optional", () => {
    const result = JSON.parse(getSchema("histogram"));
    expect(result.optional.bins).toBeDefined();
  });

  test("histogram does not require y field", () => {
    const result = JSON.parse(getSchema("histogram"));
    expect(result.required.y).toBeUndefined();
    expect(result.required.x).toBeDefined();
  });

  test("returns error JSON for unknown command", () => {
    const result = JSON.parse(getSchema("unknown"));
    expect(result.error).toContain("Unknown command");
    expect(result.error).toContain("bar");
    expect(result.error).toContain("line");
  });
});

describe("getAllSchemas", () => {
  test("returns valid JSON with all commands", () => {
    const result = JSON.parse(getAllSchemas());
    expect(result.commands).toEqual(["bar", "line", "area", "scatter", "histogram", "count", "boxplot", "density"]);
    expect(Object.keys(result.schemas)).toEqual(["bar", "line", "area", "scatter", "histogram", "count", "boxplot", "density"]);
  });

  test("each schema has required fields", () => {
    const result = JSON.parse(getAllSchemas());
    for (const [key, schema] of Object.entries(result.schemas) as [string, any][]) {
      expect(schema.command).toBe(key);
      expect(schema.description).toBeDefined();
      expect(schema.required).toBeDefined();
      expect(schema.optional).toBeDefined();
      expect(schema.input).toBeDefined();
      expect(schema.input_example).toBeArray();
    }
  });
});
