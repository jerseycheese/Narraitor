import React, { useState, useEffect } from 'react';
import { WorldSkill, WorldAttribute } from '@/types/world.types';
import { EntityID } from '@/types/common.types';
import { generateUniqueId } from '@/lib/utils/generateId';
// SkillDifficulty type used in WorldSkill interface
import { DEFAULT_SKILL_DIFFICULTY } from '@/lib/constants/skillDifficultyLevels';
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export interface SkillEditorProps {
  worldId: EntityID;
  mode: 'create' | 'edit';
  skillId?: EntityID;
  onSave: (skill: WorldSkill) => void;
  onDelete?: (skillId: EntityID) => void;
  onCancel: () => void;
  existingSkills?: WorldSkill[];
  existingAttributes: WorldAttribute[];
  maxSkills?: number;
}

/**
 * SkillEditor - Create and edit skills with multi-attribute linking capabilities
 * 
 * This component implements the multi-attribute skill linking system.
 * Skills can now be linked to multiple attributes using a checkbox interface
 * instead of the previous single-attribute dropdown.
 * 
 * Features:
 * - Create/Edit mode support
 * - Multi-attribute selection via checkboxes
 * - Form validation with user-friendly error messages
 * - Delete confirmation dialog
 * - Duplicate name prevention
 * - Skill count limits enforcement
 * 
 * Data Format:
 * - Uses `attributeIds: EntityID[]` for multi-attribute linking
 * - Replaces deprecated `linkedAttributeId: EntityID` single-attribute format
 * 
 * @param worldId - ID of the world this skill belongs to
 * @param mode - 'create' for new skills, 'edit' for existing skills
 * @param skillId - Required when mode is 'edit'
 * @param onSave - Callback when skill is saved successfully
 * @param onDelete - Optional callback when skill is deleted
 * @param onCancel - Callback when operation is cancelled
 * @param existingSkills - Array of existing skills for validation
 * @param existingAttributes - Array of attributes available for linking
 * @param maxSkills - Optional limit on total number of skills
 */
