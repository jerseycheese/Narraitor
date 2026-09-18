/**
 * The halftone screen for ink-treatment plates.
 *
 * A real amplitude-modulated halftone on a rotated screen: each cell carries a
 * dot whose AREA tracks the local tone. That is what makes a screen read as
 * continuous tone rather than as a uniform dot texture.
 *
 * Pure, and works on a luminance array, so it is testable without a canvas.
 */

/** Screen angle. 45 degrees is the traditional single-ink angle. */
const ANGLE_DEGREES = 45;

/**
 * Sub-samples per axis when deciding how much of a pixel a dot covers.
 * 1 gives hard, aliased dot edges; 3 matches an antialiased reference render.
 */
const SUPER_SAMPLE = 3;

export interface HalftoneOptions {
  width: number;
  height: number;
  /** Cell pitch in the same pixels as `width` and `height`. */
  cell: number;
}

/**
 * Screens a normalised luminance array into a halftone.
 *
 * Dot AREA carries the ink, so a cell at tone `t` must cover `1 - t` of its own
 * area: `pi * r^2 = (1 - t) * cell^2`, giving `r = cell / sqrt(pi)` at full
 * ink. Using `cell / sqrt(2)` is the easy mistake and prints a mid-grey at
 * about 78% coverage — a picture that reads as a black rectangle.
 *
 * Runs in two passes. The first averages tone per lattice cell; the second
 * decides, for each pixel, whether it falls inside its cell's dot. Sampling the
 * tone per pixel instead would re-read the same neighbourhood thousands of
 * times.
 *
 * @param lum - Normalised luminance in [0, 1], row-major.
 * @returns Luminance in [0, 1], where 0 is full ink and 1 is bare paper.
 */
export function halftone(
  lum: Float32Array,
  { width, height, cell }: HalftoneOptions
): Float32Array {
  const out = new Float32Array(lum.length);

  // A cell that cannot hold a dot would divide by zero below; pass the tone
  // through instead, which is what a screen finer than the pixel grid means.
  if (cell < 1) return Float32Array.from(lum);

  const theta = (ANGLE_DEGREES * Math.PI) / 180;
  const cos = Math.cos(theta);
  const sin = Math.sin(theta);

  // Lattice coordinates for the four image corners bound the cell grid.
  const us: number[] = [];
  const vs: number[] = [];
  for (const [x, y] of [
    [0, 0],
    [width, 0],
    [0, height],
    [width, height],
  ]) {
    us.push((x * cos + y * sin) / cell);
    vs.push((-x * sin + y * cos) / cell);
  }

  const uMin = Math.floor(Math.min(...us)) - 1;
  const uMax = Math.ceil(Math.max(...us)) + 1;
  const vMin = Math.floor(Math.min(...vs)) - 1;
  const vMax = Math.ceil(Math.max(...vs)) + 1;

  const uCount = uMax - uMin + 1;
  const vCount = vMax - vMin + 1;

  const sums = new Float64Array(uCount * vCount);
  const counts = new Uint32Array(uCount * vCount);

  const cellIndex = (x: number, y: number): number => {
    const u = Math.round((x * cos + y * sin) / cell) - uMin;
    const v = Math.round((-x * sin + y * cos) / cell) - vMin;

    if (u < 0 || u >= uCount || v < 0 || v >= vCount) return -1;

    return v * uCount + u;
  };

  const indexAt = (u: number, v: number): number => {
    if (u < 0 || u >= uCount || v < 0 || v >= vCount) return -1;
    return v * uCount + u;
  };

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = cellIndex(x + 0.5, y + 0.5);
      if (index < 0) continue;

      sums[index] += lum[y * width + x];
      counts[index] += 1;
    }
  }

  const maxRadius = cell / Math.sqrt(Math.PI);
  const samples = SUPER_SAMPLE;
  const step = 1 / samples;
  const sampleArea = samples * samples;

  /**
   * Whether any dot inks `(px, py)`: 1 inked, 0 not.
   *
   * At full ink the radius is `cell / sqrt(pi)`, wider than half a cell, so a
   * dot spills into its neighbours. Testing only the nearest cell clips every
   * dot to its own territory and loses that overlap — which showed up as ~9
   * percentage points of missing ink, all of it in the shadows.
   */
  const coversPoint = (px: number, py: number): number => {
    const u0 = Math.round((px * cos + py * sin) / cell);
    const v0 = Math.round((-px * sin + py * cos) / cell);

    for (let dv = -1; dv <= 1; dv += 1) {
      for (let du = -1; du <= 1; du += 1) {
        const index = indexAt(u0 + du - uMin, v0 + dv - vMin);
        if (index < 0 || counts[index] === 0) continue;

        const tone = sums[index] / counts[index];
        const radius = maxRadius * Math.sqrt(Math.max(0, 1 - tone));
        if (radius <= 0) continue;

        // Back to image space to measure the point's distance from the dot.
        const u = (u0 + du) * cell;
        const v = (v0 + dv) * cell;
        const dx = px - (u * cos - v * sin);
        const dy = py - (u * sin + v * cos);

        if (dx * dx + dy * dy <= radius * radius) return 1;
      }
    }

    return 0;
  };

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let inked = 0;

      for (let sy = 0; sy < samples; sy += 1) {
        for (let sx = 0; sx < samples; sx += 1) {
          inked += coversPoint(x + (sx + 0.5) * step, y + (sy + 0.5) * step);
        }
      }

      out[y * width + x] = 1 - inked / sampleArea;
    }
  }

  return out;
}
