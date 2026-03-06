import { describe, expect, test } from "bun:test";
import { Canvas, getTerminalSize } from "../../src/renderer/canvas.ts";

describe("getTerminalSize", () => {
	test("uses overrides when provided", () => {
		const size = getTerminalSize(100, 50);
		expect(size).toEqual({ width: 100, height: 50 });
	});

	test("returns dimensions with defaults fallback", () => {
		const size = getTerminalSize();
		expect(size.width).toBeGreaterThan(0);
		expect(size.height).toBeGreaterThan(0);
	});

	test("partial override uses fallback for other dimension", () => {
		const size = getTerminalSize(120);
		expect(size.width).toBe(120);
		expect(size.height).toBeGreaterThan(0);
	});
});

describe("Canvas", () => {
	test("initializes with correct dimensions", () => {
		const canvas = new Canvas(10, 5);
		expect(canvas.width).toBe(10);
		expect(canvas.height).toBe(5);
	});

	test("initializes all cells as spaces", () => {
		const canvas = new Canvas(3, 2);
		const rendered = canvas.render(true);
		expect(rendered).toBe("   \n   ");
	});

	describe("set/get", () => {
		test("sets and gets a cell", () => {
			const canvas = new Canvas(5, 5);
			canvas.set(2, 3, "X", "\x1b[31m");
			const cell = canvas.get(2, 3);
			expect(cell?.char).toBe("X");
			expect(cell?.ansi).toBe("\x1b[31m");
		});

		test("ignores out-of-bounds set (negative)", () => {
			const canvas = new Canvas(5, 5);
			canvas.set(-1, 0, "X");
			canvas.set(0, -1, "X");
			// Should not throw, just silently ignore
			expect(canvas.get(0, 0)?.char).toBe(" ");
		});

		test("ignores out-of-bounds set (overflow)", () => {
			const canvas = new Canvas(5, 5);
			canvas.set(5, 0, "X");
			canvas.set(0, 5, "X");
			expect(canvas.get(4, 4)?.char).toBe(" ");
		});

		test("get returns undefined for out-of-bounds", () => {
			const canvas = new Canvas(5, 5);
			expect(canvas.get(-1, 0)).toBeUndefined();
			expect(canvas.get(0, -1)).toBeUndefined();
			expect(canvas.get(5, 0)).toBeUndefined();
			expect(canvas.get(0, 5)).toBeUndefined();
		});
	});

	describe("hLine", () => {
		test("draws a horizontal line", () => {
			const canvas = new Canvas(10, 3);
			canvas.hLine(2, 1, 5, "─");
			const rendered = canvas.render(true);
			const lines = rendered.split("\n");
			expect(lines[1]).toBe("  ─────   ");
		});
	});

	describe("vLine", () => {
		test("draws a vertical line", () => {
			const canvas = new Canvas(5, 5);
			canvas.vLine(2, 1, 3, "│");
			expect(canvas.get(2, 1)?.char).toBe("│");
			expect(canvas.get(2, 2)?.char).toBe("│");
			expect(canvas.get(2, 3)?.char).toBe("│");
			expect(canvas.get(2, 0)?.char).toBe(" ");
			expect(canvas.get(2, 4)?.char).toBe(" ");
		});
	});

	describe("text", () => {
		test("writes a string horizontally", () => {
			const canvas = new Canvas(10, 1);
			canvas.text(2, 0, "hello");
			const rendered = canvas.render(true);
			expect(rendered).toBe("  hello   ");
		});

		test("truncates text that exceeds canvas width", () => {
			const canvas = new Canvas(5, 1);
			canvas.text(3, 0, "hello");
			const rendered = canvas.render(true);
			expect(rendered).toBe("   he");
		});
	});

	describe("render", () => {
		test("renders without color when noColor is true", () => {
			const canvas = new Canvas(3, 1);
			canvas.set(0, 0, "A", "\x1b[31m");
			canvas.set(1, 0, "B", "\x1b[32m");
			canvas.set(2, 0, "C");
			const rendered = canvas.render(true);
			expect(rendered).toBe("ABC");
			expect(rendered).not.toContain("\x1b[");
		});

		test("renders with ANSI codes when noColor is false", () => {
			const canvas = new Canvas(3, 1);
			canvas.set(0, 0, "A", "\x1b[31m");
			canvas.set(1, 0, "B", "\x1b[31m");
			canvas.set(2, 0, "C");
			const rendered = canvas.render(false);
			expect(rendered).toContain("\x1b[31m");
			expect(rendered).toContain("AB");
			expect(rendered).toContain("\x1b[0m");
		});

		test("coalesces same ANSI codes (no redundant escape sequences)", () => {
			const canvas = new Canvas(3, 1);
			canvas.set(0, 0, "A", "\x1b[31m");
			canvas.set(1, 0, "B", "\x1b[31m");
			canvas.set(2, 0, "C", "\x1b[31m");
			const rendered = canvas.render(false);
			// Should only have one \x1b[31m at the start, not three
			// biome-ignore lint/suspicious/noControlCharactersInRegex: ANSI escape matching
			const matches = rendered.match(/\x1b\[31m/g);
			expect(matches).toHaveLength(1);
		});

		test("joins multiple rows with newlines", () => {
			const canvas = new Canvas(2, 3);
			const rendered = canvas.render(true);
			const lines = rendered.split("\n");
			expect(lines).toHaveLength(3);
		});
	});
});
