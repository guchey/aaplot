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

/** Interpolate y value at dataX from sorted points */
function interpolateY(points: DataPoint[], dataX: number): number | null {
	for (let i = 1; i < points.length; i++) {
		const p0 = points[i - 1]!;
		const p1 = points[i]!;
		if (dataX >= p0.x && dataX <= p1.x) {
			const t = p1.x === p0.x ? 0 : (dataX - p0.x) / (p1.x - p0.x);
			return p0.y + t * (p1.y - p0.y);
		}
	}
	return null;
}

export function renderArea(
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

	// For each subpixel column, interpolate y and fill below
	for (let px = 0; px < buf.pixWidth; px++) {
		const dataX =
			xScale.range === 0
				? xScale.min
				: xScale.min + (px / (buf.pixWidth - 1)) * xScale.range;

		const y = interpolateY(points, dataX);
		if (y === null) continue;

		const py = buf.mapY(y, yScale.min, yScale.range);
		buf.fillDown(px, py, buf.pixHeight - 1);
	}

	// Draw line on top with a separate buffer for crispness
	const lineBuf = new BrailleBuffer(area);
	for (let i = 1; i < points.length; i++) {
		const prev = points[i - 1]!;
		const curr = points[i]!;
		lineBuf.line(
			lineBuf.mapX(prev.x, xScale.min, xScale.range),
			lineBuf.mapY(prev.y, yScale.min, yScale.range),
			lineBuf.mapX(curr.x, xScale.min, xScale.range),
			lineBuf.mapY(curr.y, yScale.min, yScale.range),
		);
	}

	buf.render(canvas, area, nc ? "" : palette.fill);
	lineBuf.render(canvas, area, nc ? "" : palette.line);

	return canvas.render(nc);
}

export function renderMultiArea(
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

	for (let si = 0; si < series.length; si++) {
		const s = series[si]!;
		const color = nc ? "" : getSeriesColor(palette, si);
		const buf = new BrailleBuffer(area);

		for (let px = 0; px < buf.pixWidth; px++) {
			const dataX =
				xScale.range === 0
					? xScale.min
					: xScale.min + (px / (buf.pixWidth - 1)) * xScale.range;

			const y = interpolateY(s.points, dataX);
			if (y === null) continue;

			const py = buf.mapY(y, yScale.min, yScale.range);
			buf.fillDown(px, py, buf.pixHeight - 1);
		}

		buf.render(canvas, area, color);
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
