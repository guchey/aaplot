interface CommandSchema {
	command: string;
	description: string;
	required: Record<string, string>;
	optional: Record<string, string>;
	input: string;
	input_example: Record<string, string>[];
}

const baseOptional: Record<string, string> = {
	width: "number (terminal columns override)",
	height: "number (terminal rows override)",
	theme: "enum: dark|light|auto (default: auto)",
	title: "string",
	json: "string (inline JSON data, alternative to stdin)",
	"dry-run": "boolean (validate input without rendering)",
};

const commonOptional: Record<string, string> = {
	...baseOptional,
	group: "string (field name for multi-series grouping)",
};

const SCHEMAS: Record<string, CommandSchema> = {
	bar: {
		command: "bar",
		description: "Bar chart from categorical data",
		required: {
			x: "string (field name, categorical)",
			y: "string (field name, numeric)",
		},
		optional: commonOptional,
		input: "JSON array via stdin or --json flag",
		input_example: [
			{ category: "A", count: "10" },
			{ category: "B", count: "25" },
		],
	},
	line: {
		command: "line",
		description: "Line chart for trends and time series",
		required: { x: "string (field name)", y: "string (field name, numeric)" },
		optional: commonOptional,
		input: "JSON array via stdin or --json flag",
		input_example: [
			{ date: "2024-01", value: "10" },
			{ date: "2024-02", value: "25" },
		],
	},
	area: {
		command: "area",
		description: "Area chart with filled region below line",
		required: { x: "string (field name)", y: "string (field name, numeric)" },
		optional: commonOptional,
		input: "JSON array via stdin or --json flag",
		input_example: [
			{ date: "2024-01", value: "10" },
			{ date: "2024-02", value: "25" },
		],
	},
	scatter: {
		command: "scatter",
		description: "Scatter plot using braille characters for high resolution",
		required: {
			x: "string (field name, numeric)",
			y: "string (field name, numeric)",
		},
		optional: commonOptional,
		input: "JSON array via stdin or --json flag",
		input_example: [
			{ distance: "1.5", fare: "10" },
			{ distance: "3.2", fare: "22" },
		],
	},
	histogram: {
		command: "histogram",
		description: "Histogram with automatic or manual binning",
		required: { x: "string (field name, numeric)" },
		optional: {
			...baseOptional,
			bins: "number (default: Sturges' rule = ceil(log2(n)+1))",
		},
		input: "JSON array via stdin or --json flag",
		input_example: [{ score: "72" }, { score: "85" }, { score: "91" }],
	},
	count: {
		command: "count",
		description:
			"Count occurrences of each unique value and render as bar chart",
		required: { x: "string (field name, categorical)" },
		optional: baseOptional,
		input: "JSON array via stdin or --json flag",
		input_example: [
			{ status: "active" },
			{ status: "pending" },
			{ status: "active" },
		],
	},
	boxplot: {
		command: "boxplot",
		description:
			"Horizontal box-and-whisker plot showing Q1, median, Q3, min, max",
		required: { x: "string (field name, numeric)" },
		optional: commonOptional,
		input: "JSON array via stdin or --json flag",
		input_example: [
			{ score: "72" },
			{ score: "85" },
			{ score: "91" },
			{ score: "68" },
		],
	},
	density: {
		command: "density",
		description:
			"Density plot using Gaussian KDE for smoothed distribution visualization",
		required: { x: "string (field name, numeric)" },
		optional: commonOptional,
		input: "JSON array via stdin or --json flag",
		input_example: [
			{ latency: "12.5" },
			{ latency: "15.3" },
			{ latency: "11.8" },
		],
	},
	heatmap: {
		command: "heatmap",
		description:
			"Heatmap grid with color intensity showing values for x/y category pairs",
		required: {
			x: "string (column field)",
			y: "string (row field)",
			value: "string (numeric value field)",
		},
		optional: baseOptional,
		input: "JSON array via stdin or --json flag",
		input_example: [
			{ day: "Mon", hour: "9", count: "42" },
			{ day: "Mon", hour: "10", count: "65" },
		],
	},
	sparkline: {
		command: "sparkline",
		description: "Compact single-line chart using block elements",
		required: { x: "string (field name, numeric)" },
		optional: commonOptional,
		input: "JSON array via stdin or --json flag",
		input_example: [
			{ value: "10" },
			{ value: "25" },
			{ value: "15" },
			{ value: "30" },
		],
	},
};

export function getSchema(command: string): string {
	const schema = SCHEMAS[command];
	if (!schema) {
		const available = Object.keys(SCHEMAS).join(", ");
		return JSON.stringify(
			{ error: `Unknown command "${command}". Available: ${available}` },
			null,
			2,
		);
	}
	return JSON.stringify(schema, null, 2);
}

export function getAllSchemas(): string {
	return JSON.stringify(
		{ commands: Object.keys(SCHEMAS), schemas: SCHEMAS },
		null,
		2,
	);
}
