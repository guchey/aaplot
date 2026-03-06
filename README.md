# aaplot (ASCII Art Plot)

[![CI](https://github.com/guchey/aaplot/actions/workflows/ci.yml/badge.svg)](https://github.com/guchey/aaplot/actions/workflows/ci.yml)

A CLI tool that renders terminal charts from BigQuery query results.

Pipe `bq query --format=json` output and visualize it with Unicode characters. Compiled into a single binary with Bun. Designed for both human and AI agent usage.

**11 chart types:** bar (+ stacked), line, area, scatter, histogram, count, boxplot, density, heatmap, sparkline

## Installation

```bash
# Build from source
bun install
bun run build

# Place the binary on your PATH
cp dist/aaplot /usr/local/bin/
```

## Usage

```bash
# Bar chart
bq query --format=json 'SELECT category, count FROM ...' | aaplot bar --x=category --y=count

# Line chart
bq query --format=json 'SELECT date, value FROM ...' | aaplot line --x=date --y=value

# Area chart
bq query --format=json 'SELECT date, value FROM ...' | aaplot area --x=date --y=value

# Scatter plot
bq query --format=json 'SELECT distance, fare FROM ...' | aaplot scatter --x=distance --y=fare

# Histogram
bq query --format=json 'SELECT score FROM ...' | aaplot histogram --x=score --bins=10

# Count (auto-aggregate occurrences)
bq query --format=json 'SELECT status FROM ...' | aaplot count --x=status

# Boxplot
bq query --format=json 'SELECT score FROM ...' | aaplot boxplot --x=score

# Density plot (KDE)
bq query --format=json 'SELECT latency FROM ...' | aaplot density --x=latency

# Heatmap
bq query --format=json 'SELECT day, hour, count FROM ...' | aaplot heatmap --x=hour --y=day --value=count

# Stacked bar
bq query --format=json 'SELECT month, product, sales FROM ...' \
  | aaplot bar --x=month --y=sales --group=product --stacked

# 100% stacked bar
bq query --format=json 'SELECT month, product, sales FROM ...' \
  | aaplot bar --x=month --y=sales --group=product --percent

# Sparkline (compact single-line)
bq query --format=json 'SELECT value FROM ...' | aaplot sparkline --x=value
```

### Multi-series with `--group`

```bash
bq query --format=json 'SELECT year, status, COUNT(*) AS count FROM ...' \
  | aaplot line --x=year --y=count --group=status
```

Available for `bar`, `line`, `area`, `scatter`, `boxplot`, and `density`. Each series is rendered in a different color with a legend at the bottom.

### Inline JSON

You can also pass data directly with the `--json` flag instead of stdin.

```bash
aaplot bar --x=name --y=count --json '[{"name":"A","count":"10"},{"name":"B","count":"25"}]'
```

## Charts

### Bar Chart (`bar`)

```
     30┤                              █████████
       │                              █████████
       │          ▁▁▁▁▁▁▁▁▁           █████████
       │          █████████           █████████
     20┤          █████████           █████████ ▃▃▃▃▃▃▃▃▃
       │          █████████           █████████ █████████
       │          █████████ ▄▄▄▄▄▄▄▄▄ █████████ █████████
       │          █████████ █████████ █████████ █████████
     10┤▅▅▅▅▅▅▅▅▅ █████████ █████████ █████████ █████████
       │█████████ █████████ █████████ █████████ █████████
       │█████████ █████████ █████████ █████████ █████████
      0┤█████████ █████████ █████████ █████████ █████████
       └───────────────────────────────────────────────────
        A            B           C            D           E
```

Rendered with block elements (`▁▂▃▄▅▆▇█`) at 1/8 character precision.

### Line Chart (`line`)

```
     40┤
       │                                ⢀⠴⢷
     30┤                ⢀⣄            ⡠⠒⠁  ⠱⡀
       │               ⢀⠜⠙⢄         ⡾⠋      ⠑⡄
       │     ⣠⡀       ⡠⠊  ⠈⢆      ⢀⠎         ⠈⢆
     20┤    ⢠⠋⠉⠢⢄    ⡔⠁     ⠣⡀   ⢠⠃           ⠈⢢⡀⣀⣀⠤⠤⠺
       │   ⡠⠃    ⠉⠢⣤⡎        ⠱⡀ ⡰⠁             ⠈⠋
     10┤  ⡰⠁       ⠈          ⠸⡾
       │ ⡜
       │⡾
      0┤
       └──────────────────────────────────────────────
        0          2           4          6          8
```

Lines rendered with Braille characters (2×4 subpixels per cell) via Bresenham's algorithm for smooth curves.

### Area Chart (`area`)

```
     30┤                           ⢀⠎⠒⢄⡀
       │                          ⡠⠃⣿⣿⣿⠈⠑⠤⡀
       │                 ⣀       ⡰⠁⣿⣿⣿⣿⣿⣿⣿⠈⢢
     20┤                ⡜⣿⠉⠒⠤⣀ ⢀⠜⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠑⢄
       │               ⡜⣿⣿⣿⣿⣿⣿⠉⠊⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠱⡀
       │              ⡜⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠈⠂
       │     ⡠⢄⡀     ⡜⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
     10┤  ⢀⡠⠊⣿⣿⠈⠑⠢⢄⡀⡜⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
       │⢀⠔⠁⣿⣿⣿⣿⣿⣿⣿⣿⠈⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
       │⠁⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
      0┤⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
       └──────────────────────────────────────────────
       Jan          Mar          May          Jul
```

Area filled and line drawn with Braille characters at subpixel resolution for smooth curves and dense fills.

### Scatter Plot (`scatter`)

```
     20┤                                       ⠈
       │                           ⠈
     15┤                     ⡀                    ⠐
       │                                 ⠐
       │               ⠂              ⢀
     10┤                                             ⠐
       │            ⠄           ⠈
      5┤      ⠁                             ⠠
       │                  ⠁
       │   ⠂     ⡀
      0┤
       └──────────────────────────────────────────────
        0              5             10             15
```

Uses Braille characters (U+2800–U+28FF) for high resolution at 2×4 subpixels per character cell.

### Histogram (`histogram`)

```
                     Histogram of score

      6┤                ███████         ███████
       │▃▃▃▃▃▃▃ ▃▃▃▃▃▃▃ ███████ ▃▃▃▃▃▃▃ ███████
       │███████ ███████ ███████ ███████ ███████
      4┤███████ ███████ ███████ ███████ ███████
       │███████ ███████ ███████ ███████ ███████
       │███████ ███████ ███████ ███████ ███████ ███████
      2┤███████ ███████ ███████ ███████ ███████ ███████
       │███████ ███████ ███████ ███████ ███████ ███████
       │███████ ███████ ███████ ███████ ███████ ███████
      0┤███████ ███████ ███████ ███████ ███████ ███████
       └───────────────────────────────────────────────
     12-25.8  25.8-39.  39.7-53.  53.5-67.  67.3-81.   81.2-
```

Auto-binning via Sturges' rule (`bins = ceil(log2(n) + 1)`). Override with `--bins`.

### Count (`count`)

```
                    Count of status

     15┤
       │
       │▅▅▅▅▅▅▅▅▅▅▅▅▅▅
     10┤██████████████
       │██████████████
      5┤██████████████
       │██████████████ ██████████████ ▃▃▃▃▃▃▃▃▃▃▃▃▃▃
       │██████████████ ██████████████ ██████████████
      0┤██████████████ ██████████████ ██████████████
       └──────────────────────────────────────────────
     active                 pending                erro
```

Automatically counts occurrences of each unique value and renders as a bar chart. No pre-aggregation needed — pipe raw query results directly.

### Boxplot (`boxplot`)

```
       │
       │
       │               ┌──────────────┐
  score│      ├────────┤━━━━━│━━━━━━━━├────────┤
       │               └──────────────┘
       │
       │
       └──────────────────────────────────────────────
       60         70          80         90         100
```

Horizontal box-and-whisker plot showing min, Q1, median, Q3, and max. Use `--group` to compare distributions across categories.

### Density (`density`)

```
   0.15┤            Density of val
       │                ⡠⠒⠢⢄
       │              ⡠⠊⣿⣿⣿⠈⢆
    0.1┤             ⡰⠁⣿⣿⣿⣿⣿⠈⢆
       │            ⡜⣿⣿⣿⣿⣿⣿⣿⣿⠈⢆
       │           ⡜⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠈⡆
       │         ⢀⠎⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠘⡄
   0.05┤        ⢀⠎⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠘⡄
       │       ⢠⠃⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠈⠢⡀
       │     ⢀⠔⠁⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠈⠢⣀      ⣀⣀⡀
      0┤⣀⣀⡠⠤⠒⠁⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠉⠒⠒⠒⠊⠉⣿⣿⠈⠉⠒⠤⠤⣀⣀⣀
       └──────────────────────────────────────────────
        0             10             20             30
```

Kernel Density Estimation (KDE) with Gaussian kernel and Silverman's bandwidth. Curve and fill rendered with Braille characters. Use `--group` to overlay multiple distributions.

### Heatmap (`heatmap`)

```
                Activity Heatmap

Mon            ░░░░░░░░░░░▒▒▒▒▒▒▒▒▒▒▒███████████
Tue            ▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░
Wed ▒▒▒▒▒▒▒▒▒▒▒                      ▓▓▓▓▓▓▓▓▓▓▓
Thu ▒▒▒▒▒▒▒▒▒▒▒███████████▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░
    9          10         11         12
    10     ░░░░▒▒▒▒▓▓▓▓████ 90
```

Grid visualization with `░▒▓█` shade levels and color ramp (blue→cyan→green→yellow→red). Requires `--x`, `--y`, and `--value` fields.

### Stacked Bar (`bar --stacked`)

```
                Monthly Sales (Stacked)

     60┤                              ▆▆▆▆▆▆▆▆▆▆▆▆▆▆
     40┤               ▅▅▅▅▅▅▅▅▅▅▅▅▅▅ ██████████████
       │▄▄▄▄▄▄▄▄▄▄▄▄▄▄ ██████████████ ██████████████
       │██████████████ ██████████████ ██████████████
     20┤██████████████ ██████████████ ██████████████
       │██████████████ ██████████████ ██████████████
      0┤██████████████ ██████████████ ██████████████
       └──────────────────────────────────────────────
       Jan                    Feb                   Mar
        ━━ A  ━━ B  ━━ C
```

Use `--stacked` with `--group` to stack series. Add `--percent` for 100% normalized stacked bars.

### Sparkline (`sparkline`)

```
Revenue ▁▂▁▅▄▇▆▃▇▂█▅ 5..35
```

Compact single-line chart using block elements (`▁▂▃▄▅▆▇█`). Perfect for inline dashboards. Use `--group` to show multiple series:

```
cpu ▁▃▅▇██ 10..90
mem ▁▂▄▅▇█ 40..65
```

## Options

| Option | Description |
|---|---|
| `--x <field>` | X axis field name |
| `--y <field>` | Y axis field name (required except for histogram, count, boxplot, density, sparkline; row field for heatmap) |
| `--width <n>` | Canvas width override (default: terminal width) |
| `--height <n>` | Canvas height override (default: terminal height) |
| `--theme <t>` | Color theme: `dark` / `light` / `auto` (default: `auto`) |
| `--title <t>` | Chart title |
| `--json <data>` | Inline JSON data (alternative to stdin) |
| `--group <field>` | Group by field for multi-series (bar, line, area, scatter, boxplot, density, sparkline) |
| `--color` | Force color output (for non-TTY environments) |
| `--dry-run` | Validate input only, skip rendering |
| `--bins <n>` | Number of bins (histogram only) |
| `--value <field>` | Numeric value field (heatmap only) |
| `--stacked` | Stack series instead of grouping side-by-side (bar only) |
| `--percent` | Normalize stacked bars to 100% (bar only) |

## AI Agent Features

### Schema Introspection

```bash
# Get command spec as JSON
aaplot schema bar

# List all commands
aaplot schema
```

### Dry-run

Validate data before rendering. Results are output to stdout as JSON.

```bash
echo '[{"name":"A","val":"10"}]' | aaplot bar --x=name --y=val --dry-run
# => {"ok":true,"rows":1,"x_type":"categorical","y_range":[10,10]}
```

### Input Hardening

- Control character detection and rejection
- Field existence checks (unknown fields produce an error with the list of available fields)
- Row-indexed error messages on numeric conversion failure

## Development

```bash
# Install dependencies
bun install

# Run tests
bun test

# Dev run
echo '[{"name":"A","val":"10"}]' | bun run src/index.ts bar --x=name --y=val
```

## Build

```bash
# Current platform
bun run build

# Cross-compile
bun run build:linux-x64
bun run build:darwin-arm64
bun run build:darwin-x64
```

## CI

GitHub Actions runs on push / PR to main:

1. **test** — `bun test` (195 tests)
2. **build** — Compile single binary and upload as artifact

## Tech Stack

- [Bun](https://bun.sh/) — Runtime + single-binary compiler
- [Commander.js](https://github.com/tj/commander.js/) — CLI framework
- Unicode block elements / Braille characters / Box Drawing — Zero-dependency terminal rendering
- ANSI 16-color — Dark / light theme support

## License

MIT
