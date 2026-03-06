import type { ColorPalette, PlotArea, Scale } from "../charts/types.ts";
import type { Canvas } from "./canvas.ts";

const Y_LABEL_WIDTH = 8;
const X_LABEL_HEIGHT = 2;
const TITLE_HEIGHT = 1;

export function computeScale(min: number, max: number, tickCount = 5): Scale {
	if (min === max) {
		min = min - 1;
		max = max + 1;
	}
	const range = max - min;
	const roughStep = range / (tickCount - 1);
	const magnitude = 10 ** Math.floor(Math.log10(roughStep));
	const niceSteps = [1, 2, 2.5, 5, 10];
	const step =
		magnitude * (niceSteps.find((s) => s * magnitude >= roughStep) ?? 10);

	const niceMin = Math.floor(min / step) * step;
	const niceMax = Math.ceil(max / step) * step;

	const ticks: number[] = [];
	for (let t = niceMin; t <= niceMax + step * 0.001; t += step) {
		ticks.push(parseFloat(t.toPrecision(10)));
	}

	return {
		min: niceMin,
		max: niceMax,
		range: niceMax - niceMin,
		tickCount: ticks.length,
		ticks,
	};
}

export function formatTick(value: number): string {
	if (Number.isInteger(value)) return value.toString();
	return parseFloat(value.toPrecision(3)).toString();
}

export function computePlotArea(
	canvasWidth: number,
	canvasHeight: number,
	hasTitle: boolean,
): PlotArea {
	const titleH = hasTitle ? TITLE_HEIGHT + 1 : 0;
	return {
		left: Y_LABEL_WIDTH,
		top: titleH,
		width: canvasWidth - Y_LABEL_WIDTH - 1,
		height: canvasHeight - X_LABEL_HEIGHT - titleH,
	};
}

export function drawAxes(
	canvas: Canvas,
	area: PlotArea,
	xScale: Scale | null,
	yScale: Scale,
	xLabels: string[] | null,
	palette: ColorPalette,
	noColor: boolean,
): void {
	const axisColor = noColor ? "" : palette.axis;

	// Y axis
	canvas.vLine(area.left - 1, area.top, area.height, "│", axisColor);
	// X axis
	canvas.hLine(
		area.left - 1,
		area.top + area.height,
		area.width + 1,
		"─",
		axisColor,
	);
	// Corner
	canvas.set(area.left - 1, area.top + area.height, "└", axisColor);

	// Y tick labels
	for (const tick of yScale.ticks) {
		if (yScale.range === 0) continue;
		const yPos =
			area.top +
			area.height -
			1 -
			Math.round(((tick - yScale.min) / yScale.range) * (area.height - 1));
		if (yPos < area.top || yPos > area.top + area.height) continue;
		const label = formatTick(tick).padStart(Y_LABEL_WIDTH - 1);
		canvas.text(0, yPos, label, axisColor);
		canvas.set(area.left - 1, yPos, "┤", axisColor);
	}

	// X tick labels
	if (xLabels && xLabels.length > 0) {
		const maxLabels = Math.floor(area.width / 6);
		const step = Math.max(1, Math.ceil(xLabels.length / maxLabels));
		const count = xLabels.length;
		xLabels.forEach((label, i) => {
			if (i % step !== 0) return;
			const xPos =
				count === 1
					? area.left
					: area.left + Math.round((i / (count - 1)) * (area.width - 1));
			const truncated = label.slice(0, 8);
			const startX = xPos - Math.floor(truncated.length / 2);
			canvas.text(startX, area.top + area.height + 1, truncated, axisColor);
		});
	} else if (xScale) {
		const maxLabels = Math.floor(area.width / 8);
		const step = Math.max(1, Math.ceil(xScale.tickCount / maxLabels));
		xScale.ticks.forEach((tick, i) => {
			if (i % step !== 0) return;
			if (xScale.range === 0) return;
			const xPos =
				area.left +
				Math.round(((tick - xScale.min) / xScale.range) * (area.width - 1));
			const label = formatTick(tick);
			const startX = xPos - Math.floor(label.length / 2);
			canvas.text(startX, area.top + area.height + 1, label, axisColor);
		});
	}
}

export function drawTitle(
	canvas: Canvas,
	title: string | undefined,
	palette: ColorPalette,
	noColor: boolean,
): void {
	if (!title) return;
	const t = title.slice(0, canvas.width);
	const startX = Math.floor((canvas.width - t.length) / 2);
	canvas.text(startX, 0, t, noColor ? "" : palette.title);
}

export function drawLegend(
	canvas: Canvas,
	seriesKeys: string[],
	seriesColors: string[],
	noColor: boolean,
	y: number,
): void {
	let x = Y_LABEL_WIDTH;
	for (let i = 0; i < seriesKeys.length; i++) {
		const color = noColor ? "" : seriesColors[i]!;
		canvas.set(x, y, "━", color);
		canvas.set(x + 1, y, "━", color);
		x += 3;
		const label = seriesKeys[i]!.slice(0, 12);
		canvas.text(x, y, label, color);
		x += label.length + 2;
		if (x >= canvas.width - 10) break;
	}
}
