#!/usr/bin/env bun

import { Command } from "commander";
import { readInput, extractXY, extractColumn, extractStringColumn, groupRows, groupByField } from "./parser/json.ts";
import { renderBar, renderGroupedBar } from "./charts/bar.ts";
import { renderLine, renderMultiLine } from "./charts/line.ts";
import { renderArea, renderMultiArea } from "./charts/area.ts";
import { renderScatter, renderMultiScatter } from "./charts/scatter.ts";
import { renderHistogram } from "./charts/histogram.ts";
import { renderCount } from "./charts/count.ts";
import { renderBoxplot, renderGroupedBoxplot } from "./charts/boxplot.ts";
import { renderDensity, renderMultiDensity } from "./charts/density.ts";
import { getSchema, getAllSchemas } from "./schema.ts";
import { installSkills } from "./skills.ts";
import type { CommonOptions, HistogramOptions } from "./charts/types.ts";

const program = new Command();

program
  .name("aaplot")
  .description("Render terminal charts from BigQuery JSON (stdin or --json)")
  .version("0.1.0");

function resolveTheme(t: string): "dark" | "light" | "auto" {
  if (t === "dark" || t === "light" || t === "auto") return t;
  process.stderr.write(`Warning: unknown theme "${t}", using "auto"\n`);
  return "auto";
}

function addCommonOptions(cmd: Command): Command {
  return cmd
    .option("--width <n>", "canvas width override", parseInt)
    .option("--height <n>", "canvas height override", parseInt)
    .option("--theme <t>", "color theme: dark|light|auto", "auto")
    .option("--title <t>", "chart title")
    .option("--json <data>", "inline JSON data (alternative to stdin)")
    .option("--dry-run", "validate input without rendering")
    .option("--color", "force color output (even without TTY)")
    .hook("preAction", (thisCommand) => {
      if (thisCommand.opts().color) {
        process.env["FORCE_COLOR"] = "1";
      }
    });
}

function addGroupOption(cmd: Command): Command {
  return cmd.option("--group <field>", "group by field for multi-series");
}

function output(chart: string): void {
  process.stdout.write(chart + "\n");
}

function buildCommonOpts(opts: Record<string, unknown>): CommonOptions {
  return {
    x: opts.x as string,
    y: opts.y as string,
    theme: resolveTheme(opts.theme as string),
    title: opts.title as string | undefined,
    width: opts.width as number | undefined,
    height: opts.height as number | undefined,
    group: opts.group as string | undefined,
  };
}

async function handleDryRun(
  opts: { json?: string; dryRun?: boolean; x: string; y?: string; group?: string },
  mode: "xy" | "column"
): Promise<boolean> {
  if (!opts.dryRun) return false;

  const rows = await readInput(opts.json);
  if (mode === "xy" && opts.y) {
    if (opts.group) {
      const { series, xLabels } = groupRows(rows, opts.x, opts.y, opts.group);
      const allY = series.flatMap((s) => s.points.map((p) => p.y));
      process.stdout.write(
        JSON.stringify({
          ok: true,
          rows: rows.length,
          groups: series.length,
          group_keys: series.map((s) => s.key),
          x_type: xLabels ? "categorical" : "numeric",
          y_range: [Math.min(...allY), Math.max(...allY)],
        }) + "\n"
      );
    } else {
      const { points, xLabels } = extractXY(rows, opts.x, opts.y);
      const yValues = points.map((p) => p.y);
      process.stdout.write(
        JSON.stringify({
          ok: true,
          rows: rows.length,
          x_type: xLabels ? "categorical" : "numeric",
          y_range: [Math.min(...yValues), Math.max(...yValues)],
        }) + "\n"
      );
    }
  } else {
    const values = extractColumn(rows, opts.x);
    process.stdout.write(
      JSON.stringify({
        ok: true,
        rows: rows.length,
        x_type: "numeric",
        range: [Math.min(...values), Math.max(...values)],
      }) + "\n"
    );
  }
  return true;
}

// ── install ───────────────────────────────────────────────────────────────────
program
  .command("install")
  .description("Install aaplot integrations")
  .option("--skills", "Install Claude Code skills into .claude/skills/aaplot/")
  .action(async (opts) => {
    if (opts.skills) {
      await installSkills();
    } else {
      process.stderr.write("Usage: aaplot install --skills\n");
      process.exit(1);
    }
  });

