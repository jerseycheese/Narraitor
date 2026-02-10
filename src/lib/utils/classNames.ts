import { clsx, type ClassValue } from "clsx"

/**
 * Utility for combining class names
 * - Uses clsx for flexible className combining (strings, objects, arrays)
 * - REPLACES Tailwind-aware 'cn' utility for Clean Slate implementation
 */
export function cssClasses(...inputs: ClassValue[]): string {
  return clsx(inputs)
}