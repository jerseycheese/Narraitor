import { WorldAttribute, WorldSkill, World } from '@/types/world.types';
import { EntityID } from '@/types/common.types';

export interface AttributeValidationResult {
  canDelete: boolean;
  warnings: string[];
  linkedSkills: WorldSkill[];
}

/**
 * Validates an attribute for deletion, checking for dependencies
 */
export function validateAttributeDeletion(
  attributeId: EntityID,
  world: World
): AttributeValidationResult {
  const result: AttributeValidationResult = {
    canDelete: true,
    warnings: [],
    linkedSkills: [],
  };

  if (!world.skills) {
    return result;
  }

  // Find all skills linked to this attribute
  const linkedSkills = Object.values(world.skills).filter(
    (skill) => skill.attributeIds?.includes(attributeId)
  );

  if (linkedSkills.length > 0) {
    result.linkedSkills = linkedSkills;
    result.warnings.push(
      `This attribute is linked to ${linkedSkills.length} skill${
        linkedSkills.length > 1 ? 's' : ''
      }`
    );
    result.warnings.push(
      'Deleting this attribute will remove these skills from the world configuration'
    );
  }

  return result;
}

/**
 * Validates attribute data for creation or update
 */
export function validateAttributeData(
  attribute: Partial<WorldAttribute>,
  existingAttributes: Record<EntityID, WorldAttribute>,
  currentAttributeId?: EntityID
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Required fields
  if (!attribute.name?.trim()) {
    errors.push('Attribute name is required');
  }

  // Duplicate name check (excluding current attribute in edit mode)
  if (attribute.name) {
    const isDuplicate = Object.values(existingAttributes).some(
      (existing) =>
        existing.name.toLowerCase() === attribute.name!.toLowerCase() &&
        existing.id !== currentAttributeId
    );
    if (isDuplicate) {
      errors.push('An attribute with this name already exists');
    }
  }

  // Range validation
  if (
    attribute.minValue !== undefined &&
    attribute.maxValue !== undefined &&
    attribute.minValue >= attribute.maxValue
  ) {
    errors.push('Maximum value must be greater than minimum value');
  }

  // Range bounds
  if (attribute.minValue !== undefined && attribute.minValue < -999) {
    errors.push('Minimum value cannot be less than -999');
  }
  if (attribute.maxValue !== undefined && attribute.maxValue > 999) {
    errors.push('Maximum value cannot be greater than 999');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitizes attribute data before saving
 */
export function sanitizeAttributeData(
  attribute: Partial<WorldAttribute>
): Partial<WorldAttribute> {
  return {
    ...attribute,
    name: attribute.name?.trim() || '',
    description: attribute.description?.trim() || '',
    minValue: attribute.minValue ?? 1,
    maxValue: attribute.maxValue ?? 10,
  };
}
