/**
 * File storage utilities for saving generated images
 *
 * Handles converting base64 data to actual image files and returning URLs.
 * Images are saved to the public directory for easy serving.
 */

import { writeFile, mkdir } from 'fs/promises';
import { join, resolve } from 'path';
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
 * Sanitize entity ID to prevent path traversal attacks
 * Only allows alphanumeric characters, hyphens, and underscores
 */
function sanitizeEntityId(entityId: string): string {
  // Remove any path separators and only keep safe characters
  const sanitized = entityId.replace(/[^a-zA-Z0-9_-]/g, '');

  if (sanitized.length === 0) {
    throw new Error('Invalid entity ID: must contain at least one alphanumeric character');
  }

  return sanitized;
}

/**
 * Validate category is one of the allowed values
 */
function validateCategory(category: string): asserts category is SaveImageOptions['category'] {
  const validCategories: Array<SaveImageOptions['category']> = ['worlds', 'characters', 'portraits', 'items', 'endings'];

  if (!validCategories.includes(category as SaveImageOptions['category'])) {
    throw new Error(`Invalid category: must be one of ${validCategories.join(', ')}`);
  }
}

/**
 * Validate and get file extension from MIME type
 * Only allows whitelisted image MIME types
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

  const extension = mimeMap[mimeType.toLowerCase()];

  if (!extension) {
    throw new Error(`Invalid MIME type: ${mimeType}. Only image types are allowed.`);
  }

  return extension;
}

/**
 * Validate that the final file path is within the allowed directory
 * Prevents path traversal even if sanitization is bypassed
 * @returns The validated absolute file path
 */
function validatePathWithinDirectory(filePath: string, allowedDirectory: string): string {
  // Resolve to absolute paths
  const absoluteFilePath = resolve(filePath);
  const absoluteAllowedDir = resolve(allowedDirectory);

  // Check if the file path starts with the allowed directory
  if (!absoluteFilePath.startsWith(absoluteAllowedDir + '/') && absoluteFilePath !== absoluteAllowedDir) {
    throw new Error('Path traversal detected: file path is outside allowed directory');
  }

  // Return the validated absolute path
  return absoluteFilePath;
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
    // Validate and sanitize inputs to prevent path traversal
    validateCategory(category);
    const safeEntityId = sanitizeEntityId(entityId);

    // Get file extension from MIME type
    const extension = getExtensionFromMimeType(mimeType);

    // Create filename: entityId.ext (e.g., world-123.png)
    const filename = `${safeEntityId}.${extension}`;

    // Define directory path: public/uploads/{category}
    const uploadDir = join(process.cwd(), 'public', 'uploads', category);

    // Create directory if it doesn't exist
    if (!existsSync(uploadDir)) {
      logger.debug('saveBase64Image', `Creating directory: ${uploadDir}`);
      await mkdir(uploadDir, { recursive: true });
    }

    // Full file path
    const filePath = join(uploadDir, filename);

    // Final security check: ensure path is within allowed directory and get validated absolute path
    const validatedPath = validatePathWithinDirectory(filePath, uploadDir);

    // Convert base64 to buffer (validated user data, safe to write)
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // Save file to validated path
    logger.debug('saveBase64Image', `Saving image to: ${validatedPath} (${imageBuffer.length} bytes)`);
    // lgtm[js/path-injection]
    // CodeQL: Path is validated through defense-in-depth:
    // 1. entityId sanitized (alphanumeric + hyphens/underscores only)
    // 2. category validated against whitelist
    // 3. MIME type validated against whitelist
    // 4. Path constructed using safe join()
    // 5. Final absolute path validated to be within allowed directory
    await writeFile(validatedPath, imageBuffer);

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
    // Validate URL format and prevent path traversal
    if (!url.startsWith('/uploads/')) {
      throw new Error('Invalid image URL: must start with /uploads/');
    }

    // Extract and validate category and filename
    const urlParts = url.split('/');
    if (urlParts.length !== 4) {
      throw new Error('Invalid image URL format: expected /uploads/{category}/{filename}');
    }

    const category = urlParts[2];
    const filename = urlParts[3];

    // Validate category
    validateCategory(category);

    // Sanitize filename (should be in format: entityId.ext)
    const filenameParts = filename.split('.');
    if (filenameParts.length !== 2) {
      throw new Error('Invalid filename format: expected {entityId}.{ext}');
    }

    const safeEntityId = sanitizeEntityId(filenameParts[0]);
    const extension = filenameParts[1];

    // Reconstruct safe path
    const safeFilename = `${safeEntityId}.${extension}`;
    const uploadsDir = join(process.cwd(), 'public', 'uploads', category);
    const filePath = join(uploadsDir, safeFilename);

    // Final security check: ensure path is within allowed directory and get validated absolute path
    const validatedPath = validatePathWithinDirectory(filePath, uploadsDir);

    if (!existsSync(validatedPath)) {
      logger.warn('deleteImage', `File does not exist: ${validatedPath}`);
      return false;
    }

    const { unlink } = await import('fs/promises');
    // lgtm[js/path-injection]
    // CodeQL: Path is validated through defense-in-depth (same as saveBase64Image)
    await unlink(validatedPath);

    logger.info('deleteImage', `Image deleted: ${url}`);
    return true;

  } catch (error) {
    logger.error('deleteImage', 'Failed to delete image:', error);
    throw new Error(`Failed to delete image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
