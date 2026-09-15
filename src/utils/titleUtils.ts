/**
 * Utility to generate non-repeating page titles for detail views.
 * Prevents the pattern of "World Name - World Name" in breadcrumbs and headings.
 */

interface TitleParts {
  entityName: string;
  entityType: string;
  parentName?: string;
  action?: string;
}

/**
 * Generates a clean, non-redundant page title.
 *
 * Examples:
 * - { entityName: "Rivendell", entityType: "world" } → "Rivendell"
 * - { entityName: "Aragorn", entityType: "character", parentName: "Middle Earth" } → "Aragorn - Middle Earth"
 * - { entityName: "Rivendell", entityType: "world", action: "edit" } → "Edit Rivendell"
 */
export function generateDetailTitle({ entityName, entityType, parentName, action }: TitleParts): string {
  // If there's an action, prefix with it
  if (action) {
    const actionLabel = action.charAt(0).toUpperCase() + action.slice(1);
    return parentName ? `${actionLabel} ${entityName} - ${parentName}` : `${actionLabel} ${entityName}`;
  }

  // If there's a parent, include it for context
  if (parentName && parentName !== entityName) {
    return `${entityName} - ${parentName}`;
  }

  // Otherwise just the entity name (avoiding "Name - Name" pattern)
  return entityName;
}

/**
 * Generates breadcrumb items without duplication.
 */
export function generateBreadcrumbs(parts: TitleParts): Array<{ label: string; href?: string }> {
  const crumbs: Array<{ label: string; href?: string }> = [];

  if (parts.parentName) {
    crumbs.push({ label: parts.parentName, href: `/${parts.entityType}s` });
  }

  // Only add entity if it's different from parent
  if (parts.entityName !== parts.parentName) {
    crumbs.push({ label: parts.entityName });
  }

  if (parts.action) {
    crumbs.push({ label: parts.action.charAt(0).toUpperCase() + parts.action.slice(1) });
  }

  return crumbs;
}
