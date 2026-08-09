import { GeneratedImage } from '@/types/common.types';
import { getTimestamp } from '@/lib/utils';

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
 * Reads a validated file into a portrait carrying a base64 data URL, which is
 * what the character store persists to IndexedDB.
 */
export function readPortraitFile(file: File): Promise<GeneratedImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    const fail = () =>
      reject(new Error("That image couldn't be read. Try picking it again."));

    reader.onerror = fail;
    reader.onabort = fail;

    reader.onload = () => {
      const url = typeof reader.result === 'string' ? reader.result : null;
      if (!url) {
        reject(new Error("That image couldn't be read. Try picking it again."));
        return;
      }

      // No prompt: that field means "the text this image was generated from",
      // which an uploaded file doesn't have.
      resolve({
        type: 'uploaded',
        url,
        generatedAt: getTimestamp(),
      });
    };

    reader.readAsDataURL(file);
  });
}
