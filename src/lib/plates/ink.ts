/**
 * Derives a per-world ink from the world's own art.
 *
 * The paper end of a duotone is not a choice — it is whatever surface the plate
 * sits on. Only the ink is a decision, and the raw dominant colour is the wrong
 * answer, because generated art varies wildly in lightness and chroma.
 *
 * So the art picks the HUE and nothing else. Lightness and chroma are fixed by
 * the system, which means contrast against paper is guaranteed by construction
 * rather than checked afterwards and hoped for.
 *
 * Pure, and works on pixel bytes, so it is testable without a canvas.
 */

/** Light mode: dark ink on paper. */
const INK_LIGHTNESS = 0.42;
const INK_CHROMA = 0.055;

/** Dark mode: the ramp inverts, so the ink goes light. */
const INK_LIGHTNESS_DARK = 0.78;
const INK_CHROMA_DARK = 0.045;

/**
 * How far a plate hue must stay from the interactive accent, in degrees.
 *
 * A plate tinted the same colour as every link and primary button reads as an
 * enormous interactive element. Rotating away keeps a world-specific hue rather
 * than falling back to neutral.
 */
const MIN_ACCENT_SEPARATION_DEGREES = 30;

/** OKLCH hue of `--color-accent`. */
const ACCENT_HUE_DEGREES = 250;

/** Pixels too dark, too blown, or too grey to carry a hue worth reading. */
const MIN_USABLE_LIGHTNESS = 0.15;
const MAX_USABLE_LIGHTNESS = 0.95;
const MIN_USABLE_CHROMA = 0.02;
const MIN_USABLE_PIXELS = 50;

export interface WorldInk {
  /** Ink for light mode, as a hex string. */
  light: string;
  /** Ink for dark mode, as a hex string. */
  dark: string;
  /** The hue actually used, after the accent guard. */
  hue: number;
  /** Whether the hue was rotated away from the accent. */
  guarded: boolean;
}

function srgbToLinear(channel: number): number {
  return channel <= 0.04045
    ? channel / 12.92
    : Math.pow((channel + 0.055) / 1.055, 2.4);
}

function linearToSrgb(channel: number): number {
  return channel <= 0.0031308
    ? channel * 12.92
    : 1.055 * Math.pow(Math.max(0, channel), 1 / 2.4) - 0.055;
}

interface Oklab {
  lightness: number;
  a: number;
  b: number;
}

function rgbToOklab(red: number, green: number, blue: number): Oklab {
  const r = srgbToLinear(red);
  const g = srgbToLinear(green);
  const b = srgbToLinear(blue);

  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

  return {
    lightness: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    a: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  };
}

function toHex(value: number): string {
  return Math.round(Math.min(1, Math.max(0, value)) * 255)
    .toString(16)
    .padStart(2, '0')
    .toUpperCase();
}

/**
 * Builds a hex colour from OKLCH.
 *
 * @param lightness - OKLCH L.
 * @param chroma - OKLCH C.
 * @param hueDegrees - OKLCH H.
 */
export function oklchToHex(
  lightness: number,
  chroma: number,
  hueDegrees: number
): string {
  const hue = (hueDegrees * Math.PI) / 180;
  const a = chroma * Math.cos(hue);
  const b = chroma * Math.sin(hue);

  const l = Math.pow(lightness + 0.3963377774 * a + 0.2158037573 * b, 3);
  const m = Math.pow(lightness - 0.1055613458 * a - 0.0638541728 * b, 3);
  const s = Math.pow(lightness - 0.0894841775 * a - 1.291485548 * b, 3);

  const red = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const green = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const blue = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

  return `#${toHex(linearToSrgb(red))}${toHex(linearToSrgb(green))}${toHex(
    linearToSrgb(blue)
  )}`;
}

/**
 * Pushes a plate hue off the accent so a plate never reads as a link.
 *
 * @param hueDegrees - The hue read from the art.
 * @returns The hue to use, and whether it had to move.
 */
export function guardHue(hueDegrees: number): {
  hue: number;
  guarded: boolean;
} {
  const delta =
    (((hueDegrees - ACCENT_HUE_DEGREES + 180) % 360) + 360) % 360 - 180;

  if (Math.abs(delta) >= MIN_ACCENT_SEPARATION_DEGREES) {
    return { hue: ((hueDegrees % 360) + 360) % 360, guarded: false };
  }

  const direction = delta >= 0 ? 1 : -1;
  const rotated =
    ACCENT_HUE_DEGREES + direction * MIN_ACCENT_SEPARATION_DEGREES;

  return { hue: ((rotated % 360) + 360) % 360, guarded: true };
}

/**
 * The art's chroma-weighted circular mean hue, in OKLCH degrees.
 *
 * Weighting by chroma keeps a small area of saturated colour from being drowned
 * out by a large flat grey one, and the lightness window drops pixels that
 * carry no usable hue at all.
 *
 * @param rgba - Pixel data as returned by `ImageData.data`.
 * @returns The hue, or null when the art is effectively greyscale.
 */
function artHue(rgba: Uint8ClampedArray): number | null {
  let sinSum = 0;
  let cosSum = 0;
  let kept = 0;

  for (let i = 0; i < rgba.length; i += 4) {
    const { lightness, a, b } = rgbToOklab(
      rgba[i] / 255,
      rgba[i + 1] / 255,
      rgba[i + 2] / 255
    );

    if (lightness <= MIN_USABLE_LIGHTNESS || lightness >= MAX_USABLE_LIGHTNESS) {
      continue;
    }

    const chroma = Math.hypot(a, b);
    if (chroma <= MIN_USABLE_CHROMA) continue;

    const hue = Math.atan2(b, a);
    sinSum += Math.sin(hue) * chroma;
    cosSum += Math.cos(hue) * chroma;
    kept += 1;
  }

  if (kept < MIN_USABLE_PIXELS) return null;

  return (((Math.atan2(sinSum, cosSum) * 180) / Math.PI) % 360 + 360) % 360;
}

/**
 * Derives the light and dark ink pair for a world from its art.
 *
 * @param rgba - Pixel data as returned by `ImageData.data`.
 * @returns The ink pair, or null when the art carries no usable hue.
 */
export function deriveWorldInk(rgba: Uint8ClampedArray): WorldInk | null {
  const measured = artHue(rgba);
  if (measured === null) return null;

  const { hue, guarded } = guardHue(measured);

  return {
    light: oklchToHex(INK_LIGHTNESS, INK_CHROMA, hue),
    dark: oklchToHex(INK_LIGHTNESS_DARK, INK_CHROMA_DARK, hue),
    hue,
    guarded,
  };
}
