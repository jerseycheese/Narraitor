import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Enhanced utility for combining class names with Tailwind CSS support
 * - Uses clsx for flexible className combining (strings, objects, arrays)
 * - Uses twMerge for intelligent Tailwind class deduplication and merging
 * - Handles conflicting Tailwind classes (e.g., "bg-red-500 bg-blue-500" → "bg-blue-500")
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/**
 * Legacy clsx implementation for backwards compatibility
 * Use cn() instead for better Tailwind support
 * @deprecated Use cn() instead
 */
export { clsx }
