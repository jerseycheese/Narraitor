/**
 * File storage utilities for saving generated images
 *
 * Handles converting base64 data to actual image files and returning URLs.
 * Images are saved to the public directory for easy serving.
 */

import { join, resolve } from 'path';
import { existsSync } from 'fs';
import Logger from './logger';

const logger = new Logger('FileStorage');

interface SaveImageOptions {
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
    // Path is validated through defense-in-depth: category whitelist, entity ID sanitization, path boundary check
    // codeql[js/path-injection]
    await unlink(validatedPath);

    logger.info('deleteImage', `Image deleted: ${url}`);
    return true;

  } catch (error) {
    logger.error('deleteImage', 'Failed to delete image:', error);
    throw new Error(`Failed to delete image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
