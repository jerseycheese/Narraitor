import { GeneratedImage } from '@/types/common.types';

export const MAX_PORTRAIT_UPLOAD_BYTES = 5 * 1024 * 1024;

export const ACCEPTED_PORTRAIT_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

/** The accept attribute is a file-picker hint only — validation still runs on the picked file. */
export const PORTRAIT_UPLOAD_ACCEPT = ACCEPTED_PORTRAIT_MIME_TYPES.join(',');

/**
 * Returns a player-facing error message, or null when the file is usable.
 */
export function validatePortraitFile(file: File): string | null {
  if (!(ACCEPTED_PORTRAIT_MIME_TYPES as readonly string[]).includes(file.type)) {
    return 'That file type is not supported. Pick a JPG, PNG or WebP image.';
  }

  if (file.size > MAX_PORTRAIT_UPLOAD_BYTES) {
    return 'That image is larger than 5MB. Pick a smaller file or resize it first.';
  }

  return null;
}

/**
 * Longest edge we keep. The largest portrait surface renders at 16rem, so 512
 * still covers a 2x display, and it keeps a 5MB upload from becoming a ~6.7MB
 * base64 string — which would blow the ~5MB localStorage quota the character
 * creation autosave writes to, and bloat every IndexedDB write after that.
 */
export const MAX_PORTRAIT_EDGE_PX = 512;

const DOWNSCALED_PORTRAIT_QUALITY = 0.85;

const READ_FAILURE_MESSAGE =
  "That image couldn't be read. Try picking it again.";

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const fail = () => reject(new Error(READ_FAILURE_MESSAGE));

    reader.onerror = fail;
    reader.onabort = fail;
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }
      fail();
    };

    reader.readAsDataURL(file);
  });
}

function loadImage(dataUrl: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = dataUrl;
  });
}

/**
 * Shrinks the image to MAX_PORTRAIT_EDGE_PX on its longest edge. Returns the
 * original data URL untouched when there's no 2D canvas to draw on (server
 * render, jsdom) or the browser can't decode what was picked.
 */
export async function downscalePortraitDataUrl(
  dataUrl: string
): Promise<string> {
  const canvas = document.createElement('canvas');

  let context: CanvasRenderingContext2D | null = null;
  try {
    context = canvas.getContext('2d');
  } catch {
    context = null;
  }
  if (!context) return dataUrl;

  const image = await loadImage(dataUrl);
  if (!image?.width || !image.height) return dataUrl;

  const scale = Math.min(
    1,
    MAX_PORTRAIT_EDGE_PX / Math.max(image.width, image.height)
  );
  canvas.width = Math.round(image.width * scale);
  canvas.height = Math.round(image.height * scale);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const encoded = canvas.toDataURL('image/webp', DOWNSCALED_PORTRAIT_QUALITY);
  return encoded.startsWith('data:image/webp') ? encoded : dataUrl;
}

/**
 * Reads a validated file into a portrait carrying a base64 data URL, which is
 * what the character store persists to IndexedDB.
 */
export async function readPortraitFile(file: File): Promise<GeneratedImage> {
  const original = await readAsDataUrl(file);

  // No prompt or generatedAt: both describe an AI generation, and the editor
  // renders generatedAt as "Generated: <date>" — untrue of a file the player
  // picked off disk.
  return {
    type: 'uploaded',
    url: await downscalePortraitDataUrl(original),
  };
}
