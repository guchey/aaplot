import type { PlotArea } from "../charts/types.ts";
import type { Canvas } from "./canvas.ts";

// Braille dot bit positions in a 2x4 grid:
//  col 0  col 1
//  dot1   dot4   (row 0)
//  dot2   dot5   (row 1)
//  dot3   dot6   (row 2)
//  dot7   dot8   (row 3)
const BRAILLE_DOTS: number[][] = [
	[0x01, 0x08], // row 0
	[0x02, 0x10], // row 1
	[0x04, 0x20], // row 2
	[0x40, 0x80], // row 3
];
const BRAILLE_BASE = 0x2800;

/** High-resolution pixel buffer that renders to Braille characters.
 *  Each character cell contains 2×4 subpixels. */
export class BrailleBuffer {
	/** Width in subpixels */
	readonly pixWidth: number;
	/** Height in subpixels */
	readonly pixHeight: number;
	private pixels: Uint8Array;

	constructor(area: PlotArea) {
		this.pixWidth = area.width * 2;
		this.pixHeight = area.height * 4;
		this.pixels = new Uint8Array(this.pixWidth * this.pixHeight);
	}

	/** Set a subpixel at (px, py) */
	set(px: number, py: number): void {
		if (px >= 0 && px < this.pixWidth && py >= 0 && py < this.pixHeight) {
			this.pixels[py * this.pixWidth + px] = 1;
		}
	}

	/** Draw a line between two subpixel coordinates using Bresenham's algorithm */
	line(x0: number, y0: number, x1: number, y1: number): void {
		const dx = Math.abs(x1 - x0);
		const dy = Math.abs(y1 - y0);
		const sx = x0 < x1 ? 1 : -1;
		const sy = y0 < y1 ? 1 : -1;
		let err = dx - dy;
		let cx = x0;
		let cy = y0;

		while (true) {
			this.set(cx, cy);
			if (cx === x1 && cy === y1) break;
			const e2 = 2 * err;
			if (e2 > -dy) {
				err -= dy;
				cx += sx;
			}
			if (e2 < dx) {
				err += dx;
				cy += sy;
			}
		}
	}

	/** Fill a vertical column of subpixels from y to maxY */
	fillDown(px: number, fromY: number, toY: number): void {
		for (let y = fromY; y <= toY; y++) {
			this.set(px, y);
		}
	}

	/** Map a data X value to subpixel coordinate */
	mapX(value: number, min: number, range: number): number {
		if (range === 0) return Math.floor(this.pixWidth / 2);
		return Math.round(((value - min) / range) * (this.pixWidth - 1));
	}

	/** Map a data Y value to subpixel coordinate (Y is inverted) */
	mapY(value: number, min: number, range: number): number {
		if (range === 0) return Math.floor(this.pixHeight / 2);
		return (
			this.pixHeight -
			1 -
			Math.round(((value - min) / range) * (this.pixHeight - 1))
		);
	}

	/** Render the pixel buffer onto a Canvas using Braille characters */
	render(canvas: Canvas, area: PlotArea, ansi: string): void {
		for (let cy = 0; cy < area.height; cy++) {
			for (let cx = 0; cx < area.width; cx++) {
				let bits = 0;
				for (let dr = 0; dr < 4; dr++) {
					for (let dc = 0; dc < 2; dc++) {
						const px = cx * 2 + dc;
						const py = cy * 4 + dr;
						if (this.pixels[py * this.pixWidth + px]) {
							bits |= BRAILLE_DOTS[dr]![dc]!;
						}
					}
				}
				if (bits > 0) {
					canvas.set(
						area.left + cx,
						area.top + cy,
						String.fromCodePoint(BRAILLE_BASE | bits),
						ansi,
					);
				}
			}
		}
	}

	/** Render with per-cell color selection (for multi-series overlay).
	 *  colorMap[py * pixWidth + px] holds the series index. */
	renderMulti(
		canvas: Canvas,
		area: PlotArea,
		colorMap: Int8Array,
		getColor: (seriesIndex: number) => string,
	): void {
		for (let cy = 0; cy < area.height; cy++) {
			for (let cx = 0; cx < area.width; cx++) {
				let bits = 0;
				let dominantSeries = -1;
				const seriesCounts = new Map<number, number>();
				for (let dr = 0; dr < 4; dr++) {
					for (let dc = 0; dc < 2; dc++) {
						const px = cx * 2 + dc;
						const py = cy * 4 + dr;
						const idx = py * this.pixWidth + px;
						if (this.pixels[idx]) {
							bits |= BRAILLE_DOTS[dr]![dc]!;
							const si = colorMap[idx]!;
							seriesCounts.set(si, (seriesCounts.get(si) ?? 0) + 1);
						}
					}
				}
				if (bits > 0) {
					// Pick the series that has the most subpixels in this cell
					let maxCount = 0;
					for (const [si, count] of seriesCounts) {
						if (count > maxCount) {
							maxCount = count;
							dominantSeries = si;
						}
					}
					canvas.set(
						area.left + cx,
						area.top + cy,
						String.fromCodePoint(BRAILLE_BASE | bits),
						getColor(dominantSeries),
					);
				}
			}
		}
	}
}
