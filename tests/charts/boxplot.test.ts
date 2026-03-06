import { describe, expect, test } from "bun:test";
import {
	renderBoxplot,
	renderGroupedBoxplot,
} from "../../src/charts/boxplot.ts";

const defaultOpts = {
	x: "score",
	theme: "dark" as const,
	width: 60,
	height: 15,
};

describe("renderBoxplot", () => {
	test("renders without throwing", () => {
		const values = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
		const result = renderBoxplot(values, "score", defaultOpts);
		expect(typeof result).toBe("string");
		expect(result.length).toBeGreaterThan(0);
	});

	test("contains box-drawing characters", () => {
		const values = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
		const result = renderBoxplot(values, "score", defaultOpts);
		expect(result).toMatch(/[┌┐└┘│├┤─━]/);
	});

	test("handles single value", () => {
		const values = [42];
		const result = renderBoxplot(values, "val", defaultOpts);
		expect(typeof result).toBe("string");
	});

	test("handles identical values", () => {
		const values = [5, 5, 5, 5, 5];
		const result = renderBoxplot(values, "val", defaultOpts);
		expect(typeof result).toBe("string");
	});

	test("handles two values", () => {
		const values = [10, 90];
		const result = renderBoxplot(values, "val", defaultOpts);
		expect(typeof result).toBe("string");
	});

	test("renders title when provided", () => {
		const values = [10, 20, 30, 40, 50];
		const result = renderBoxplot(values, "score", {
			...defaultOpts,
			title: "Score Distribution",
		});
		expect(result).toContain("Score Distribution");
	});
});

describe("renderGroupedBoxplot", () => {
	const groups = [
		{ key: "group_a", values: [10, 20, 30, 40, 50] },
		{ key: "group_b", values: [30, 40, 50, 60, 70] },
	];

	test("renders without throwing", () => {
		const result = renderGroupedBoxplot(groups, defaultOpts);
		expect(typeof result).toBe("string");
		expect(result.length).toBeGreaterThan(0);
	});

	test("contains legend keys", () => {
		const result = renderGroupedBoxplot(groups, defaultOpts);
		expect(result).toContain("group_a");
		expect(result).toContain("group_b");
	});

	test("handles many groups", () => {
		const manyGroups = Array.from({ length: 5 }, (_, i) => ({
			key: `g${i}`,
			values: Array.from({ length: 10 }, (_, j) => i * 10 + j),
		}));
		const result = renderGroupedBoxplot(manyGroups, {
			...defaultOpts,
			height: 25,
		});
		expect(typeof result).toBe("string");
	});
});
