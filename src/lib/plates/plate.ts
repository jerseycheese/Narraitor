/**
 * Turns world art into an ink-treatment plate.
 *
 * The plate is normalised GREYSCALE. The theme supplies its two colours, so one
 * plate serves light and dark: light maps it between the world's ink and paper,
 * dark between the page and the world's light ink. That is why nothing here
 * knows about colour.
 *
 * Canvas is used only to decode and encode. The transform itself lives in
 * `tone.ts` and `screen.ts` as pure functions, because jsdom has no canvas and
 * an untestable transform is how the tone bugs got in.
 */
import { deriveWorldInk, type WorldInk } from './ink';
import { halftone } from './screen';
import { normaliseTone, toLuminance } from './tone';

/**
 * Screen pitch, in CSS pixels of the final display size.
 *
 * Chosen off a rendered ladder at 4 / 3 / 2.5 / 2px. Coarser than this and the
 * screen eats the subject: at 4px a 346px-wide band gets only ~87 cells across.
 */
const SCREEN_PITCH_CSS_PX = 2;

/**
 * Smallest reproduction that gets screened, in CSS pixels squared.
 *
 * The threshold is an AREA, not a height. A 346x176 band gets about 15,200
 * cells at this pitch and reads as print; a 176px SQUARE gets 7,700 and stays
 * soft, losing gate posts and far detail. Measured on a square ladder, detail
 * returns around 14,000 cells — about 240x240.
 */
const SCREEN_MIN_AREA_CSS_PX2 = 56_000;

/**
 * Long side, in pixels, of the sample the ink hue is read from.
 *
 * The ink belongs to the world, not to the frame, so it is read from the whole
 * art at one fixed size. Reading it from the cropped plate let the same world
 * land on a slightly different ink per surface and per viewport.
 */
const INK_SAMPLE_PX = 64;

/** Contrast applied after the median move, per treatment. */
const SCREENED_GAIN = 1.1;
const CONTINUOUS_GAIN = 1.06;

export interface Plate {
  /** The greyscale plate, as a data URL. */
  source: string;
  /** The ink derived from the same art, or null when it carries no usable hue. */
  ink: WorldInk | null;
}

export interface PlateBox {
  /** Display width in CSS pixels. */
  width: number;
  /** Display height in CSS pixels. */
  height: number;
  /** Device pixel ratio to render at. */
  dpr?: number;
}

/**
 * Whether a reproduction of this size gets the screen.
 *
 * @param width - Display width in CSS pixels.
 * @param height - Display height in CSS pixels.
 */
function shouldScreen(width: number, height: number): boolean {
  return width * height >= SCREEN_MIN_AREA_CSS_PX2;
}

/**
 * Reads the world's ink from the whole art, uncropped, at a fixed size.
 *
 * @returns The ink, or null when the art carries no usable hue or the canvas
 * cannot be read back.
 */
function sampleInk(image: HTMLImageElement): WorldInk | null {
  const scale = INK_SAMPLE_PX / Math.max(image.naturalWidth, image.naturalHeight);
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) return null;

  context.drawImage(image, 0, 0, width, height);

  try {
    return deriveWorldInk(context.getImageData(0, 0, width, height).data);
  } catch {
    return null;
  }
}

function loadImage(source: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = source;
  });
}

/**
 * Renders a greyscale plate from world art.
 *
 * Returns null when there is nothing to draw on (server render, jsdom) or the
 * browser cannot decode the source, so callers fall back to the art itself
 * rather than showing a gap — the same shape `downscalePortraitDataUrl` uses.
 *
 * The ink is read from the same decode, but from the whole art rather than the
 * cropped plate, so every surface showing a world agrees on its ink.
 *
 * @param source - The art, as a URL or data URL.
 * @param box - Where the plate will be displayed.
 */
export async function toPlate(
  source: string,
  { width, height, dpr = 2 }: PlateBox
): Promise<Plate | null> {
  if (!source || width <= 0 || height <= 0) return null;

  const canvas = document.createElement('canvas');

  // `getContext` is absent in jsdom and can be null when the browser refuses
  // another context; either way there is no plate to make.
  let context: CanvasRenderingContext2D | null = null;
  try {
    context = canvas.getContext ? canvas.getContext('2d') : null;
  } catch {
    return null;
  }
  if (!context) return null;

  const image = await loadImage(source);
  if (!image || !image.naturalWidth || !image.naturalHeight) return null;

  const pixelWidth = Math.max(1, Math.round(width * dpr));
  const pixelHeight = Math.max(1, Math.round(height * dpr));
  canvas.width = pixelWidth;
  canvas.height = pixelHeight;

  // Cover, not contain: the plate fills its frame the way the band and a
  // thumbnail both do.
  const scale = Math.max(
    pixelWidth / image.naturalWidth,
    pixelHeight / image.naturalHeight
  );
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;

  context.drawImage(
    image,
    (pixelWidth - drawWidth) / 2,
    (pixelHeight - drawHeight) / 2,
    drawWidth,
    drawHeight
  );

  let pixels: ImageData;
  try {
    pixels = context.getImageData(0, 0, pixelWidth, pixelHeight);
  } catch {
    // A cross-origin source taints the canvas and makes it unreadable.
    return null;
  }

  const ink = sampleInk(image);

  const screened = shouldScreen(width, height);
  const tone = normaliseTone(toLuminance(pixels.data), {
    gain: screened ? SCREENED_GAIN : CONTINUOUS_GAIN,
  });

  const plate = screened
    ? halftone(tone, {
        width: pixelWidth,
        height: pixelHeight,
        cell: SCREEN_PITCH_CSS_PX * dpr,
      })
    : tone;

  for (let i = 0, p = 0; p < plate.length; i += 4, p += 1) {
    const value = Math.round(plate[p] * 255);
    pixels.data[i] = value;
    pixels.data[i + 1] = value;
    pixels.data[i + 2] = value;
    pixels.data[i + 3] = 255;
  }

  context.putImageData(pixels, 0, 0);

  return { source: canvas.toDataURL('image/png'), ink };
}
