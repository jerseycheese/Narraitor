/**
 * Interface for select option with description
 */
export interface SelectOptionWithDescription {
  value: string;
  label: string;
  description: string;
}

/**
 * Converts a description object to select options array
 * @param descriptions - Object with key-value pairs of option-description
 * @param labelFormatter - Optional function to format the label
 * @returns Array of select options with descriptions
 */
export function descriptionsToSelectOptions(
  descriptions: Record<string, string>,
  labelFormatter?: (key: string) => string
): SelectOptionWithDescription[] {
  return Object.entries(descriptions).map(([value, description]) => ({
    value,
    label: labelFormatter ? labelFormatter(value) : formatLabel(value),
    description
  }));
}

/**
 * Default label formatter - capitalizes and replaces hyphens with spaces
 */
function formatLabel(key: string): string {
  return key
    .replace(/-/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Creates a type-safe enum checker
 */
export function createEnumChecker<T extends Record<string, unknown>>(
  enumObject: T
): (value: unknown) => value is T[keyof T] {
  const validValues = Object.values(enumObject);
  return (value: unknown): value is T[keyof T] => {
    return validValues.includes(value as T[keyof T]);
  };
}

/**
 * Gets all valid values from an enum-like object
 */
export function getEnumValues<T extends Record<string, unknown>>(
  enumObject: T
): T[keyof T][] {
  return Object.values(enumObject);
}

/**
 * Type guard for string literal types
 */
export function isValidEnumValue<T extends string>(
  value: unknown,
  validValues: readonly T[]
): value is T {
  return typeof value === 'string' && (validValues as readonly string[]).includes(value);
}