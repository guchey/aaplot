import {
	computePlotArea,
	computeScale,
	drawLegend,
	drawTitle,
} from "../renderer/axis.ts";
import { Canvas, getTerminalSize } from "../renderer/canvas.ts";
import {
	getSeriesColor,
	isNoColor,
	resolvePalette,
} from "../renderer/color.ts";
import type { CommonOptions } from "./types.ts";

interface BoxStats {
	label: string;
	min: number;
	q1: number;
	median: number;
	q3: number;
	max: number;
}

function quantile(sorted: number[], q: number): number {
	const pos = (sorted.length - 1) * q;
	const lo = Math.floor(pos);
	const hi = Math.ceil(pos);
	if (lo === hi) return sorted[lo]!;
	return sorted[lo]! + (sorted[hi]! - sorted[lo]!) * (pos - lo);
}

function computeBoxStats(values: number[], label: string): BoxStats {
	const sorted = [...values].sort((a, b) => a - b);
	return {
		label,
		min: sorted[0]!,
		q1: quantile(sorted, 0.25),
		median: quantile(sorted, 0.5),
		q3: quantile(sorted, 0.75),
		max: sorted[sorted.length - 1]!,
	};
}

/** Render a single boxplot (horizontal) */
export function renderBoxplot(
	values: number[],
	field: string,
	opts: Omit<CommonOptions, "y">,
): string {
	const stats = computeBoxStats(values, field);
	return renderBoxes([stats], opts);
}

/** Render grouped boxplots (one per category) */
export function renderGroupedBoxplot(
	groups: { key: string; values: number[] }[],
	opts: Omit<CommonOptions, "y">,
): string {
	const boxes = groups.map((g) => computeBoxStats(g.values, g.key));
	return renderBoxes(boxes, opts);
}

function renderBoxes(
	boxes: BoxStats[],
	opts: Omit<CommonOptions, "y">,
): string {
	const palette = resolvePalette(opts.theme);
	const nc = isNoColor();
	const term = getTerminalSize(opts.width, opts.height);
	const canvas = new Canvas(term.width, term.height - 1);

	const hasMultiple = boxes.length > 1;
	const area = computePlotArea(
		canvas.width,
		canvas.height - (hasMultiple ? 1 : 0),
		!!opts.title,
	);

	// X scale covers the data range of all boxes
	const globalMin = Math.min(...boxes.map((b) => b.min));
	const globalMax = Math.max(...boxes.map((b) => b.max));
	const xScale = computeScale(globalMin, globalMax);

	// Y axis: category labels
	const _yLabels = boxes.map((b) => b.label);

	// Draw axes: x-axis with numeric ticks at bottom, y-axis with category labels
	const axisColor = nc ? "" : palette.axis;

	// Y axis line
	canvas.vLine(area.left - 1, area.top, area.height, "│", axisColor);
	// X axis line
	canvas.hLine(
		area.left - 1,
		area.top + area.height,
		area.width + 1,
		"─",
		axisColor,
	);
	canvas.set(area.left - 1, area.top + area.height, "└", axisColor);

	// X tick labels (numeric)
	for (const tick of xScale.ticks) {
		if (xScale.range === 0) continue;
		const xPos =
			area.left +
			Math.round(((tick - xScale.min) / xScale.range) * (area.width - 1));
		const label = formatTick(tick);
		const startX = xPos - Math.floor(label.length / 2);
		canvas.text(startX, area.top + area.height + 1, label, axisColor);
	}

	// Draw each box
	const slotHeight = Math.max(1, Math.floor(area.height / boxes.length));

	for (let bi = 0; bi < boxes.length; bi++) {
		const box = boxes[bi]!;
		const color = nc
			? ""
			: boxes.length > 1
				? getSeriesColor(palette, bi)
				: palette.bar;
		const centerY = area.top + bi * slotHeight + Math.floor(slotHeight / 2);

		// Y label
		const yLabel = box.label.slice(0, 7).padStart(7);
		canvas.text(0, centerY, yLabel, axisColor);

		if (xScale.range === 0) continue;

		const toX = (v: number) =>
			area.left +
			Math.round(((v - xScale.min) / xScale.range) * (area.width - 1));

		const xMin = toX(box.min);
		const xQ1 = toX(box.q1);
		const xMed = toX(box.median);
		const xQ3 = toX(box.q3);
		const xMax = toX(box.max);

		// Whisker: min to Q1
		for (let x = xMin + 1; x < xQ1; x++) {
			canvas.set(x, centerY, "─", color);
		}
		canvas.set(xMin, centerY, "├", color);

		// Box: Q1 to Q3
		canvas.set(xQ1, centerY, "┤", color);
		for (let x = xQ1 + 1; x < xQ3; x++) {
			if (x === xMed) {
				canvas.set(x, centerY, "│", color);
			} else {
				canvas.set(x, centerY, "━", color);
			}
		}
		canvas.set(xQ3, centerY, "├", color);

		// Top and bottom of box (if space allows)
		if (slotHeight >= 3) {
			const topY = centerY - 1;
			const botY = centerY + 1;
			for (let x = xQ1; x <= xQ3; x++) {
				if (x === xQ1) {
					canvas.set(x, topY, "┌", color);
					canvas.set(x, botY, "└", color);
				} else if (x === xQ3) {
					canvas.set(x, topY, "┐", color);
					canvas.set(x, botY, "┘", color);
				} else {
					canvas.set(x, topY, "─", color);
					canvas.set(x, botY, "─", color);
				}
			}
		}

		// Whisker: Q3 to max
		for (let x = xQ3 + 1; x < xMax; x++) {
			canvas.set(x, centerY, "─", color);
		}
		canvas.set(xMax, centerY, "┤", color);
	}

	drawTitle(canvas, opts.title, palette, nc);

	// Legend for multi-box
	if (hasMultiple) {
		const legendRow = canvas.height - 1;
		const seriesColors = boxes.map((_, i) => getSeriesColor(palette, i));
		drawLegend(
			canvas,
			boxes.map((b) => b.label),
			seriesColors,
			nc,
			legendRow,
		);
	}

	return canvas.render(nc);
}

function formatTick(value: number): string {
	if (Number.isInteger(value)) return value.toString();
	return parseFloat(value.toPrecision(3)).toString();
}
