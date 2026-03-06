import { describe, expect, test } from "bun:test";
import { renderArea } from "../../src/charts/area.ts";
import type { CommonOptions, DataPoint } from "../../src/charts/types.ts";

const defaultOpts: CommonOptions = {
	x: "x",
	y: "y",
	theme: "dark",
	width: 40,
	height: 15,
};

const hasBraille = (s: string) => /[\u2800-\u28FF]/.test(s);

describe("renderArea", () => {
	test("renders without throwing", () => {
		const points: DataPoint[] = [
			{ x: 1, y: 5 },
			{ x: 2, y: 15 },
			{ x: 3, y: 8 },
		];
		const result = renderArea(points, null, defaultOpts);
		expect(typeof result).toBe("string");
		expect(result.length).toBeGreaterThan(0);
	});

	test("contains braille characters for fill and line", () => {
		const points: DataPoint[] = [
			{ x: 1, y: 10 },
			{ x: 2, y: 20 },
			{ x: 3, y: 15 },
		];
		const result = renderArea(points, null, defaultOpts);
		expect(hasBraille(result)).toBe(true);
	});

	test("handles categorical labels", () => {
		const points: DataPoint[] = [
			{ x: 0, y: 10, label: "Q1" },
			{ x: 1, y: 20, label: "Q2" },
		];
		const result = renderArea(points, ["Q1", "Q2"], defaultOpts);
		expect(result).toContain("Q1");
		expect(result).toContain("Q2");
	});

	test("handles two points (minimum for interpolation)", () => {
		const points: DataPoint[] = [
			{ x: 0, y: 0 },
			{ x: 10, y: 50 },
		];
		const result = renderArea(points, null, defaultOpts);
		expect(hasBraille(result)).toBe(true);
	});

	test("renders title", () => {
		const points: DataPoint[] = [
			{ x: 1, y: 5 },
			{ x: 2, y: 10 },
		];
		const result = renderArea(points, null, {
			...defaultOpts,
			title: "Revenue",
		});
		expect(result).toContain("Revenue");
	});
});