export function SkillEditor({
  worldId,
  mode,
  skillId,
  onSave,
  onDelete,
  onCancel,
  existingSkills = [],
  existingAttributes,
  maxSkills,
}: SkillEditorProps) {
  const [formData, setFormData] = useState<Partial<WorldSkill>>({
    name: '',
    description: '',
    attributeIds: [],
    difficulty: DEFAULT_SKILL_DIFFICULTY,
    baseValue: 5,
    minValue: 1,
    maxValue: 10,
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Load existing skill data in edit mode
  useEffect(() => {
    if (mode === 'edit' && skillId) {
      const existingSkill = existingSkills.find(skill => skill.id === skillId);
      if (existingSkill) {
        setFormData({
          ...existingSkill,
          attributeIds: existingSkill.attributeIds || [],
        });
      }
    }
  }, [mode, skillId, existingSkills]);

  // Clear errors when form data changes
  useEffect(() => {
    if (errors.length > 0) {
      const newErrors = validateForm();
      setErrors(newErrors);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.name, formData.description, formData.attributeIds, errors.length, existingSkills, mode, skillId]);

  const validateForm = (): string[] => {
    const validationErrors: string[] = [];
    const trimmedName = formData.name?.trim() || '';
    const trimmedDescription = formData.description?.trim() || '';

    // Required field validation
    if (!trimmedName) {
      validationErrors.push('Skill name is required');
    }

    if (!trimmedDescription) {
      validationErrors.push('Description is required');
    }

    // Length validation
    if (trimmedName.length > 100) {
      validationErrors.push('Skill name must be 100 characters or less');
    }

    if (trimmedDescription.length > 500) {
      validationErrors.push('Description must be 500 characters or less');
    }

    // Duplicate name validation (only for create mode or different skill in edit mode)
    if (trimmedName) {
      const isDuplicate = existingSkills.some(skill => 
        skill.name.toLowerCase() === trimmedName.toLowerCase() && 
        (mode === 'create' || skill.id !== skillId)
      );
      if (isDuplicate) {
        validationErrors.push(`Skill name "${trimmedName}" already exists`);
      }
    }

    // Attribute selection validation
    if (!formData.attributeIds || formData.attributeIds.length === 0) {
      validationErrors.push('At least one attribute must be selected');
    }

    return validationErrors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    const trimmedName = formData.name?.trim() || '';
    const trimmedDescription = formData.description?.trim() || '';

    const skillData: WorldSkill = {
      id: mode === 'edit' ? skillId! : generateUniqueId(),
      name: trimmedName,
      description: trimmedDescription,
      worldId,
      attributeIds: formData.attributeIds || [],
      difficulty: formData.difficulty || DEFAULT_SKILL_DIFFICULTY,
      baseValue: formData.baseValue || 5,
      minValue: formData.minValue || 1,
      maxValue: formData.maxValue || 10,
    };

    onSave(skillData);
  };

  const handleAttributeToggle = (attributeId: EntityID) => {
    const currentAttributeIds = formData.attributeIds || [];
    const isSelected = currentAttributeIds.includes(attributeId);
    
    let newAttributeIds: EntityID[];
    if (isSelected) {
      newAttributeIds = currentAttributeIds.filter(id => id !== attributeId);
    } else {
      newAttributeIds = [...currentAttributeIds, attributeId];
    }
    
    setFormData(prev => ({
      ...prev,
      attributeIds: newAttributeIds,
    }));
  };

  const handleDelete = () => {
    if (onDelete && skillId) {
      onDelete(skillId);
    }
  };

  // Check if we're at the maximum number of skills
  const isAtMaxSkills = maxSkills !== undefined && existingSkills.length >= maxSkills;
  const canCreateSkill = mode === 'edit' || !isAtMaxSkills;


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          {mode === 'create' ? 'Create New Skill' : 'Edit Skill'}
        </h2>
      </div>

      {mode === 'create' && isAtMaxSkills && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-700">
            Maximum number of skills ({maxSkills}) reached. You cannot create more skills for this world.
          </p>
        </div>
      )}

      {errors.length > 0 && (
        <div className="space-y-2">
          {errors.map((error, index) => (
            <div key={index} className="text-sm text-red-600" role="alert">
              {error}
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} role="form" className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="skill-name">Skill Name</Label>
            <Input
              id="skill-name"
              type="text"
              value={formData.name || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter skill name"
              disabled={!canCreateSkill}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="skill-description">Description</Label>
            <Textarea
              id="skill-description"
              value={formData.description || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe what this skill represents"
              disabled={!canCreateSkill}
              rows={3}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-base font-medium">Linked Attributes</Label>
            <p className="text-sm text-gray-600 mb-3">
              Select one or more attributes this skill is based on
            </p>
            <div className="space-y-2">
              {existingAttributes.map((attribute) => (
                <div key={attribute.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`attribute-${attribute.id}`}
                    checked={formData.attributeIds?.includes(attribute.id) || false}
                    onChange={() => handleAttributeToggle(attribute.id)}
                    disabled={!canCreateSkill}
                    className="rounded border-gray-300 focus:ring-blue-500"
                  />
                  <Label 
                    htmlFor={`attribute-${attribute.id}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {attribute.name}
                  </Label>
                  {attribute.description && (
                    <span className="text-xs text-gray-500">
                      - {attribute.description}
                    </span>
                  )}
                </div>
              ))}
            </div>
            {existingAttributes.length === 0 && (
              <p className="text-sm text-gray-500 italic">
                No attributes available. Create attributes first to link skills.
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-between pt-6 border-t">
          <div className="flex space-x-3">
            <Button
              type="submit"
              disabled={!canCreateSkill}
              variant="default"
            >
              {mode === 'create' ? 'Create Skill' : 'Save Changes'}
            </Button>
            <Button
              type="button"
              onClick={onCancel}
              variant="outline"
            >
              Cancel
            </Button>
          </div>

          {mode === 'edit' && onDelete && (
            <Button
              type="button"
              onClick={() => setShowDeleteDialog(true)}
              variant="destructive"
              size="sm"
            >
              Delete Skill
            </Button>
          )}
        </div>
      </form>

      <DeleteConfirmationDialog
        isOpen={showDeleteDialog}
        title="Delete Skill"
        description="Are you sure you want to delete this skill?"
        itemName={formData.name || 'this skill'}
        onConfirm={handleDelete}
        onClose={() => setShowDeleteDialog(false)}
      />
    </div>
  );
}