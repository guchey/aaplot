import { drawTitle } from "../renderer/axis.ts";
import { Canvas, getTerminalSize } from "../renderer/canvas.ts";
import { isNoColor, resolvePalette } from "../renderer/color.ts";
import { parseNumeric, validateFieldExists } from "../validator.ts";
import type { Row } from "./types.ts";

const SHADES = [" ", "░", "▒", "▓", "█"] as const;

// Heat color ramp: blue → cyan → green → yellow → red
const HEAT_COLORS = [
	"\x1b[34m", // blue
	"\x1b[36m", // cyan
	"\x1b[32m", // green
	"\x1b[33m", // yellow
	"\x1b[31m", // red
] as const;

export interface HeatmapOptions {
	x: string;
	y: string;
	value: string;
	theme: "dark" | "light" | "auto";
	title?: string;
	width?: number;
	height?: number;
}

interface HeatmapData {
	xLabels: string[];
	yLabels: string[];
	grid: (number | null)[][];
	min: number;
	max: number;
}

function buildHeatmapData(
	rows: Row[],
	xField: string,
	yField: string,
	valueField: string,
): HeatmapData {
	validateFieldExists(rows, xField);
	validateFieldExists(rows, yField);
	validateFieldExists(rows, valueField);

	const xSet = new Map<string, number>();
	const ySet = new Map<string, number>();

	for (const row of rows) {
		const xKey = row[xField]!;
		const yKey = row[yField]!;
		if (!xSet.has(xKey)) xSet.set(xKey, xSet.size);
		if (!ySet.has(yKey)) ySet.set(yKey, ySet.size);
	}

	const xLabels = [...xSet.keys()];
	const yLabels = [...ySet.keys()];
	const grid: (number | null)[][] = Array.from({ length: yLabels.length }, () =>
		new Array(xLabels.length).fill(null),
	);

	let min = Infinity;
	let max = -Infinity;

	for (let i = 0; i < rows.length; i++) {
		const row = rows[i]!;
		const xi = xSet.get(row[xField]!)!;
		const yi = ySet.get(row[yField]!)!;
		const val = parseNumeric(row[valueField]!, valueField, i);
		grid[yi]![xi] = val;
		if (val < min) min = val;
		if (val > max) max = val;
	}

	if (min === Infinity) {
		min = 0;
		max = 0;
	}

	return { xLabels, yLabels, grid, min, max };
}

export function renderHeatmap(rows: Row[], opts: HeatmapOptions): string {
	const palette = resolvePalette(opts.theme);
	const nc = isNoColor();
	const term = getTerminalSize(opts.width, opts.height);

	const data = buildHeatmapData(rows, opts.x, opts.y, opts.value);

	const yLabelWidth = Math.min(
		10,
		Math.max(...data.yLabels.map((l) => l.length)) + 1,
	);
	const titleHeight = opts.title ? 2 : 0;
	const xLabelHeight = 2;
	const gridRows = data.yLabels.length;
	const gridCols = data.xLabels.length;

	const canvasHeight = titleHeight + gridRows + xLabelHeight;
	const cellWidth = Math.max(
		2,
		Math.floor((term.width - yLabelWidth - 1) / gridCols),
	);
	const canvasWidth = yLabelWidth + gridCols * cellWidth + 1;

	const canvas = new Canvas(
		Math.min(canvasWidth, term.width),
		Math.min(canvasHeight, term.height - 1),
	);

	drawTitle(canvas, opts.title, palette, nc);

	const axisColor = nc ? "" : palette.axis;

	// Draw grid
	for (let yi = 0; yi < gridRows; yi++) {
		const canvasY = titleHeight + yi;
		if (canvasY >= canvas.height - xLabelHeight) break;

		// Y label
		const yLabel = data.yLabels[yi]!.slice(0, yLabelWidth - 1).padStart(
			yLabelWidth - 1,
		);
		canvas.text(0, canvasY, yLabel, axisColor);

		for (let xi = 0; xi < gridCols; xi++) {
			const val = data.grid[yi]![xi];
			const cx = yLabelWidth + xi * cellWidth;

			if (val === null) {
				for (let c = 0; c < cellWidth; c++) {
					canvas.set(cx + c, canvasY, "·", axisColor);
				}
				continue;
			}

			const range = data.max - data.min;
			const normalized = range === 0 ? 0.5 : (val - data.min) / range;
			const shadeIdx = Math.min(
				SHADES.length - 1,
				Math.floor(normalized * SHADES.length),
			);
			const colorIdx = Math.min(
				HEAT_COLORS.length - 1,
				Math.floor(normalized * HEAT_COLORS.length),
			);
			const char = SHADES[shadeIdx]!;
			const color = nc ? "" : HEAT_COLORS[colorIdx]!;

			for (let c = 0; c < cellWidth; c++) {
				canvas.set(cx + c, canvasY, char, color);
			}
		}
	}

	// X labels at bottom
	const xLabelY =
		titleHeight + Math.min(gridRows, canvas.height - xLabelHeight);
	for (let xi = 0; xi < gridCols; xi++) {
		const cx = yLabelWidth + xi * cellWidth;
		const label = data.xLabels[xi]!.slice(0, cellWidth);
		canvas.text(cx, xLabelY, label, axisColor);
	}

	// Color legend at the very bottom
	const legendY = xLabelY + 1;
	if (legendY < canvas.height) {
		const legendText = `${formatVal(data.min)}`;
		canvas.text(yLabelWidth, legendY, legendText, nc ? "" : HEAT_COLORS[0]!);
		const maxText = `${formatVal(data.max)}`;
		const rampStart = yLabelWidth + legendText.length + 1;
		const rampEnd = Math.min(canvas.width - maxText.length - 2, rampStart + 20);
		for (let i = rampStart; i < rampEnd; i++) {
			const t = (i - rampStart) / (rampEnd - rampStart - 1);
			const ci = Math.min(
				HEAT_COLORS.length - 1,
				Math.floor(t * HEAT_COLORS.length),
			);
			const si = Math.min(SHADES.length - 1, Math.floor(t * SHADES.length));
			canvas.set(i, legendY, SHADES[si]!, nc ? "" : HEAT_COLORS[ci]!);
		}
		canvas.text(
			rampEnd + 1,
			legendY,
			maxText,
			nc ? "" : HEAT_COLORS[HEAT_COLORS.length - 1]!,
		);
	}

	return canvas.render(nc);
}

function formatVal(v: number): string {
	if (Number.isInteger(v)) return v.toString();
	return parseFloat(v.toPrecision(3)).toString();
}
