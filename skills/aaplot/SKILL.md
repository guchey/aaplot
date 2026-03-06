---
name: aaplot
description: Renders terminal charts (bar, stacked bar, line, area, scatter, histogram, count, boxplot, density, heatmap, sparkline) from JSON data. Use when the user needs to visualize data in the terminal, create charts from BigQuery output, plot CSV/JSON data, or generate quick data visualizations without leaving the command line.
allowed-tools: Bash(aaplot:*)
---

# Terminal Charts with aaplot

## Quick start

```bash
# Bar chart
echo '[{"category":"A","count":"10"},{"category":"B","count":"25"}]' | aaplot bar --x category --y count

# Stacked bar chart
echo '[{"month":"Jan","sales":"10","product":"A"},{"month":"Jan","sales":"15","product":"B"}]' | aaplot bar --x month --y sales --group product --stacked

# 100% stacked bar
echo '[{"month":"Jan","sales":"10","product":"A"},{"month":"Jan","sales":"15","product":"B"}]' | aaplot bar --x month --y sales --group product --percent

# Line chart
echo '[{"date":"2024-01","value":"10"},{"date":"2024-02","value":"25"}]' | aaplot line --x date --y value

# Scatter plot (braille characters)
echo '[{"x":"1.5","y":"10"},{"x":"3.2","y":"22"}]' | aaplot scatter --x x --y y

# Histogram
echo '[{"score":"72"},{"score":"85"},{"score":"91"}]' | aaplot histogram --x score

# Area chart
echo '[{"date":"2024-01","value":"10"},{"date":"2024-02","value":"25"}]' | aaplot area --x date --y value

# Count (auto-aggregate occurrences)
echo '[{"status":"active"},{"status":"pending"},{"status":"active"}]' | aaplot count --x status

# Boxplot (box-and-whisker)
echo '[{"score":"72"},{"score":"85"},{"score":"91"},{"score":"68"}]' | aaplot boxplot --x score

# Density plot (KDE smoothed distribution)
echo '[{"latency":"12.5"},{"latency":"15.3"},{"latency":"11.8"}]' | aaplot density --x latency

# Heatmap
echo '[{"day":"Mon","hour":"9","count":"42"},{"day":"Mon","hour":"10","count":"65"}]' | aaplot heatmap --x hour --y day --value count

# Sparkline (compact single-line)
echo '[{"value":"10"},{"value":"25"},{"value":"15"},{"value":"30"}]' | aaplot sparkline --x value

# Multi-series sparkline
echo '[{"value":"10","metric":"cpu"},{"value":"30","metric":"cpu"},{"value":"50","metric":"mem"}]' | aaplot sparkline --x value --group metric
```

## Commands

### Bar chart

```bash
aaplot bar --x <field> --y <field> [--group <field>] [--stacked] [--percent] [options]
```

Renders a vertical bar chart using Unicode block elements for 1/8 character precision. With `--group`, shows grouped bars side-by-side. Add `--stacked` to stack series, or `--percent` for 100% normalized stacking.

### Line chart

```bash
aaplot line --x <field> --y <field> [options]
```

Renders a line chart using Braille characters at 2×4 subpixel resolution.

### Area chart

```bash
aaplot area --x <field> --y <field> [options]
```

Renders an area chart with filled region below the line using Braille characters.

### Scatter plot

```bash
aaplot scatter --x <field> --y <field> [options]
```

Renders a scatter plot using braille characters (U+2800-U+28FF) for 2x4 pixel resolution per cell.

### Histogram

```bash
aaplot histogram --x <field> [--bins <n>] [options]
```

Renders a histogram with automatic binning (Sturges' rule) or manual bin count.

### Count

```bash
aaplot count --x <field> [options]
```

Counts occurrences of each unique value and renders as a bar chart. No pre-aggregation needed — pipe raw query results directly.

### Boxplot

```bash
aaplot boxplot --x <field> [--group <field>] [options]
```

Horizontal box-and-whisker plot showing min, Q1, median, Q3, and max. Use `--group` to compare distributions across categories.

### Density

```bash
aaplot density --x <field> [--group <field>] [options]
```

Kernel Density Estimation (KDE) with Gaussian kernel and Silverman's bandwidth. Smoothed alternative to histogram. Use `--group` to overlay multiple distributions.

### Heatmap

```bash
aaplot heatmap --x <field> --y <field> --value <field> [options]
```

Grid visualization with `░▒▓█` shade levels and color ramp (blue→red). `--x` is the column field, `--y` is the row field, `--value` is the numeric intensity.

### Sparkline

```bash
aaplot sparkline --x <field> [--group <field>] [options]
```

Compact single-line chart using block elements (`▁▂▃▄▅▆▇█`). Shows min..max range. Use `--group` to display multiple sparklines (one per series).

## Common options

```bash
--width <n>          # Canvas width override
--height <n>         # Canvas height override
--theme <t>          # Color theme: dark|light|auto (default: auto)
--title <t>          # Chart title
--json <data>        # Inline JSON data (alternative to stdin)
--dry-run            # Validate input without rendering
--color              # Force color output (even without TTY)
--group <field>      # Group by field for multi-series (bar, line, area, scatter, boxplot, density, sparkline)
```

## Input format

aaplot accepts JSON array or NDJSON (newline-delimited JSON) via stdin or `--json` flag. All values are strings (BigQuery format).

```bash
# Pipe from BigQuery
bq query --format=json "SELECT date, count FROM dataset.table" | aaplot line --x date --y count

# Inline JSON
aaplot bar --x name --y value --json '[{"name":"A","value":"10"},{"name":"B","value":"20"}]'

# NDJSON
echo '{"x":"1","y":"2"}
{"x":"3","y":"4"}' | aaplot scatter --x x --y y
```

## Multi-series

Use `--group <field>` to split data by a field for multi-series charts. Each series gets a distinct color with a legend.

```bash
echo '[{"date":"Jan","sales":"10","region":"East"},{"date":"Jan","sales":"15","region":"West"}]' | aaplot line --x date --y sales --group region
```

## Agent introspection

```bash
# Get schema for all commands
aaplot schema

# Get schema for a specific command
aaplot schema bar
```

## Validation-only mode

```bash
aaplot bar --x category --y count --json '[...]' --dry-run
# Returns JSON: {"ok":true,"rows":2,"x_type":"categorical","y_range":[10,25]}
```
