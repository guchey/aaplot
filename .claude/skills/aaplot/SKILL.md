---
name: aaplot
description: Renders terminal charts (bar, line, area, scatter, histogram) from JSON data. Use when the user needs to visualize data in the terminal, create charts from BigQuery output, plot CSV/JSON data, or generate quick data visualizations without leaving the command line.
allowed-tools: Bash(aaplot:*)
---

# Terminal Charts with aaplot

## Quick start

```bash
# Bar chart
echo '[{"category":"A","count":"10"},{"category":"B","count":"25"}]' | aaplot bar --x category --y count

# Line chart
echo '[{"date":"2024-01","value":"10"},{"date":"2024-02","value":"25"}]' | aaplot line --x date --y value

# Scatter plot (braille characters)
echo '[{"x":"1.5","y":"10"},{"x":"3.2","y":"22"}]' | aaplot scatter --x x --y y

# Histogram
echo '[{"score":"72"},{"score":"85"},{"score":"91"}]' | aaplot histogram --x score

# Area chart
echo '[{"date":"2024-01","value":"10"},{"date":"2024-02","value":"25"}]' | aaplot area --x date --y value
```

## Commands

### Bar chart

```bash
aaplot bar --x <field> --y <field> [options]
```

Renders a vertical bar chart using Unicode block elements for 1/8 character precision.

### Line chart

```bash
aaplot line --x <field> --y <field> [options]
```

Renders a line chart using Bresenham's algorithm with markers.

### Area chart

```bash
aaplot area --x <field> --y <field> [options]
```

Renders an area chart with filled region below the line.

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

## Common options

```bash
--width <n>          # Canvas width override
--height <n>         # Canvas height override
--theme <t>          # Color theme: dark|light|auto (default: auto)
--title <t>          # Chart title
--json <data>        # Inline JSON data (alternative to stdin)
--dry-run            # Validate input without rendering
--color              # Force color output (even without TTY)
--group <field>      # Group by field for multi-series (bar, line, area, scatter)
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