// ── schema ────────────────────────────────────────────────────────────────────
program
  .command("schema [command]")
  .description("Show command schema (for agent introspection)")
  .action((command?: string) => {
    if (command) {
      process.stdout.write(getSchema(command) + "\n");
    } else {
      process.stdout.write(getAllSchemas() + "\n");
    }
  });

// ── bar ───────────────────────────────────────────────────────────────────────
addGroupOption(
  addCommonOptions(
    program
      .command("bar")
      .description("Bar chart")
      .requiredOption("--x <field>", "X axis field (categorical)")
      .requiredOption("--y <field>", "Y axis field (numeric)")
  )
).action(async (opts) => {
  try {
    if (await handleDryRun(opts, "xy")) return;
    const rows = await readInput(opts.json);
    const copts = buildCommonOpts(opts);
    if (opts.group) {
      const { series, xLabels } = groupRows(rows, opts.x, opts.y, opts.group);
      output(renderGroupedBar(series, xLabels, copts));
    } else {
      const { points, xLabels } = extractXY(rows, opts.x, opts.y);
      output(renderBar(points, xLabels, copts));
    }
  } catch (e) {
    process.stderr.write(`aaplot error: ${(e as Error).message}\n`);
    process.exit(1);
  }
});

// ── line ──────────────────────────────────────────────────────────────────────
addGroupOption(
  addCommonOptions(
    program
      .command("line")
      .description("Line chart")
      .requiredOption("--x <field>", "X axis field")
      .requiredOption("--y <field>", "Y axis field (numeric)")
  )
).action(async (opts) => {
  try {
    if (await handleDryRun(opts, "xy")) return;
    const rows = await readInput(opts.json);
    const copts = buildCommonOpts(opts);
    if (opts.group) {
      const { series, xLabels } = groupRows(rows, opts.x, opts.y, opts.group);
      output(renderMultiLine(series, xLabels, copts));
    } else {
      const { points, xLabels } = extractXY(rows, opts.x, opts.y);
      output(renderLine(points, xLabels, copts));
    }
  } catch (e) {
    process.stderr.write(`aaplot error: ${(e as Error).message}\n`);
    process.exit(1);
  }
});

// ── area ──────────────────────────────────────────────────────────────────────
addGroupOption(
  addCommonOptions(
    program
      .command("area")
      .description("Area chart")
      .requiredOption("--x <field>", "X axis field")
      .requiredOption("--y <field>", "Y axis field (numeric)")
  )
).action(async (opts) => {
  try {
    if (await handleDryRun(opts, "xy")) return;
    const rows = await readInput(opts.json);
    const copts = buildCommonOpts(opts);
    if (opts.group) {
      const { series, xLabels } = groupRows(rows, opts.x, opts.y, opts.group);
      output(renderMultiArea(series, xLabels, copts));
    } else {
      const { points, xLabels } = extractXY(rows, opts.x, opts.y);
      output(renderArea(points, xLabels, copts));
    }
  } catch (e) {
    process.stderr.write(`aaplot error: ${(e as Error).message}\n`);
    process.exit(1);
  }
});

// ── scatter ───────────────────────────────────────────────────────────────────
addGroupOption(
  addCommonOptions(
    program
      .command("scatter")
      .description("Scatter plot (braille characters)")
      .requiredOption("--x <field>", "X axis field (numeric)")
      .requiredOption("--y <field>", "Y axis field (numeric)")
  )
).action(async (opts) => {
  try {
    if (await handleDryRun(opts, "xy")) return;
    const rows = await readInput(opts.json);
    const copts = buildCommonOpts(opts);
    if (opts.group) {
      const { series, xLabels } = groupRows(rows, opts.x, opts.y, opts.group);
      output(renderMultiScatter(series, xLabels, copts));
    } else {
      const { points, xLabels } = extractXY(rows, opts.x, opts.y);
      output(renderScatter(points, xLabels, copts));
    }
  } catch (e) {
    process.stderr.write(`aaplot error: ${(e as Error).message}\n`);
    process.exit(1);
  }
});

// ── histogram ─────────────────────────────────────────────────────────────────
addCommonOptions(
  program
    .command("histogram")
    .description("Histogram with auto-binning")
    .requiredOption("--x <field>", "numeric field to bin")
    .option("--bins <n>", "number of bins (default: Sturges' rule)", parseInt)
).action(async (opts) => {
  try {
    if (await handleDryRun(opts, "column")) return;
    const rows = await readInput(opts.json);
    const values = extractColumn(rows, opts.x);
    const hopts: HistogramOptions = {
      x: opts.x, bins: opts.bins,
      theme: resolveTheme(opts.theme), title: opts.title,
      width: opts.width, height: opts.height,
    };
    output(renderHistogram(values, opts.x, hopts));
  } catch (e) {
    process.stderr.write(`aaplot error: ${(e as Error).message}\n`);
    process.exit(1);
  }
});

