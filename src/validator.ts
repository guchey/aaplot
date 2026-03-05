import type { Row } from "./charts/types.ts";

/**
 * Reject strings containing control characters (ASCII < 0x20)
 * except tab (0x09), newline (0x0A), carriage return (0x0D).
 */
export function rejectControlChars(value: string, context: string): void {
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    if (code < 0x20 && code !== 0x09 && code !== 0x0a && code !== 0x0d) {
      throw new Error(
        `${context}: contains control character U+${code.toString(16).padStart(4, "0")} at position ${i}`
      );
    }
  }
}

/** Validate that parsed JSON is an array of plain objects */
export function validateRows(parsed: unknown): Row[] {
  if (!Array.isArray(parsed)) {
    throw new Error("Expected a JSON array (bq query --format=json output).");
  }
  if (parsed.length === 0) {
    throw new Error("Query returned zero rows.");
  }
  for (let i = 0; i < parsed.length; i++) {
    const row = parsed[i];
    if (typeof row !== "object" || row === null || Array.isArray(row)) {
      throw new Error(`Row ${i}: expected a JSON object, got ${typeof row}.`);
    }
    for (const [key, val] of Object.entries(row as Record<string, unknown>)) {
      if (typeof val !== "string" && typeof val !== "number" && val !== null) {
        throw new Error(
          `Row ${i}, field "${key}": expected string or number, got ${typeof val}.`
        );
      }
      if (typeof val === "string") {
        rejectControlChars(val, `Row ${i}, field "${key}"`);
      }
    }
  }
  // Normalize all values to strings
  return parsed.map((row) => {
    const normalized: Row = {};
    for (const [key, val] of Object.entries(row as Record<string, unknown>)) {
      normalized[key] = val === null ? "" : String(val);
    }
    return normalized;
  });
}

/** Validate that required fields exist in the data */
export function validateFieldExists(rows: Row[], field: string): void {
  if (rows.length === 0) return;
  const firstRow = rows[0]!;
  if (!(field in firstRow)) {
    const available = Object.keys(firstRow).join(", ");
    throw new Error(
      `Field "${field}" not found. Available fields: ${available}`
    );
  }
}

/** Parse a string value to a finite number */
export function parseNumeric(value: string, fieldName: string, rowIndex: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    throw new Error(
      `Row ${rowIndex}, field "${fieldName}": "${value}" is not a valid number.`
    );
  }
  return n;
}
