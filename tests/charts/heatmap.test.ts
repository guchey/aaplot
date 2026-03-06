import { describe, expect, test } from "bun:test";
import type { HeatmapOptions } from "../../src/charts/heatmap.ts";
import { renderHeatmap } from "../../src/charts/heatmap.ts";
import type { Row } from "../../src/charts/types.ts";

const defaultOpts: HeatmapOptions = {
	x: "hour",
	y: "day",
	value: "count",
	theme: "dark",
	width: 50,
	height: 15,
};

const sampleData: Row[] = [
	{ day: "Mon", hour: "9", count: "10" },
	{ day: "Mon", hour: "10", count: "30" },
	{ day: "Mon", hour: "11", count: "50" },
	{ day: "Tue", hour: "9", count: "20" },
	{ day: "Tue", hour: "10", count: "60" },
	{ day: "Tue", hour: "11", count: "40" },
	{ day: "Wed", hour: "9", count: "45" },
	{ day: "Wed", hour: "10", count: "25" },
	{ day: "Wed", hour: "11", count: "15" },
];

describe("renderHeatmap", () => {
	test("renders without throwing", () => {
		const result = renderHeatmap(sampleData, defaultOpts);
		expect(typeof result).toBe("string");
		expect(result.length).toBeGreaterThan(0);
	});

	test("contains shade characters", () => {
		const result = renderHeatmap(sampleData, defaultOpts);
		expect(result).toMatch(/[░▒▓█]/);
	});

	test("contains row labels", () => {
		const result = renderHeatmap(sampleData, defaultOpts);
		expect(result).toContain("Mon");
		expect(result).toContain("Tue");
		expect(result).toContain("Wed");
	});

	test("contains column labels", () => {
		const result = renderHeatmap(sampleData, defaultOpts);
		expect(result).toContain("9");
		expect(result).toContain("10");
		expect(result).toContain("11");
	});

	test("renders title when provided", () => {
		const result = renderHeatmap(sampleData, {
			...defaultOpts,
			title: "Activity",
		});
		expect(result).toContain("Activity");
	});

	test("handles single cell", () => {
		const data: Row[] = [{ x: "a", y: "b", val: "42" }];
		const result = renderHeatmap(data, {
			...defaultOpts,
			x: "x",
			y: "y",
			value: "val",
		});
		expect(typeof result).toBe("string");
	});

	test("handles identical values", () => {
		const data: Row[] = [
			{ x: "a", y: "1", val: "5" },
			{ x: "b", y: "1", val: "5" },
			{ x: "a", y: "2", val: "5" },
			{ x: "b", y: "2", val: "5" },
		];
		const result = renderHeatmap(data, {
			...defaultOpts,
			x: "x",
			y: "y",
			value: "val",
		});
		expect(typeof result).toBe("string");
	});
});
