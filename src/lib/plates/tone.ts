/**
 * Tone normalisation for ink-treatment plates.
 *
 * World art is generated, not chosen, and most of it is night scenes. Raw, a
 * cyberpunk street sits almost entirely in the bottom third of the range, so a
 * halftone screen fills nearly every cell with ink and the picture disappears.
 *
 * CSS cannot fix this. `filter: brightness()` is a multiplier, so raising it
 * pins the top of the range against the ceiling instead of lifting the shadows
 * — measured, that clipped 10-24% of every plate to a flat, detail-free field.
 * So the tone is normalised here, before the plate is drawn, and the theme is
 * left to supply nothing but two colours.
 *
 * Every function is pure and works on a luminance array, so it is testable
 * without a canvas. jsdom has none.
 */

/**
 * Where the median lands by default.
 *
 * Mid-grey (0.5) is the neutral choice and produces a faithful plate: a screen
 * inks exactly the share of the page the tone calls for. It also reads lighter
 * than the plates this direction was approved against, because the reference
 * renderer drew every dot a sub-pixel wide and over-inked by about 9 points.
 * 0.42 reproduces the approved density with correct dot geometry — the tone
 * curve carries it, rather than the dots being drawn wrong.
 */
export const DEFAULT_MIDTONE_TARGET = 0.42;

/** Relative luminance weights, Rec. 709. */
const R_WEIGHT = 0.2126;
const G_WEIGHT = 0.7152;
const B_WEIGHT = 0.0722;

/**
 * Converts packed RGBA bytes to luminance in [0, 1].
 *
 * @param rgba - Pixel data as returned by `ImageData.data`.
 * @returns One luminance value per pixel.
 */
export function toLuminance(rgba: Uint8ClampedArray): Float32Array {
  const out = new Float32Array(rgba.length / 4);

  for (let i = 0, p = 0; i < rgba.length; i += 4, p += 1) {
    out[p] =
      (R_WEIGHT * rgba[i] + G_WEIGHT * rgba[i + 1] + B_WEIGHT * rgba[i + 2]) /
      255;
  }

  return out;
}

/**
 * Linearly interpolated percentile, matching NumPy's default so plates
 * generated here line up with the reference renders the direction was
 * approved against.
 *
 * @param sorted - Ascending values.
 * @param percent - Percentile to read, 0-100.
 */
function percentileOfSorted(sorted: Float32Array, percent: number): number {
  const last = sorted.length - 1;

  if (last < 0) return 0;

  const position = (percent / 100) * last;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);

  if (lower === upper) return sorted[lower];

  return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
}

function sortedCopy(lum: Float32Array): Float32Array {
  return Float32Array.from(lum).sort();
}

/** Percentiles that bound the range a plate is stretched over. */
const LEVELS_LO_PERCENT = 1;
const LEVELS_HI_PERCENT = 99;

/** Span below which an image has no range to stretch. */
const FLAT_SPAN = 1e-3;

/**
 * Whether the image carries no tonal range at all.
 *
 * A flat source (a blank placeholder, a solid fill) has nothing to print: the
 * tone pass leaves it as it is, and the ink treatment then turns it into a
 * solid slab of paper.
 *
 * @param lum - Luminance in [0, 1].
 */
export function isFlat(lum: Float32Array): boolean {
  const sorted = sortedCopy(lum);

  return (
    percentileOfSorted(sorted, LEVELS_HI_PERCENT) -
      percentileOfSorted(sorted, LEVELS_LO_PERCENT) <
    FLAT_SPAN
  );
}

/**
 * Stretches the image's own range to full black-to-white.
 *
 * This moves the endpoints only, which is not enough on its own — see
 * {@link midtone}.
 *
 * @param lum - Luminance in [0, 1].
 * @param loPercent - Percentile mapped to black.
 * @param hiPercent - Percentile mapped to white.
 */
export function autolevels(
  lum: Float32Array,
  loPercent = LEVELS_LO_PERCENT,
  hiPercent = LEVELS_HI_PERCENT
): Float32Array {
  const sorted = sortedCopy(lum);
  const lo = percentileOfSorted(sorted, loPercent);
  const hi = percentileOfSorted(sorted, hiPercent);

  // A flat image has nothing to stretch, and dividing by the span would blow up.
  if (hi - lo < FLAT_SPAN) return Float32Array.from(lum);

  const span = hi - lo;
  const out = new Float32Array(lum.length);

  for (let i = 0; i < lum.length; i += 1) {
    out[i] = Math.min(1, Math.max(0, (lum[i] - lo) / span));
  }

  return out;
}

/**
 * Pulls the image's own median to `target` with a per-image gamma.
 *
 * {@link autolevels} only moves the endpoints. The app's art is mostly night
 * scenes whose median still sits near 0.22 after a full stretch, so a screen
 * filled about 69% of its area with ink and the plate went black — against
 * roughly 47% on a reference render that reads correctly. Solving
 * `median ** gamma === target` is self-tuning, which is what this needs: the
 * source is whatever the player generated, not a chosen photograph.
 *
 * @param lum - Luminance in [0, 1].
 * @param target - Where the median should land.
 */
export function midtone(
  lum: Float32Array,
  target = DEFAULT_MIDTONE_TARGET
): Float32Array {
  const median = percentileOfSorted(sortedCopy(lum), 50);

  // At either end the solve is degenerate, and the image needs no midtone move.
  if (median <= 1e-3 || median >= 1 - 1e-3) return Float32Array.from(lum);

  const gamma = Math.log(target) / Math.log(median);
  const out = new Float32Array(lum.length);

  for (let i = 0; i < lum.length; i += 1) {
    out[i] = Math.pow(Math.min(1, Math.max(0, lum[i])), gamma);
  }

  return out;
}

export interface NormaliseOptions {
  /** Contrast applied about mid-grey, after the median move. */
  gain?: number;
  /** Where the median lands. */
  target?: number;
}

/**
 * The full tone pass: stretch the endpoints, move the median, then apply gain.
 *
 * @param lum - Luminance in [0, 1].
 */
export function normaliseTone(
  lum: Float32Array,
  { gain = 1, target = DEFAULT_MIDTONE_TARGET }: NormaliseOptions = {}
): Float32Array {
  const moved = midtone(autolevels(lum), target);

  if (gain === 1) return moved;

  const out = new Float32Array(moved.length);

  for (let i = 0; i < moved.length; i += 1) {
    out[i] = Math.min(1, Math.max(0, (moved[i] - 0.5) * gain + 0.5));
  }

  return out;
}