// ── count ────────────────────────────────────────────────────────────────────
addCommonOptions(
  program
    .command("count")
    .description("Count occurrences of each value and render as bar chart")
    .requiredOption("--x <field>", "field to count occurrences of")
).action(async (opts) => {
  try {
    if (opts.dryRun) {
      const rows = await readInput(opts.json);
      const values = extractStringColumn(rows, opts.x);
      const unique = new Set(values);
      process.stdout.write(
        JSON.stringify({
          ok: true,
          rows: rows.length,
          unique_values: unique.size,
        }) + "\n"
      );
      return;
    }
    const rows = await readInput(opts.json);
    const values = extractStringColumn(rows, opts.x);
    output(renderCount(values, opts.x, {
      x: opts.x,
      theme: resolveTheme(opts.theme),
      title: opts.title,
      width: opts.width,
      height: opts.height,
    }));
  } catch (e) {
    process.stderr.write(`aaplot error: ${(e as Error).message}\n`);
    process.exit(1);
  }
});

// ── boxplot ──────────────────────────────────────────────────────────────────
addGroupOption(
  addCommonOptions(
    program
      .command("boxplot")
      .description("Boxplot (horizontal box-and-whisker)")
      .requiredOption("--x <field>", "numeric field for values")
  )
).action(async (opts) => {
  try {
    if (opts.dryRun) {
      const rows = await readInput(opts.json);
      if (opts.group) {
        const groups = groupByField(rows, opts.x, opts.group);
        process.stdout.write(
          JSON.stringify({
            ok: true,
            rows: rows.length,
            groups: groups.length,
            group_keys: groups.map((g: { key: string }) => g.key),
          }) + "\n"
        );
      } else {
        const values = extractColumn(rows, opts.x);
        process.stdout.write(
          JSON.stringify({
            ok: true,
            rows: rows.length,
            range: [Math.min(...values), Math.max(...values)],
          }) + "\n"
        );
      }
      return;
    }
    const rows = await readInput(opts.json);
    const baseOpts = {
      x: opts.x,
      theme: resolveTheme(opts.theme),
      title: opts.title,
      width: opts.width,
      height: opts.height,
    };
    if (opts.group) {
      const groups = groupByField(rows, opts.x, opts.group);
      output(renderGroupedBoxplot(groups, baseOpts));
    } else {
      const values = extractColumn(rows, opts.x);
      output(renderBoxplot(values, opts.x, baseOpts));
    }
  } catch (e) {
    process.stderr.write(`aaplot error: ${(e as Error).message}\n`);
    process.exit(1);
  }
});

// ── density ──────────────────────────────────────────────────────────────────
addGroupOption(
  addCommonOptions(
    program
      .command("density")
      .description("Density plot (KDE smoothed distribution)")
      .requiredOption("--x <field>", "numeric field")
  )
).action(async (opts) => {
  try {
    if (opts.dryRun) {
      const rows = await readInput(opts.json);
      if (opts.group) {
        const groups = groupByField(rows, opts.x, opts.group);
        process.stdout.write(
          JSON.stringify({
            ok: true,
            rows: rows.length,
            groups: groups.length,
            group_keys: groups.map((g: { key: string }) => g.key),
          }) + "\n"
        );
      } else {
        const values = extractColumn(rows, opts.x);
        process.stdout.write(
          JSON.stringify({
            ok: true,
            rows: rows.length,
            range: [Math.min(...values), Math.max(...values)],
          }) + "\n"
        );
      }
      return;
    }
    const rows = await readInput(opts.json);
    const baseOpts = {
      x: opts.x,
      theme: resolveTheme(opts.theme),
      title: opts.title,
      width: opts.width,
      height: opts.height,
    };
    if (opts.group) {
      const groups = groupByField(rows, opts.x, opts.group);
      output(renderMultiDensity(groups, baseOpts));
    } else {
      const values = extractColumn(rows, opts.x);
      output(renderDensity(values, opts.x, baseOpts));
    }
  } catch (e) {
    process.stderr.write(`aaplot error: ${(e as Error).message}\n`);
    process.exit(1);
  }
});

program.parse(process.argv);
