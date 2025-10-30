/**
 * Table utility functions for sorting, filtering, and pagination
 */

export type SortDirection = 'asc' | 'desc';

/**
 * Sort strings alphabetically (case-insensitive)
 */
export function sortByString(
  a: string,
  b: string,
  direction: SortDirection
): number {
  const comparison = a.toLowerCase().localeCompare(b.toLowerCase());
  return direction === 'asc' ? comparison : -comparison;
}

/**
 * Sort numbers
 */
export function sortByNumber(
  a: number,
  b: number,
  direction: SortDirection
): number {
  const comparison = a - b;
  return direction === 'asc' ? comparison : -comparison;
}

/**
 * Sort dates (ISO 8601 strings or Date objects)
 */
export function sortByDate(
  a: string | Date,
  b: string | Date,
  direction: SortDirection
): number {
  const dateA = typeof a === 'string' ? new Date(a) : a;
  const dateB = typeof b === 'string' ? new Date(b) : b;
  const comparison = dateA.getTime() - dateB.getTime();
  return direction === 'asc' ? comparison : -comparison;
}

/**
 * Paginate data array
 * @param data - Full dataset
 * @param page - Current page (1-indexed)
 * @param pageSize - Items per page
 * @returns Slice of data for the current page
 */
export function paginateData<T>(
  data: T[],
  page: number,
  pageSize: number
): T[] {
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  return data.slice(startIndex, endIndex);
}

/**
 * Calculate total pages
 */
export function getTotalPages(totalItems: number, pageSize: number): number {
  return Math.ceil(totalItems / pageSize);
}

/**
 * Filter data by search term across multiple fields
 * @param data - Dataset to filter
 * @param searchTerm - Search string
 * @param searchFields - Fields to search in
 * @returns Filtered dataset
 */
export function filterBySearch<T extends Record<string, any>>(
  data: T[],
  searchTerm: string,
  searchFields: (keyof T)[]
): T[] {
  if (!searchTerm.trim()) {
    return data;
  }

  const lowerSearchTerm = searchTerm.toLowerCase();

  return data.filter((item) =>
    searchFields.some((field) => {
      const value = item[field];
      if (value == null) return false;
      return String(value).toLowerCase().includes(lowerSearchTerm);
    })
  );
}

/**
 * Format date for display in tables
 */
export function formatTableDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Get page range for pagination display
 * @param currentPage - Current page (1-indexed)
 * @param totalPages - Total number of pages
 * @param maxVisible - Maximum number of page buttons to show
 * @returns Array of page numbers to display
 */
export function getPageRange(
  currentPage: number,
  totalPages: number,
  maxVisible: number = 5
): number[] {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const halfVisible = Math.floor(maxVisible / 2);
  let start = Math.max(1, currentPage - halfVisible);
  let end = Math.min(totalPages, start + maxVisible - 1);

  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1);
  }

  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}
