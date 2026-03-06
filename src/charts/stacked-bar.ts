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
import type { CommonOptions, Series } from "./types.ts";

const BLOCKS = [" ", "▁", "▂", "▃", "▄", "▅", "▆", "▇", "█"] as const;

export function renderStackedBar(
	series: Series[],
	xLabels: string[] | null,
	opts: CommonOptions & { percent?: boolean },
): string {
	const palette = resolvePalette(opts.theme);
	const nc = isNoColor();
	const term = getTerminalSize(opts.width, opts.height);
	const canvas = new Canvas(term.width, term.height - 1);

	const legendRow = canvas.height - 1;
	const area = computePlotArea(canvas.width, canvas.height - 1, !!opts.title);

	// Determine categories
	const categoryCount = xLabels
		? xLabels.length
		: Math.max(...series.map((s) => s.points.length));
	const labels =
		xLabels ?? Array.from({ length: categoryCount }, (_, i) => i.toString());

	// Compute stacked totals per category
	const totals = new Array<number>(categoryCount).fill(0);
	for (const s of series) {
		for (const p of s.points) {
			totals[p.x] = (totals[p.x] ?? 0) + p.y;
		}
	}

	const isPercent = opts.percent === true;
	const yMax = isPercent ? 100 : Math.max(...totals);
	const yScale = computeScale(0, yMax);

	drawAxes(canvas, area, null, yScale, labels, palette, nc);
	drawTitle(canvas, opts.title, palette, nc);

	const slotWidth = Math.max(1, Math.floor(area.width / categoryCount));
	const barWidth = Math.max(1, slotWidth - 1);

	// Draw bars stacked bottom-up
	// Track cumulative pixel height per category
	const cumulativePixels = new Array<number>(categoryCount).fill(0);

	for (let si = 0; si < series.length; si++) {
		const s = series[si]!;
		const barColor = nc ? "" : getSeriesColor(palette, si);

		for (const point of s.points) {
			const catIdx = point.x;
			if (catIdx < 0 || catIdx >= categoryCount) continue;

			const catTotal = totals[catIdx]!;
			const value =
				isPercent && catTotal > 0 ? (point.y / catTotal) * 100 : point.y;

			if (yScale.range === 0) continue;

			const valueFraction = value / yScale.range;
			const segmentPixels = Math.round(valueFraction * area.height * 8);
			const basePixels = cumulativePixels[catIdx]!;
			const topPixels = basePixels + segmentPixels;

			const xStart = area.left + catIdx * slotWidth;

			// Draw from basePixels to topPixels
			const baseFullChars = Math.floor(basePixels / 8);
			const topFullChars = Math.floor(topPixels / 8);
			const topRemainder = topPixels % 8;

			for (let row = baseFullChars; row < topFullChars; row++) {
				const y = area.top + area.height - 1 - row;
				for (let col = 0; col < barWidth; col++) {
					canvas.set(xStart + col, y, "█", barColor);
				}
			}

			if (topRemainder > 0) {
				const y = area.top + area.height - 1 - topFullChars;
				// If base is in the same char row, use partial
				const baseRemInThisRow =
					baseFullChars === topFullChars ? basePixels % 8 : 0;
				const visibleParts = topRemainder - baseRemInThisRow;
				if (visibleParts > 0) {
					const partialChar = BLOCKS[topRemainder]!;
					for (let col = 0; col < barWidth; col++) {
						canvas.set(xStart + col, y, partialChar, barColor);
					}
				}
			}

			cumulativePixels[catIdx] = topPixels;
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
