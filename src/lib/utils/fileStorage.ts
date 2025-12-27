/**
 * File storage utilities for saving generated images
 *
 * Handles converting base64 data to actual image files and returning URLs.
 * Images are saved to the public directory for easy serving.
 */

import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import Logger from './logger';

const logger = new Logger('FileStorage');

export interface SaveImageOptions {
  /**
   * Category/type of image (e.g., 'worlds', 'characters', 'portraits')
   */
  category: 'worlds' | 'characters' | 'portraits' | 'items' | 'endings';

  /**
   * Unique identifier for the entity (e.g., world ID, character ID)
   */
  entityId: string;

  /**
   * MIME type of the image (e.g., 'image/png', 'image/jpeg')
   */
  mimeType: string;

  /**
   * Base64 encoded image data (without the data URI prefix)
   */
  base64Data: string;
}

export interface SaveImageResult {
  /**
   * Public URL path to access the saved image
   * Format: /uploads/{category}/{entityId}.{ext}
   */
  url: string;

  /**
   * Absolute file system path where the image was saved
   */
  filePath: string;

  /**
   * File size in bytes
   */
  fileSize: number;
}

/**
 * Get file extension from MIME type
 */
function getExtensionFromMimeType(mimeType: string): string {
  const mimeMap: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/svg+xml': 'svg',
  };

  return mimeMap[mimeType.toLowerCase()] || 'png';
}

/**
 * Save a base64 encoded image to the file system
 *
 * @param options - Configuration for saving the image
 * @returns Information about the saved file
 * @throws Error if save fails
 */
export async function saveBase64Image(options: SaveImageOptions): Promise<SaveImageResult> {
  const { category, entityId, mimeType, base64Data } = options;

  try {
    // Get file extension from MIME type
    const extension = getExtensionFromMimeType(mimeType);

    // Create filename: entityId.ext (e.g., world-123.png)
    const filename = `${entityId}.${extension}`;

    // Define directory path: public/uploads/{category}
    const uploadDir = join(process.cwd(), 'public', 'uploads', category);

    // Create directory if it doesn't exist
    if (!existsSync(uploadDir)) {
      logger.debug('saveBase64Image', `Creating directory: ${uploadDir}`);
      await mkdir(uploadDir, { recursive: true });
    }

    // Full file path
    const filePath = join(uploadDir, filename);

    // Convert base64 to buffer
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // Save file
    logger.debug('saveBase64Image', `Saving image to: ${filePath} (${imageBuffer.length} bytes)`);
    await writeFile(filePath, imageBuffer);

    // Generate public URL (relative to public directory)
    const publicUrl = `/uploads/${category}/${filename}`;

    logger.info('saveBase64Image', `Image saved successfully: ${publicUrl}`);

    return {
      url: publicUrl,
      filePath,
      fileSize: imageBuffer.length,
    };

  } catch (error) {
    logger.error('saveBase64Image', 'Failed to save image:', error);
    throw new Error(`Failed to save image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Delete an image file
 *
 * @param url - Public URL of the image to delete (e.g., /uploads/worlds/world-123.png)
 * @returns true if deleted, false if file didn't exist
 */
export async function deleteImage(url: string): Promise<boolean> {
  try {
    // Convert public URL to file path
    const relativePath = url.startsWith('/') ? url.slice(1) : url;
    const filePath = join(process.cwd(), 'public', relativePath);

    if (!existsSync(filePath)) {
      logger.warn('deleteImage', `File does not exist: ${filePath}`);
      return false;
    }

    const { unlink } = await import('fs/promises');
    await unlink(filePath);

    logger.info('deleteImage', `Image deleted: ${url}`);
    return true;

  } catch (error) {
    logger.error('deleteImage', 'Failed to delete image:', error);
    throw new Error(`Failed to delete image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
