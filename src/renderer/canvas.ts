import type { Cell, TerminalSize } from "../charts/types.ts";

export function getTerminalSize(overrideW?: number, overrideH?: number): TerminalSize {
  const width = overrideW ?? process.stderr.columns ?? process.stdout.columns ?? 80;
  const height = overrideH ?? process.stderr.rows ?? process.stdout.rows ?? 24;
  return { width, height };
}

export class Canvas {
  readonly width: number;
  readonly height: number;
  private cells: Cell[][];

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.cells = Array.from({ length: height }, () =>
      Array.from({ length: width }, (): Cell => ({ char: " ", ansi: "" }))
    );
  }

  set(x: number, y: number, char: string, ansi = ""): void {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;
    this.cells[y]![x] = { char, ansi };
  }

  get(x: number, y: number): Cell | undefined {
    return this.cells[y]?.[x];
  }

  hLine(x: number, y: number, length: number, char: string, ansi = ""): void {
    for (let i = 0; i < length; i++) this.set(x + i, y, char, ansi);
  }

  vLine(x: number, y: number, length: number, char: string, ansi = ""): void {
    for (let i = 0; i < length; i++) this.set(x, y + i, char, ansi);
  }

  /** Write a string horizontally starting at (x, y) */
  text(x: number, y: number, str: string, ansi = ""): void {
    for (let i = 0; i < str.length; i++) {
      this.set(x + i, y, str[i]!, ansi);
    }
  }

  render(noColor = false): string {
    const lines: string[] = [];
    for (const row of this.cells) {
      let line = "";
      let currentAnsi = "";
      for (const cell of row) {
        if (!noColor && cell.ansi !== currentAnsi) {
          if (currentAnsi) line += "\x1b[0m";
          if (cell.ansi) line += cell.ansi;
          currentAnsi = cell.ansi;
        }
        line += cell.char;
      }
      if (!noColor && currentAnsi) line += "\x1b[0m";
      lines.push(line);
    }
    return lines.join("\n");
  }
}
