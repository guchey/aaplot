import { describe, test, expect } from "bun:test";
import {
  rejectControlChars,
  validateRows,
  validateFieldExists,
  parseNumeric,
} from "../src/validator.ts";

describe("rejectControlChars", () => {
  test("accepts normal ASCII text", () => {
    expect(() => rejectControlChars("hello world", "test")).not.toThrow();
  });

  test("accepts tabs, newlines, carriage returns", () => {
    expect(() => rejectControlChars("line1\tvalue\nline2\r\n", "test")).not.toThrow();
  });

  test("accepts empty string", () => {
    expect(() => rejectControlChars("", "test")).not.toThrow();
  });

  test("accepts unicode characters", () => {
    expect(() => rejectControlChars("日本語テスト 🎉", "test")).not.toThrow();
  });

  test("rejects null byte", () => {
    expect(() => rejectControlChars("abc\x00def", "field")).toThrow(
      /contains control character U\+0000 at position 3/
    );
  });

  test("rejects bell character", () => {
    expect(() => rejectControlChars("\x07", "field")).toThrow(
      /contains control character U\+0007/
    );
  });

  test("rejects escape character", () => {
    expect(() => rejectControlChars("pre\x1bpost", "field")).toThrow(
      /contains control character U\+001b/
    );
  });

  test("includes context in error message", () => {
    expect(() => rejectControlChars("\x01", "Row 5, field \"name\"")).toThrow(
      /Row 5, field "name"/
    );
  });
});

describe("validateRows", () => {
  test("accepts valid array of objects with string values", () => {
    const result = validateRows([{ name: "A", val: "10" }]);
    expect(result).toEqual([{ name: "A", val: "10" }]);
  });

  test("normalizes number values to strings", () => {
    const result = validateRows([{ name: "A", val: 42 }]);
    expect(result).toEqual([{ name: "A", val: "42" }]);
  });

  test("normalizes null values to empty strings", () => {
    const result = validateRows([{ name: "A", val: null }]);
    expect(result).toEqual([{ name: "A", val: "" }]);
  });

  test("throws on non-array input", () => {
    expect(() => validateRows("not an array")).toThrow("Expected a JSON array");
    expect(() => validateRows({})).toThrow("Expected a JSON array");
    expect(() => validateRows(42)).toThrow("Expected a JSON array");
  });

  test("throws on empty array", () => {
    expect(() => validateRows([])).toThrow("Query returned zero rows");
  });

  test("throws on array of non-objects", () => {
    expect(() => validateRows(["string"])).toThrow("Row 0: expected a JSON object");
    expect(() => validateRows([null])).toThrow("Row 0: expected a JSON object");
    expect(() => validateRows([[1, 2]])).toThrow("Row 0: expected a JSON object");
  });

  test("throws on unsupported value types", () => {
    expect(() => validateRows([{ nested: { a: 1 } }])).toThrow(
      'Row 0, field "nested": expected string or number, got object'
    );
    expect(() => validateRows([{ flag: true }])).toThrow(
      'Row 0, field "flag": expected string or number, got boolean'
    );
  });

  test("throws on control characters in values", () => {
    expect(() => validateRows([{ name: "bad\x00val" }])).toThrow(
      /contains control character/
    );
  });

  test("handles multiple rows", () => {
    const result = validateRows([
      { a: "1", b: "x" },
      { a: "2", b: "y" },
    ]);
    expect(result).toHaveLength(2);
    expect(result[1]).toEqual({ a: "2", b: "y" });
  });
});

describe("validateFieldExists", () => {
  const rows = [{ name: "A", count: "10" }];

  test("does not throw for existing field", () => {
    expect(() => validateFieldExists(rows, "name")).not.toThrow();
    expect(() => validateFieldExists(rows, "count")).not.toThrow();
  });

  test("throws for missing field with available fields listed", () => {
    expect(() => validateFieldExists(rows, "missing")).toThrow(
      'Field "missing" not found. Available fields: name, count'
    );
  });

  test("does nothing for empty rows", () => {
    expect(() => validateFieldExists([], "anything")).not.toThrow();
  });
});

describe("parseNumeric", () => {
  test("parses integer strings", () => {
    expect(parseNumeric("42", "val", 0)).toBe(42);
    expect(parseNumeric("-7", "val", 0)).toBe(-7);
    expect(parseNumeric("0", "val", 0)).toBe(0);
  });

  test("parses float strings", () => {
    expect(parseNumeric("3.14", "val", 0)).toBeCloseTo(3.14);
    expect(parseNumeric("-0.5", "val", 0)).toBeCloseTo(-0.5);
  });

  test("parses scientific notation", () => {
    expect(parseNumeric("1e3", "val", 0)).toBe(1000);
    expect(parseNumeric("2.5e-1", "val", 0)).toBeCloseTo(0.25);
  });

  test("throws on non-numeric strings", () => {
    expect(() => parseNumeric("abc", "val", 3)).toThrow(
      'Row 3, field "val": "abc" is not a valid number'
    );
  });

  test("parses empty string as 0 (Number('') === 0)", () => {
    // Note: Number("") === 0 in JavaScript, so this is valid
    expect(parseNumeric("", "val", 0)).toBe(0);
  });

  test("throws on Infinity", () => {
    expect(() => parseNumeric("Infinity", "val", 0)).toThrow("is not a valid number");
  });

  test("throws on NaN", () => {
    expect(() => parseNumeric("NaN", "val", 0)).toThrow("is not a valid number");
  });
});
