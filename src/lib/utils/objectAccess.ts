/**
 * Utilities for safe nested property access in objects and arrays
 */

/**
 * Safely access nested properties using dot notation or array paths
 * @param obj - The object to access
 * @param path - The property path (dot notation string or array of keys)
 * @param defaultValue - Default value to return if path doesn't exist
 * @returns The value at the path or defaultValue if not found
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
 * @param obj - The object to check
 * @param path - The property path (dot notation string or array of keys)
 * @returns True if the property exists, false otherwise
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
 * @param obj - The object to analyze
 * @param maxDepth - Maximum depth to traverse (optional)
 * @returns Array of all possible paths
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