/** A single row from BigQuery JSON output (all values are strings) */
export type Row = Record<string, string>;

/** Parsed numeric data point */
export interface DataPoint {
  x: number;
  y: number;
  label?: string;
}

/** A named group of data points (one series) */
export interface Series {
  key: string;
  points: DataPoint[];
}

/** Common options shared by all chart commands */
export interface CommonOptions {
  x: string;
  y: string;
  width?: number;
  height?: number;
  theme: "dark" | "light" | "auto";
  title?: string;
  group?: string;
}

/** Histogram-specific options */
export interface HistogramOptions extends Omit<CommonOptions, "y"> {
  bins?: number;
}

/** Resolved color palette */
export interface ColorPalette {
  axis: string;
  bar: string;
  line: string;
  fill: string;
  title: string;
  reset: string;
  series: string[];
}

/** A single cell in the canvas */
export interface Cell {
  char: string;
  ansi: string;
}

/** Resolved terminal dimensions */
export interface TerminalSize {
  width: number;
  height: number;
}

/** Axis scale descriptor */
export interface Scale {
  min: number;
  max: number;
  range: number;
  tickCount: number;
  ticks: number[];
}

/** Layout of the plot area inside the canvas */
export interface PlotArea {
  left: number;
  top: number;
  width: number;
  height: number;
}
