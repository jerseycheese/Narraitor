/**
 * Utilities for safe nested property access in objects and arrays
 * 
 * This module provides type-safe utilities for accessing deeply nested properties
 * in JavaScript objects and arrays without throwing errors. Perfect for developer
 * tools, debugging, and working with complex data structures.
 * 
 * @example
 * ```typescript
 * import { getNestedValue, hasNestedProperty, getNestedPaths } from '@/lib/utils';
 * 
 * const data = {
 *   user: { profile: { name: 'John' } },
 *   items: [{ title: 'First' }, { title: 'Second' }]
 * };
 * 
 * // Safe property access with default values
 * const name = getNestedValue(data, 'user.profile.name', 'Unknown'); // 'John'
 * const missing = getNestedValue(data, 'user.age', 25); // 25
 * 
 * // Array access
 * const firstTitle = getNestedValue(data, 'items[0].title', 'No title'); // 'First'
 * 
 * // Check if properties exist
 * const hasName = hasNestedProperty(data, 'user.profile.name'); // true
 * const hasAge = hasNestedProperty(data, 'user.age'); // false
 * 
 * // Discover all available paths (useful for debugging)
 * const paths = getNestedPaths(data); 
 * // ['user', 'user.profile', 'user.profile.name', 'items', 'items[0]', 'items[0].title', ...]
 * ```
 */

/**
 * Safely access nested properties using dot notation or array paths
 * 
 * This function will never throw an error - it returns the default value
 * for any invalid paths, null/undefined objects, or missing properties.
 * 
 * @param obj - The object to access (can be any type including null/undefined)
 * @param path - The property path as dot notation string ('user.name') or array (['user', 'name'])
 * @param defaultValue - Default value to return if path doesn't exist or is invalid
 * @returns The value at the path, or defaultValue if not found
 * 
 * @example
 * ```typescript
 * const data = { user: { profile: { name: 'John' } } };
 * 
 * // Basic usage
 * getNestedValue(data, 'user.profile.name'); // 'John'
 * getNestedValue(data, 'user.age', 25); // 25 (default)
 * 
 * // Array notation
 * getNestedValue(data, ['user', 'profile', 'name']); // 'John'
 * 
 * // Array access
 * getNestedValue({ items: [1, 2, 3] }, 'items[1]'); // 2
 * 
 * // Safe with null/undefined
 * getNestedValue(null, 'any.path', 'safe'); // 'safe'
 * ```
 */
export function getNestedValue<T = unknown>(
  obj: unknown,
  path: string | (string | number)[],
  defaultValue?: T
): T | undefined {
  if (obj === null || obj === undefined) {
    return defaultValue;
  }

  // Handle empty path
  if (path === '' || (Array.isArray(path) && path.length === 0)) {
    return Array.isArray(path) && path.length === 0 ? (obj as T) : defaultValue;
  }

  let keys: (string | number)[];
  
  if (typeof path === 'string') {
    // Parse string path to handle dot notation and bracket notation
    keys = parsePath(path);
  } else {
    keys = path;
  }

  if (keys.length === 0) {
    return defaultValue;
  }

  let current: unknown = obj;

  for (const key of keys) {
    if (current === null || current === undefined) {
      return defaultValue;
    }

    // Handle array access
    if (Array.isArray(current) && typeof key === 'number') {
      if (key < 0 || key >= current.length) {
        return defaultValue;
      }
      current = current[key];
    } else if (typeof current === 'object' && current !== null && key in current) {
      current = (current as Record<string | number, unknown>)[key];
    } else {
      return defaultValue;
    }
  }

  return current as T;
}

/**
 * Check if a nested property exists in an object
 * 
 * This function checks for property existence without accessing the value.
 * It distinguishes between properties that exist with falsy values (null, false, 0, '')
 * and properties that don't exist at all.
 * 
 * @param obj - The object to check (can be any type including null/undefined)
 * @param path - The property path as dot notation string ('user.name') or array (['user', 'name'])
 * @returns True if the property exists (even with falsy values), false if it doesn't exist
 * 
 * @example
 * ```typescript
 * const data = { 
 *   user: { name: 'John', age: null, active: false },
 *   items: [1, 2, 3]
 * };
 * 
 * // Property existence
 * hasNestedProperty(data, 'user.name'); // true
 * hasNestedProperty(data, 'user.email'); // false
 * 
 * // Distinguishes falsy values from non-existence
 * hasNestedProperty(data, 'user.age'); // true (exists but null)
 * hasNestedProperty(data, 'user.active'); // true (exists but false)
 * hasNestedProperty(data, 'user.missing'); // false (doesn't exist)
 * 
 * // Array access
 * hasNestedProperty(data, 'items[1]'); // true
 * hasNestedProperty(data, 'items[10]'); // false
 * ```
 */
