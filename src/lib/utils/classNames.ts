/**
 * Utility for combining class names
 * Filters out falsy values and joins the rest
 */
export function cn(...inputs: (string | undefined | null | boolean)[]): string {
  return inputs
    .filter((input): input is string => typeof input === 'string' && input.length > 0)
    .join(' ');
}

/**
 * Alternative implementation using clsx pattern
 * Supports objects and arrays
 */
export function clsx(...inputs: ClassValue[]): string {
  return inputs
    .map((input) => {
      if (!input) return '';
      
      if (typeof input === 'string') return input;
      
      if (Array.isArray(input)) {
        return clsx(...input);
      }
      
      if (typeof input === 'object') {
        return Object.entries(input)
          .filter(([, value]) => value)
          .map(([key]) => key)
          .join(' ');
      }
      
      return '';
    })
    .filter(Boolean)
    .join(' ');
}

type ClassValue = string | number | null | undefined | ClassValue[] | { [key: string]: unknown };
