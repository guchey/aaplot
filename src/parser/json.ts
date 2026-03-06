import type { Row, DataPoint, Series } from "../charts/types.ts";
import { validateRows, validateFieldExists, parseNumeric } from "../validator.ts";

/** Read all of stdin as a string */
async function readAllStdin(): Promise<string> {
  const chunks: Uint8Array[] = [];
  for await (const chunk of Bun.stdin.stream()) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf-8").trim();
}

/** Parse input as JSON array or NDJSON (one JSON object per line) */
function parseJson(raw: string): unknown {
  // Try JSON array first
  if (raw.startsWith("[")) {
    return JSON.parse(raw);
  }

  // Try NDJSON (bq query --format=json outputs this format)
  const lines = raw.split("\n").filter((line) => line.trim() !== "");
  if (lines.length > 0) {
    return lines.map((line, i) => {
      try {
        return JSON.parse(line);
      } catch {
        throw new Error(`Failed to parse line ${i + 1} as JSON: ${line.slice(0, 80)}`);
      }
    });
  }

  throw new Error("Invalid JSON input. Expected a JSON array or NDJSON (one object per line).");
}

/** Read JSON input from stdin or --json flag */
export async function readInput(inlineJson?: string): Promise<Row[]> {
  let raw: string;

  if (inlineJson) {
    raw = inlineJson.trim();
  } else {
    raw = await readAllStdin();
    if (!raw) {
      throw new Error("No input received on stdin. Pipe bq query output or use --json flag.");
    }
  }

  const parsed = parseJson(raw);
  return validateRows(parsed);
}

/** Extract x/y pairs from rows. Auto-detects categorical x. */
export function extractXY(
  rows: Row[],
  xField: string,
  yField: string
): { points: DataPoint[]; xLabels: string[] | null } {
  validateFieldExists(rows, xField);
  validateFieldExists(rows, yField);

  const firstX = rows[0]![xField]!;
  const isCategorical = !Number.isFinite(Number(firstX));
  const xLabels: string[] | null = isCategorical ? [] : null;

  const points: DataPoint[] = rows.map((row, i) => {
    const xRaw = row[xField]!;
    const yRaw = row[yField]!;
    const y = parseNumeric(yRaw, yField, i);

    if (isCategorical) {
      xLabels!.push(xRaw);
      return { x: i, y, label: xRaw };
    }
    return { x: parseNumeric(xRaw, xField, i), y };
  });

  return { points, xLabels };
}

/** Split rows by group field and extract x/y for each series */
export function groupRows(
  rows: Row[],
  xField: string,
  yField: string,
  groupField: string
): { series: Series[]; xLabels: string[] | null } {
  validateFieldExists(rows, groupField);
  validateFieldExists(rows, xField);
  validateFieldExists(rows, yField);

  // Split rows by group key (preserve insertion order)
  const groups = new Map<string, Row[]>();
  for (const row of rows) {
    const key = row[groupField]!;
    let bucket = groups.get(key);
    if (!bucket) {
      bucket = [];
      groups.set(key, bucket);
    }
    bucket.push(row);
  }

  // Extract x/y for each group
  let sharedXLabels: string[] | null = null;
  const series: Series[] = [];

  for (const [key, groupRows] of groups) {
    const { points, xLabels } = extractXY(groupRows, xField, yField);
    if (sharedXLabels === null) {
      sharedXLabels = xLabels;
    }
    series.push({ key, points });
  }

  // For categorical x: build union of all x labels across series
  if (sharedXLabels !== null) {
    const allLabels: string[] = [];
    const seen = new Set<string>();
    for (const s of series) {
      for (const p of s.points) {
        const label = p.label ?? "";
        if (!seen.has(label)) {
          seen.add(label);
          allLabels.push(label);
        }
      }
    }
    // Re-index points to align with unified x labels
    for (const s of series) {
      for (const p of s.points) {
        p.x = allLabels.indexOf(p.label ?? "");
      }
    }
    sharedXLabels = allLabels;
  }

  return { series, xLabels: sharedXLabels };
}

/** Extract a single numeric column (for histogram) */
export function extractColumn(rows: Row[], field: string): number[] {
  validateFieldExists(rows, field);
  return rows.map((row, i) => parseNumeric(row[field]!, field, i));
}

/** Extract a single string column (for count) */
export function extractStringColumn(rows: Row[], field: string): string[] {
  validateFieldExists(rows, field);
  return rows.map((row) => row[field]!);
}

/** Group rows by a field and extract numeric values for each group (for boxplot/density) */
export function groupByField(
  rows: Row[],
  valueField: string,
  groupField: string
): { key: string; values: number[] }[] {
  validateFieldExists(rows, valueField);
  validateFieldExists(rows, groupField);

  const groups = new Map<string, number[]>();
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!;
    const key = row[groupField]!;
    const value = parseNumeric(row[valueField]!, valueField, i);
    let bucket = groups.get(key);
    if (!bucket) {
      bucket = [];
      groups.set(key, bucket);
    }
    bucket.push(value);
  }

  return [...groups.entries()].map(([key, values]) => ({ key, values }));
}
