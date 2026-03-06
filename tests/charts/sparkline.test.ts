import { describe, expect, test } from "bun:test";
import {
	renderMultiSparkline,
	renderSparkline,
} from "../../src/charts/sparkline.ts";

const defaultOpts = {
	theme: "dark" as const,
};

describe("renderSparkline", () => {
	test("renders without throwing", () => {
		const result = renderSparkline([1, 5, 3, 8, 2, 7, 4], defaultOpts);
		expect(typeof result).toBe("string");
		expect(result.length).toBeGreaterThan(0);
	});

	test("contains spark block characters", () => {
		const result = renderSparkline([1, 5, 3, 8, 2, 7, 4], defaultOpts);
		expect(result).toMatch(/[▁▂▃▄▅▆▇█]/);
	});

	test("shows min and max range", () => {
		const result = renderSparkline([10, 20, 30], defaultOpts);
		expect(result).toContain("10");
		expect(result).toContain("30");
	});

	test("renders title when provided", () => {
		const result = renderSparkline([1, 2, 3], { ...defaultOpts, title: "CPU" });
		expect(result).toContain("CPU");
	});

	test("handles single value", () => {
		const result = renderSparkline([42], defaultOpts);
		expect(typeof result).toBe("string");
	});

	test("handles identical values", () => {
		const result = renderSparkline([5, 5, 5, 5], defaultOpts);
		expect(typeof result).toBe("string");
		expect(result).toMatch(/[▁▂▃▄▅▆▇█]/);
	});

	test("handles empty array", () => {
		const result = renderSparkline([], defaultOpts);
		expect(result).toBe("");
	});

	test("resamples when width is smaller than data", () => {
		const values = Array.from({ length: 100 }, (_, i) => Math.sin(i) * 50 + 50);
		const result = renderSparkline(values, { ...defaultOpts, width: 20 });
		expect(typeof result).toBe("string");
		// Output should be compact (not 100 spark chars)
		const sparkChars = result.match(/[▁▂▃▄▅▆▇█]/g);
		expect(sparkChars!.length).toBeLessThanOrEqual(20);
	});
});

describe("renderMultiSparkline", () => {
	const series = [
		{ key: "cpu", values: [10, 30, 50, 70, 90, 80, 60, 40, 20] },
		{ key: "mem", values: [40, 45, 50, 55, 60, 65, 70, 75, 80] },
	];

	test("renders without throwing", () => {
		const result = renderMultiSparkline(series, defaultOpts);
		expect(typeof result).toBe("string");
		expect(result.length).toBeGreaterThan(0);
	});

	test("contains series keys", () => {
		const result = renderMultiSparkline(series, defaultOpts);
		expect(result).toContain("cpu");
		expect(result).toContain("mem");
	});

	test("has one line per series", () => {
		const result = renderMultiSparkline(series, defaultOpts);
		const lines = result.split("\n");
		expect(lines.length).toBe(2);
	});

	test("contains spark characters", () => {
		const result = renderMultiSparkline(series, defaultOpts);
		expect(result).toMatch(/[▁▂▃▄▅▆▇█]/);
	});
});
