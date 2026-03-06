import { describe, expect, test } from "bun:test";
import { renderStackedBar } from "../../src/charts/stacked-bar.ts";
import type { CommonOptions, Series } from "../../src/charts/types.ts";

const defaultOpts: CommonOptions & { percent?: boolean } = {
	x: "month",
	y: "sales",
	theme: "dark",
	width: 50,
	height: 15,
};

const series: Series[] = [
	{
		key: "Product A",
		points: [
			{ x: 0, y: 10, label: "Jan" },
			{ x: 1, y: 20, label: "Feb" },
			{ x: 2, y: 15, label: "Mar" },
		],
	},
	{
		key: "Product B",
		points: [
			{ x: 0, y: 15, label: "Jan" },
			{ x: 1, y: 10, label: "Feb" },
			{ x: 2, y: 25, label: "Mar" },
		],
	},
];

describe("renderStackedBar", () => {
	test("renders without throwing", () => {
		const result = renderStackedBar(series, ["Jan", "Feb", "Mar"], defaultOpts);
		expect(typeof result).toBe("string");
		expect(result.length).toBeGreaterThan(0);
	});

	test("contains block characters", () => {
		const result = renderStackedBar(series, ["Jan", "Feb", "Mar"], defaultOpts);
		expect(result).toMatch(/[▁▂▃▄▅▆▇█]/);
	});

	test("contains legend keys", () => {
		const result = renderStackedBar(series, ["Jan", "Feb", "Mar"], defaultOpts);
		expect(result).toContain("Product A");
		expect(result).toContain("Product B");
	});

	test("contains axis characters", () => {
		const result = renderStackedBar(series, ["Jan", "Feb", "Mar"], defaultOpts);
		expect(result).toContain("│");
		expect(result).toContain("─");
	});

	test("renders title when provided", () => {
		const result = renderStackedBar(series, ["Jan", "Feb", "Mar"], {
			...defaultOpts,
			title: "Sales",
		});
		expect(result).toContain("Sales");
	});

	test("percent mode renders without throwing", () => {
		const result = renderStackedBar(series, ["Jan", "Feb", "Mar"], {
			...defaultOpts,
			percent: true,
		});
		expect(typeof result).toBe("string");
		// Should contain 100 in y-axis labels
		expect(result).toContain("100");
	});

	test("handles single series", () => {
		const single: Series[] = [
			{ key: "Only", points: [{ x: 0, y: 10, label: "A" }] },
		];
		const result = renderStackedBar(single, ["A"], defaultOpts);
		expect(typeof result).toBe("string");
	});

	test("handles three series", () => {
		const three: Series[] = [
			{ key: "A", points: [{ x: 0, y: 10, label: "Q1" }] },
			{ key: "B", points: [{ x: 0, y: 20, label: "Q1" }] },
			{ key: "C", points: [{ x: 0, y: 15, label: "Q1" }] },
		];
		const result = renderStackedBar(three, ["Q1"], defaultOpts);
		expect(typeof result).toBe("string");
	});
});
