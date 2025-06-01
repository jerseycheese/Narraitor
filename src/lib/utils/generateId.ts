import { EntityID } from '../../types';

/**
 * Generates a unique identifier (UUID v4) with an optional prefix.
 * Uses the Web Crypto API's `randomUUID` for generation.
 * @param prefix - An optional string to prepend to the UUID. If provided and not empty, it will be followed by an underscore and the UUID.
 * @returns A unique identifier string of type EntityID.
 */
export function generateUniqueId(prefix?: string): EntityID {
  const uuid = crypto.randomUUID();
  if (prefix && prefix.length > 0) {
    return `${prefix}_${uuid}`;
  }
  return uuid;
}