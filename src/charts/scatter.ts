import {
	computePlotArea,
	computeScale,
	drawAxes,
	drawLegend,
	drawTitle,
} from "../renderer/axis.ts";
import { BrailleBuffer } from "../renderer/braille.ts";
import { Canvas, getTerminalSize } from "../renderer/canvas.ts";
import {
	getSeriesColor,
	isNoColor,
	resolvePalette,
} from "../renderer/color.ts";
import type { CommonOptions, DataPoint, Series } from "./types.ts";

export function renderScatter(
	points: DataPoint[],
	xLabels: string[] | null,
	opts: CommonOptions,
): string {
	const palette = resolvePalette(opts.theme);
	const nc = isNoColor();
	const term = getTerminalSize(opts.width, opts.height);
	const canvas = new Canvas(term.width, term.height - 1);

	const area = computePlotArea(canvas.width, canvas.height, !!opts.title);

	const xValues = points.map((p) => p.x);
	const yValues = points.map((p) => p.y);
	const xScale = computeScale(Math.min(...xValues), Math.max(...xValues));
	const yScale = computeScale(Math.min(...yValues), Math.max(...yValues));

	drawAxes(canvas, area, xLabels ? null : xScale, yScale, xLabels, palette, nc);
	drawTitle(canvas, opts.title, palette, nc);

	const buf = new BrailleBuffer(area);
	for (const point of points) {
		buf.set(
			buf.mapX(point.x, xScale.min, xScale.range),
			buf.mapY(point.y, yScale.min, yScale.range),
		);
	}
	buf.render(canvas, area, nc ? "" : palette.line);

	return canvas.render(nc);
}

export function renderMultiScatter(
	series: Series[],
	xLabels: string[] | null,
	opts: CommonOptions,
): string {
	const palette = resolvePalette(opts.theme);
	const nc = isNoColor();
	const term = getTerminalSize(opts.width, opts.height);
	const canvas = new Canvas(term.width, term.height - 1);

	const legendRow = canvas.height - 1;
	const area = computePlotArea(canvas.width, canvas.height - 1, !!opts.title);

	const allPoints = series.flatMap((s) => s.points);
	const xValues = allPoints.map((p) => p.x);
	const yValues = allPoints.map((p) => p.y);
	const xScale = computeScale(Math.min(...xValues), Math.max(...xValues));
	const yScale = computeScale(Math.min(...yValues), Math.max(...yValues));

	drawAxes(canvas, area, xLabels ? null : xScale, yScale, xLabels, palette, nc);
	drawTitle(canvas, opts.title, palette, nc);

	// Each series gets its own buffer so colors don't merge
	for (let si = 0; si < series.length; si++) {
		const s = series[si]!;
		const buf = new BrailleBuffer(area);
		for (const point of s.points) {
			buf.set(
				buf.mapX(point.x, xScale.min, xScale.range),
				buf.mapY(point.y, yScale.min, yScale.range),
			);
		}
		buf.render(canvas, area, nc ? "" : getSeriesColor(palette, si));
	}

	const seriesColors = series.map((_, i) => getSeriesColor(palette, i));
	drawLegend(
		canvas,
		series.map((s) => s.key),
		seriesColors,
		nc,
		legendRow,
	);

	return canvas.render(nc);
}
