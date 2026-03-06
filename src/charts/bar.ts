import {
	computePlotArea,
	computeScale,
	drawAxes,
	drawLegend,
	drawTitle,
} from "../renderer/axis.ts";
import { Canvas, getTerminalSize } from "../renderer/canvas.ts";
import {
	getSeriesColor,
	isNoColor,
	resolvePalette,
} from "../renderer/color.ts";
import type { CommonOptions, DataPoint, Series } from "./types.ts";

const BLOCKS = [" ", "▁", "▂", "▃", "▄", "▅", "▆", "▇", "█"] as const;

export function renderBar(
	points: DataPoint[],
	xLabels: string[] | null,
	opts: CommonOptions,
): string {
	const palette = resolvePalette(opts.theme);
	const nc = isNoColor();
	const term = getTerminalSize(opts.width, opts.height);
	const canvas = new Canvas(term.width, term.height - 1);

	const area = computePlotArea(canvas.width, canvas.height, !!opts.title);
	const yValues = points.map((p) => p.y);
	const yMin = Math.min(0, ...yValues);
	const yMax = Math.max(...yValues);
	const yScale = computeScale(yMin, yMax);

	const labels = xLabels ?? points.map((p) => p.label ?? p.x.toString());

	drawAxes(canvas, area, null, yScale, labels, palette, nc);
	drawTitle(canvas, opts.title, palette, nc);

	const barCount = points.length;
	const slotWidth = Math.max(1, Math.floor(area.width / barCount));
	const barColor = nc ? "" : palette.bar;

	points.forEach((point, i) => {
		const xStart = area.left + i * slotWidth;
		const barWidth = Math.max(1, slotWidth - 1);

		if (yScale.range === 0) return;
		const valueFraction = (point.y - yScale.min) / yScale.range;
		const totalPixels = Math.round(valueFraction * area.height * 8);
		const fullChars = Math.floor(totalPixels / 8);
		const remainder = totalPixels % 8;

		for (let row = 0; row < fullChars; row++) {
			const y = area.top + area.height - 1 - row;
			for (let col = 0; col < barWidth; col++) {
				canvas.set(xStart + col, y, "█", barColor);
			}
		}

		if (remainder > 0) {
			const y = area.top + area.height - 1 - fullChars;
			const partialChar = BLOCKS[remainder]!;
			for (let col = 0; col < barWidth; col++) {
				canvas.set(xStart + col, y, partialChar, barColor);
			}
		}
	});

	return canvas.render(nc);
}

export function renderGroupedBar(
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
	const yValues = allPoints.map((p) => p.y);
	const yMin = Math.min(0, ...yValues);
	const yMax = Math.max(...yValues);
	const yScale = computeScale(yMin, yMax);

	// Determine category count from xLabels or first series
	const categoryCount = xLabels
		? xLabels.length
		: Math.max(...series.map((s) => s.points.length));
	const labels =
		xLabels ?? Array.from({ length: categoryCount }, (_, i) => i.toString());

	drawAxes(canvas, area, null, yScale, labels, palette, nc);
	drawTitle(canvas, opts.title, palette, nc);

	const seriesCount = series.length;
	const slotWidth = Math.max(1, Math.floor(area.width / categoryCount));
	const subBarWidth = Math.max(1, Math.floor((slotWidth - 1) / seriesCount));

	for (let si = 0; si < seriesCount; si++) {
		const s = series[si]!;
		const barColor = nc ? "" : getSeriesColor(palette, si);

		for (const point of s.points) {
			const catIndex = point.x;
			const xStart = area.left + catIndex * slotWidth + si * subBarWidth;

			if (yScale.range === 0) continue;
			const valueFraction = (point.y - yScale.min) / yScale.range;
			const totalPixels = Math.round(valueFraction * area.height * 8);
			const fullChars = Math.floor(totalPixels / 8);
			const remainder = totalPixels % 8;

			for (let row = 0; row < fullChars; row++) {
				const y = area.top + area.height - 1 - row;
				for (let col = 0; col < subBarWidth; col++) {
					canvas.set(xStart + col, y, "█", barColor);
				}
			}

			if (remainder > 0) {
				const y = area.top + area.height - 1 - fullChars;
				const partialChar = BLOCKS[remainder]!;
				for (let col = 0; col < subBarWidth; col++) {
					canvas.set(xStart + col, y, partialChar, barColor);
				}
			}
		}
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
