# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun install              # install dependencies
bun test                 # run all tests (171 tests across 14 files)
bun test tests/parser.test.ts          # run a single test file
bun test --filter="groupRows"          # run tests matching a pattern
bun run build            # compile single binary → dist/aaplot
bun run dev              # run from source (equivalent to bun run src/index.ts)
```

Bun path: `~/.bun/bin/bun` (not on default PATH in some environments).

## Architecture

Bun single-binary CLI that pipes BigQuery JSON output (`bq query --format=json`) into terminal charts using Unicode characters. Only external dependency is commander.js.

### Data flow

```
stdin/--json → parser/json.ts → validator.ts → charts/*.ts → renderer/*.ts → stdout
```

1. **Parser** (`src/parser/json.ts`) — Reads stdin or `--json` flag. Auto-detects JSON array vs NDJSON (bq's default). Outputs `Row[]` (all values are strings). `extractXY` auto-detects categorical vs numeric x-axis. `groupRows` splits by a field for multi-series.

2. **Validator** (`src/validator.ts`) — Input hardening: control character rejection, field existence checks, numeric parsing.

3. **Charts** (`src/charts/*.ts`) — Pure functions: `(points, xLabels, opts) → string`. Each chart has a single-series and multi-series variant (e.g., `renderLine` / `renderMultiLine`). Histogram delegates to bar after binning.

4. **Renderer** (`src/renderer/`) — `canvas.ts` is a 2D character grid with ANSI code coalescing on render. `axis.ts` handles nice-number tick calculation and axis drawing. `color.ts` manages dark/light theme detection via COLORFGBG env, NO_COLOR/FORCE_COLOR support, and a 6-color series palette.

### Rendering techniques

- **Bar/Histogram/Count**: Block elements `▁▂▃▄▅▆▇█` at 1/8 character precision
- **Line**: Bresenham's algorithm with `─` segments and `●` markers
- **Area**: Column-by-column interpolation with `░` fill
- **Scatter**: Braille characters (U+2800–U+28FF) for 2×4 pixel resolution per cell
- **Boxplot**: Box-drawing characters (`┌┐└┘├┤─━│`) for horizontal box-and-whisker
- **Density**: Gaussian KDE with `●` curve markers and `░` fill

### Key design decisions

- All BigQuery values arrive as strings; numeric conversion happens in parser/validator
- Chart output goes to **stdout** (not stderr)
- `isNoColor()` checks `NO_COLOR` env, `FORCE_COLOR` env, and `stderr.isTTY`
- Multi-series: `--group <field>` option on bar/line/area/scatter/boxplot/density (not histogram/count). Each series gets a distinct color from the palette with a legend row at the bottom
- Agent-first features: `aaplot schema [command]` for JSON introspection, `--dry-run` for validation-only, `--json` for inline data
