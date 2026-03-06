import type { ColorPalette } from "../charts/types.ts";

const RESET = "\x1b[0m";

const FG = {
	black: "\x1b[30m",
	red: "\x1b[31m",
	green: "\x1b[32m",
	yellow: "\x1b[33m",
	blue: "\x1b[34m",
	magenta: "\x1b[35m",
	cyan: "\x1b[36m",
	white: "\x1b[37m",
	brightBlack: "\x1b[90m",
	brightRed: "\x1b[91m",
	brightGreen: "\x1b[92m",
	brightYellow: "\x1b[93m",
	brightBlue: "\x1b[94m",
	brightMagenta: "\x1b[95m",
	brightCyan: "\x1b[96m",
	brightWhite: "\x1b[97m",
} as const;

const DARK_PALETTE: ColorPalette = {
	axis: FG.brightBlack,
	bar: FG.cyan,
	line: FG.brightCyan,
	fill: FG.blue,
	title: FG.brightWhite,
	reset: RESET,
	series: [
		FG.brightCyan,
		FG.brightRed,
		FG.brightGreen,
		FG.brightYellow,
		FG.brightMagenta,
		FG.brightBlue,
	],
};

const LIGHT_PALETTE: ColorPalette = {
	axis: FG.black,
	bar: FG.blue,
	line: FG.blue,
	fill: FG.cyan,
	title: FG.black,
	reset: RESET,
	series: [FG.blue, FG.red, FG.green, FG.magenta, FG.cyan, FG.yellow],
};

export function detectTheme(): "dark" | "light" {
	const colorfgbg = process.env.COLORFGBG;
	if (colorfgbg) {
		const parts = colorfgbg.split(";");
		const bg = parseInt(parts[parts.length - 1] ?? "0", 10);
		return bg < 8 ? "light" : "dark";
	}
	return "dark";
}

export function resolvePalette(theme: "dark" | "light" | "auto"): ColorPalette {
	const resolved = theme === "auto" ? detectTheme() : theme;
	return resolved === "light" ? LIGHT_PALETTE : DARK_PALETTE;
}

export function getSeriesColor(palette: ColorPalette, index: number): string {
	return palette.series[index % palette.series.length]!;
}

export function isNoColor(): boolean {
	if (process.env.FORCE_COLOR !== undefined) return false;
	return process.env.NO_COLOR !== undefined || !process.stderr.isTTY;
}
