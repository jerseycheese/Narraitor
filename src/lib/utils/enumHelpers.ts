import { titleCase } from './formatters';

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
  return titleCase(key.replace(/-/g, ' '));
}