export function hasNestedProperty(
  obj: unknown,
  path: string | (string | number)[]
): boolean {
  if (obj === null || obj === undefined) {
    return false;
  }

  // Handle empty path
  if (path === '' || (Array.isArray(path) && path.length === 0)) {
    return Array.isArray(path) && path.length === 0;
  }

  let keys: (string | number)[];
  
  if (typeof path === 'string') {
    keys = parsePath(path);
  } else {
    keys = path;
  }

  if (keys.length === 0) {
    return false;
  }

  let current: unknown = obj;

  for (const key of keys) {
    if (current === null || current === undefined) {
      return false;
    }

    // Handle array access
    if (Array.isArray(current) && typeof key === 'number') {
      if (key < 0 || key >= current.length) {
        return false;
      }
      current = current[key];
    } else if (typeof current === 'object' && current !== null && key in current) {
      current = (current as Record<string | number, unknown>)[key];
    } else {
      return false;
    }
  }

  return true;
}

/**
 * Extract all available paths from an object (useful for debugging)
 * 
 * This function discovers all possible property paths in an object, including
 * nested objects and array indices. Very useful for debugging complex data
 * structures or building developer tools.
 * 
 * @param obj - The object to analyze (can be any type including null/undefined)
 * @param maxDepth - Maximum depth to traverse (optional, useful for large objects)
 * @returns Array of all possible paths sorted alphabetically
 * 
 * @example
 * ```typescript
 * const data = {
 *   user: { name: 'John', settings: { theme: 'dark' } },
 *   items: [{ id: 1, active: true }, { id: 2, active: false }]
 * };
 * 
 * // Get all paths
 * const paths = getNestedPaths(data);
 * // Result: [
 * //   'items',
 * //   'items[0]',
 * //   'items[0].active',
 * //   'items[0].id',
 * //   'items[1]',
 * //   'items[1].active',
 * //   'items[1].id',
 * //   'user',
 * //   'user.name',
 * //   'user.settings',
 * //   'user.settings.theme'
 * // ]
 * 
 * // Limit depth for performance
 * const shallowPaths = getNestedPaths(data, 2);
 * // Result: ['items', 'items[0]', 'items[1]', 'user', 'user.name', 'user.settings']
 * ```
 */
export function getNestedPaths(
  obj: unknown,
  maxDepth?: number
): string[] {
  if (obj === null || obj === undefined) {
    return [];
  }

  if (maxDepth !== undefined && maxDepth <= 0) {
    return [];
  }

  const paths: string[] = [];
  const visited = new WeakSet();

  function traverse(current: unknown, path: string, depth: number) {
    // Prevent infinite loops with circular references
    if (typeof current === 'object' && current !== null) {
      if (visited.has(current)) {
        return;
      }
      visited.add(current);
    }

    // Check max depth
    if (maxDepth !== undefined && depth >= maxDepth) {
      return;
    }

    if (Array.isArray(current)) {
      current.forEach((item, index) => {
        const itemPath = path ? `${path}[${index}]` : `[${index}]`;
        paths.push(itemPath);
        traverse(item, itemPath, depth + 1);
      });
    } else if (typeof current === 'object' && current !== null) {
      const currentObj = current as Record<string, unknown>;
      Object.keys(currentObj).forEach(key => {
        const keyPath = path ? `${path}.${key}` : key;
        paths.push(keyPath);
        traverse(currentObj[key], keyPath, depth + 1);
      });
    }
  }

  traverse(obj, '', 0);
  return paths.sort();
}

/**
 * Parse a string path into an array of keys, handling dot notation and bracket notation
 * @param path - The path string to parse
 * @returns Array of keys
 */
function parsePath(path: string): (string | number)[] {
  if (!path || typeof path !== 'string') {
    return [];
  }

  const keys: (string | number)[] = [];
  let current = '';
  let inBrackets = false;
  let i = 0;

  while (i < path.length) {
    const char = path[i];

    if (char === '[') {
      if (current) {
        keys.push(current);
        current = '';
      }
      inBrackets = true;
    } else if (char === ']') {
      if (inBrackets && current) {
        // Try to parse as number for array access
        const num = parseInt(current, 10);
        keys.push(isNaN(num) ? current : num);
        current = '';
      }
      inBrackets = false;
    } else if (char === '.' && !inBrackets) {
      if (current) {
        keys.push(current);
        current = '';
      }
    } else if (char !== '.' || inBrackets) {
      current += char;
    }

    i++;
  }

  if (current) {
    keys.push(current);
  }

  // Filter out empty strings that might result from malformed paths like 'a..b' or '.a'
  const filteredKeys = keys.filter(key => key !== '');
  
  // If the original path had malformed syntax (consecutive dots, trailing dots, etc.)
  // and we filtered out keys, treat this as an invalid path
  if (path.includes('..') || path.startsWith('.') || path.endsWith('.')) {
    return [];
  }
  
  return filteredKeys;
}