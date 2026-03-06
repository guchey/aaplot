import { isNoColor, resolvePalette } from "../renderer/color.ts";

const SPARKS = ["▁", "▂", "▃", "▄", "▅", "▆", "▇", "█"] as const;

export interface SparklineOptions {
	theme: "dark" | "light" | "auto";
	title?: string;
	width?: number;
}

/** Render a single-line sparkline from numeric values */
export function renderSparkline(
	values: number[],
	opts: SparklineOptions,
): string {
	if (values.length === 0) return "";

	const nc = isNoColor();
	const palette = resolvePalette(opts.theme);

	const min = Math.min(...values);
	const max = Math.max(...values);
	const range = max - min;

	// Resample if width is specified and smaller than values
	let data = values;
	if (opts.width && opts.width < values.length) {
		data = resample(values, opts.width);
	}

	const sparkChars = data.map((v) => {
		if (range === 0) return SPARKS[3]; // mid-level for flat data
		const normalized = (v - min) / range;
		const idx = Math.min(
			SPARKS.length - 1,
			Math.floor(normalized * SPARKS.length),
		);
		return SPARKS[idx]!;
	});

	const sparkStr = sparkChars.join("");
	const lineColor = nc ? "" : palette.line;
	const reset = nc ? "" : palette.reset;
	const titleColor = nc ? "" : palette.title;
	const axisColor = nc ? "" : palette.axis;

	const parts: string[] = [];

	if (opts.title) {
		parts.push(`${titleColor}${opts.title}${reset} `);
	}

	parts.push(`${lineColor}${sparkStr}${reset}`);
	parts.push(` ${axisColor}${formatVal(min)}..${formatVal(max)}${reset}`);

	return parts.join("");
}

/** Render multiple sparklines (one per series) */
export function renderMultiSparkline(
	series: { key: string; values: number[] }[],
	opts: SparklineOptions,
): string {
	const nc = isNoColor();
	const palette = resolvePalette(opts.theme);
	const axisColor = nc ? "" : palette.axis;
	const reset = nc ? "" : palette.reset;

	const maxKeyLen = Math.max(...series.map((s) => s.key.length));
	const sparkWidth = opts.width ? opts.width - maxKeyLen - 20 : undefined;

	return series
		.map((s, si) => {
			const lineColor = nc ? "" : palette.series[si % palette.series.length]!;
			const paddedKey = s.key.padStart(maxKeyLen);
			const min = Math.min(...s.values);
			const max = Math.max(...s.values);
			const range = max - min;

			let data = s.values;
			if (sparkWidth && sparkWidth > 0 && sparkWidth < data.length) {
				data = resample(data, sparkWidth);
			}

			const sparkStr = data
				.map((v) => {
					if (range === 0) return SPARKS[3];
					const normalized = (v - min) / range;
					const idx = Math.min(
						SPARKS.length - 1,
						Math.floor(normalized * SPARKS.length),
					);
					return SPARKS[idx]!;
				})
				.join("");

			return `${axisColor}${paddedKey}${reset} ${lineColor}${sparkStr}${reset} ${axisColor}${formatVal(min)}..${formatVal(max)}${reset}`;
		})
		.join("\n");
}

function resample(values: number[], targetLen: number): number[] {
	const result: number[] = [];
	const step = values.length / targetLen;
	for (let i = 0; i < targetLen; i++) {
		const start = Math.floor(i * step);
		const end = Math.floor((i + 1) * step);
		let sum = 0;
		let count = 0;
		for (let j = start; j < end && j < values.length; j++) {
			sum += values[j]!;
			count++;
		}
		result.push(count > 0 ? sum / count : values[start]!);
	}
	return result;
}

function formatVal(v: number): string {
	if (Number.isInteger(v)) return v.toString();
	return parseFloat(v.toPrecision(3)).toString();
}
