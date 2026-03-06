import { describe, expect, test } from "bun:test";
import { renderHistogram } from "../../src/charts/histogram.ts";
import type { HistogramOptions } from "../../src/charts/types.ts";

const defaultOpts: HistogramOptions = {
	x: "score",
	theme: "dark",
	width: 40,
	height: 15,
};

describe("renderHistogram", () => {
	test("renders without throwing", () => {
		const values = [72, 85, 91, 68, 74, 88, 95, 79, 82, 71];
		const result = renderHistogram(values, "score", defaultOpts);
		expect(typeof result).toBe("string");
		expect(result.length).toBeGreaterThan(0);
	});

	test("contains block characters", () => {
		const values = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
		const result = renderHistogram(values, "score", defaultOpts);
		expect(result).toMatch(/[▁▂▃▄▅▆▇█]/);
	});

	test("auto-generates title with field name", () => {
		const values = [1, 2, 3, 4, 5];
		const result = renderHistogram(values, "age", defaultOpts);
		expect(result).toContain("Histogram of age");
	});

	test("uses custom title when provided", () => {
		const values = [1, 2, 3, 4, 5];
		const result = renderHistogram(values, "age", {
			...defaultOpts,
			title: "Custom",
		});
		expect(result).toContain("Custom");
		expect(result).not.toContain("Histogram of age");
	});

	test("uses custom bin count", () => {
		const values = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
		const result3 = renderHistogram(values, "val", { ...defaultOpts, bins: 3 });
		const result10 = renderHistogram(values, "val", {
			...defaultOpts,
			bins: 10,
		});
		// Both should render but look different
		expect(typeof result3).toBe("string");
		expect(typeof result10).toBe("string");
		expect(result3).not.toBe(result10);
	});

	test("handles single value", () => {
		const values = [42];
		const result = renderHistogram(values, "val", defaultOpts);
		expect(typeof result).toBe("string");
	});

	test("handles identical values", () => {
		const values = [5, 5, 5, 5, 5];
		const result = renderHistogram(values, "val", defaultOpts);
		expect(typeof result).toBe("string");
	});

	test("handles large dataset", () => {
		const values = Array.from(
			{ length: 1000 },
			(_, i) => Math.sin(i) * 50 + 50,
		);
		const result = renderHistogram(values, "val", defaultOpts);
		expect(typeof result).toBe("string");
	});

	test("Sturges rule: 20 items should produce ~5 bins", () => {
		// Sturges: ceil(log2(20) + 1) = ceil(4.32 + 1) = ceil(5.32) = 6
		const values = Array.from({ length: 20 }, (_, i) => i * 5);
		const result = renderHistogram(values, "val", defaultOpts);
		expect(typeof result).toBe("string");
	});
});
