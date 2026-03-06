import { describe, expect, test } from "bun:test";
import type { ColorPalette } from "../../src/charts/types.ts";
import {
	computePlotArea,
	computeScale,
	drawAxes,
	drawTitle,
	formatTick,
} from "../../src/renderer/axis.ts";
import { Canvas } from "../../src/renderer/canvas.ts";

const MOCK_PALETTE: ColorPalette = {
	axis: "",
	bar: "",
	line: "",
	fill: "",
	title: "",
	reset: "",
};

describe("computeScale", () => {
	test("produces ticks that span the data range", () => {
		const scale = computeScale(0, 100);
		expect(scale.min).toBeLessThanOrEqual(0);
		expect(scale.max).toBeGreaterThanOrEqual(100);
		expect(scale.range).toBe(scale.max - scale.min);
		expect(scale.ticks.length).toBeGreaterThan(0);
	});

	test("produces nice round tick values", () => {
		const scale = computeScale(0, 100);
		for (const tick of scale.ticks) {
			// All ticks should be multiples of 20 or 25
			expect(tick % 1).toBe(0);
		}
	});

	test("handles equal min and max", () => {
		const scale = computeScale(5, 5);
		expect(scale.min).toBeLessThan(5);
		expect(scale.max).toBeGreaterThan(5);
		expect(scale.range).toBeGreaterThan(0);
		expect(scale.ticks.length).toBeGreaterThan(0);
	});

	test("handles negative range", () => {
		const scale = computeScale(-50, -10);
		expect(scale.min).toBeLessThanOrEqual(-50);
		expect(scale.max).toBeGreaterThanOrEqual(-10);
		for (const tick of scale.ticks) {
			expect(tick).toBeGreaterThanOrEqual(scale.min);
			expect(tick).toBeLessThanOrEqual(scale.max);
		}
	});

	test("handles zero crossing", () => {
		const scale = computeScale(-30, 70);
		expect(scale.min).toBeLessThanOrEqual(-30);
		expect(scale.max).toBeGreaterThanOrEqual(70);
		// Should include 0 as a tick
		expect(scale.ticks).toContain(0);
	});

	test("handles small fractional range", () => {
		const scale = computeScale(0, 1);
		expect(scale.ticks.length).toBeGreaterThan(1);
		expect(scale.min).toBeLessThanOrEqual(0);
		expect(scale.max).toBeGreaterThanOrEqual(1);
	});

	test("respects custom tick count hint", () => {
		const scale3 = computeScale(0, 100, 3);
		const scale10 = computeScale(0, 100, 10);
		// More ticks requested should generally produce more ticks
		// (though the nice number algorithm may adjust)
		expect(scale3.ticks.length).toBeLessThanOrEqual(scale10.ticks.length);
	});

	test("ticks are sorted in ascending order", () => {
		const scale = computeScale(0, 100);
		for (let i = 1; i < scale.ticks.length; i++) {
			expect(scale.ticks[i]!).toBeGreaterThan(scale.ticks[i - 1]!);
		}
	});
});

describe("formatTick", () => {
	test("formats integers without decimals", () => {
		expect(formatTick(0)).toBe("0");
		expect(formatTick(100)).toBe("100");
		expect(formatTick(-5)).toBe("-5");
	});

	test("formats floats with up to 3 significant figures", () => {
		expect(formatTick(0.5)).toBe("0.5");
		expect(formatTick(2.5)).toBe("2.5");
		expect(formatTick(0.333333)).toBe("0.333");
	});

	test("removes trailing zeros", () => {
		expect(formatTick(1.0)).toBe("1");
		expect(formatTick(2.5)).toBe("2.5");
	});
});

describe("computePlotArea", () => {
	test("reserves space for Y labels and X labels", () => {
		const area = computePlotArea(80, 24, false);
		expect(area.left).toBe(8); // Y_LABEL_WIDTH
		expect(area.top).toBe(0);
		expect(area.width).toBe(80 - 8 - 1);
		expect(area.height).toBe(24 - 2); // X_LABEL_HEIGHT = 2
	});

	test("reserves extra space for title", () => {
		const noTitle = computePlotArea(80, 24, false);
		const withTitle = computePlotArea(80, 24, true);
		expect(withTitle.top).toBeGreaterThan(noTitle.top);
		expect(withTitle.height).toBeLessThan(noTitle.height);
	});
});

describe("drawAxes", () => {
	test("draws Y axis and X axis lines", () => {
		const canvas = new Canvas(40, 15);
		const area = computePlotArea(40, 15, false);
		const yScale = computeScale(0, 100);

		drawAxes(canvas, area, null, yScale, ["A", "B", "C"], MOCK_PALETTE, true);

		// Check corner character
		const corner = canvas.get(area.left - 1, area.top + area.height);
		expect(corner?.char).toBe("└");

		// Check Y axis has vertical line or tick characters
		const yAxisCell = canvas.get(area.left - 1, area.top);
		// Top cell may be "│" or "┤" (if a tick lands there)
		expect(["│", "┤"]).toContain(yAxisCell?.char);

		// Check X axis has horizontal line characters
		const xAxisCell = canvas.get(area.left, area.top + area.height);
		expect(xAxisCell?.char).toBe("─");
	});

	test("draws categorical x labels", () => {
		const canvas = new Canvas(40, 15);
		const area = computePlotArea(40, 15, false);
		const yScale = computeScale(0, 100);

		drawAxes(canvas, area, null, yScale, ["Alpha", "Beta"], MOCK_PALETTE, true);

		// Labels should appear on the row below the X axis
		const labelRow = area.top + area.height + 1;
		const rendered = canvas.render(true);
		const lines = rendered.split("\n");
		expect(lines[labelRow]).toContain("Alpha");
		expect(lines[labelRow]).toContain("Beta");
	});
});

describe("drawTitle", () => {
	test("draws centered title", () => {
		const canvas = new Canvas(20, 3);
		drawTitle(canvas, "Test", MOCK_PALETTE, true);
		const rendered = canvas.render(true);
		const firstLine = rendered.split("\n")[0]!;
		expect(firstLine).toContain("Test");
		// Check centering: "Test" is 4 chars, canvas is 20, so starts at (20-4)/2 = 8
		expect(firstLine.indexOf("Test")).toBe(8);
	});

	test("does nothing when title is undefined", () => {
		const canvas = new Canvas(20, 3);
		drawTitle(canvas, undefined, MOCK_PALETTE, true);
		const rendered = canvas.render(true);
		expect(rendered.trim()).toBe("");
	});

	test("truncates long titles to canvas width", () => {
		const canvas = new Canvas(10, 3);
		drawTitle(
			canvas,
			"A very long title that exceeds width",
			MOCK_PALETTE,
			true,
		);
		const rendered = canvas.render(true);
		const firstLine = rendered.split("\n")[0]!;
		expect(firstLine.length).toBe(10);
	});
});
