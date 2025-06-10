import React, { useState, useEffect } from 'react';
import { WorldSkill, WorldAttribute } from '@/types/world.types';
import { EntityID } from '@/types/common.types';
import { generateUniqueId } from '@/lib/utils/generateId';
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog';
import {
  SKILL_DIFFICULTIES,
  DEFAULT_SKILL_DIFFICULTY,
  SkillDifficulty
} from '@/lib/constants/skillDifficultyLevels';
import { 
  MIN_SKILL_VALUE, 
  MAX_SKILL_VALUE, 
  SKILL_DEFAULT_VALUE 
} from '@/lib/constants/skillLevelDescriptions';

export interface SkillEditorProps {
  worldId: EntityID;
  mode: 'create' | 'edit';
  skillId?: EntityID;
  onSave: (skill: WorldSkill) => void;
  onDelete?: (skillId: EntityID) => void;
  onCancel: () => void;
  existingSkills?: WorldSkill[];
  existingAttributes?: WorldAttribute[];
}

export function SkillEditor({
  worldId,
  mode,
  skillId,
  onSave,
  onDelete,
  onCancel,
  existingSkills = [],
  existingAttributes = [],
}: SkillEditorProps) {
  const [formData, setFormData] = useState<Partial<WorldSkill>>({
    name: '',
    description: '',
    category: '',
    difficulty: DEFAULT_SKILL_DIFFICULTY,
    attributeIds: [],
    baseValue: SKILL_DEFAULT_VALUE,
    minValue: MIN_SKILL_VALUE,
    maxValue: MAX_SKILL_VALUE,
  });

  const [errors, setErrors] = useState<string[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteWarnings, setDeleteWarnings] = useState<string[]>([]);

  // Load existing skill data in edit mode
  useEffect(() => {
    if (mode === 'edit' && skillId) {
      const skill = existingSkills.find(s => s.id === skillId);
      if (skill) {
        setFormData({
          id: skill.id,
          name: skill.name,
          description: skill.description,
          category: skill.category,
          difficulty: skill.difficulty,
          attributeIds: [...skill.attributeIds],
          baseValue: skill.baseValue,
          minValue: skill.minValue,
          maxValue: skill.maxValue,
        });
      }
    }
  }, [mode, skillId, existingSkills]);

  const handleChange = (field: keyof WorldSkill, value: string | number | SkillDifficulty) => {
    setFormData((prev) => ({
      ...prev,
      [field]: field === 'minValue' || field === 'maxValue' || field === 'baseValue' 
        ? Number(value) 
        : value,
    }));
    
    // Clear errors when user starts typing
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const handleAttributeToggle = (attributeId: EntityID) => {
    setFormData((prev) => {
      const currentAttributeIds = prev.attributeIds || [];
      const isSelected = currentAttributeIds.includes(attributeId);
      
      return {
        ...prev,
        attributeIds: isSelected
          ? currentAttributeIds.filter(id => id !== attributeId)
          : [...currentAttributeIds, attributeId],
      };
    });

    // Clear errors when user makes changes
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const handleSave = () => {
    const validationErrors: string[] = [];
    
    // Basic validation
    if (!formData.name?.trim()) {
      validationErrors.push('Skill name is required');
    }
    
    // Check for duplicate names (excluding current skill in edit mode)
    const isDuplicate = existingSkills.some(
      skill => skill.name.toLowerCase() === formData.name?.toLowerCase() && skill.id !== skillId
    );
    if (isDuplicate) {
      validationErrors.push('A skill with this name already exists');
    }
    
    // Range validation
    if (formData.minValue !== undefined && formData.maxValue !== undefined && 
        formData.minValue >= formData.maxValue) {
      validationErrors.push('Maximum value must be greater than minimum value');
    }

    // Base value validation
    if (formData.baseValue !== undefined && formData.minValue !== undefined && formData.maxValue !== undefined) {
      if (formData.baseValue < formData.minValue || formData.baseValue > formData.maxValue) {
        validationErrors.push('Base value must be between minimum and maximum values');
      }
    }

    // Skills limit validation (12 maximum)
    if (mode === 'create' && existingSkills.length >= 12) {
      validationErrors.push('Cannot create more than 12 skills per world');
    }

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    const minVal = formData.minValue ?? MIN_SKILL_VALUE;
    const maxVal = formData.maxValue ?? MAX_SKILL_VALUE;
    const baseVal = formData.baseValue ?? SKILL_DEFAULT_VALUE;
    
    const skill: WorldSkill = {
      id: mode === 'edit' && skillId ? skillId : generateUniqueId('skill'),
      worldId: worldId,
      name: formData.name?.trim() || '',
      description: formData.description?.trim() || '',
      category: formData.category?.trim(),
      difficulty: formData.difficulty || DEFAULT_SKILL_DIFFICULTY,
      attributeIds: formData.attributeIds || [],
      baseValue: baseVal,
      minValue: minVal,
      maxValue: maxVal,
    };

    onSave(skill);
  };

  const handleDeleteClick = () => {
    if (!skillId) return;

    // Check for linked attributes
    const linkedAttributeCount = formData.attributeIds?.length || 0;
    if (linkedAttributeCount > 0) {
      setDeleteWarnings([
        `This skill is linked to ${linkedAttributeCount} attribute${linkedAttributeCount > 1 ? 's' : ''}`,
        'Deleting this skill will remove these connections'
      ]);
    }
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = () => {
    if (onDelete && skillId) {
      onDelete(skillId);
    }
    setShowDeleteDialog(false);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">
        {mode === 'create' ? 'Create New Skill' : 'Edit Skill'}
      </h2>

      <div className="space-y-4">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="skill-name" className="block text-sm font-medium mb-1">
              Skill Name
            </label>
            <input
              id="skill-name"
              type="text"
              value={formData.name || ''}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Investigation, Athletics"
            />
          </div>

          <div>
            <label htmlFor="skill-category" className="block text-sm font-medium mb-1">
              Category
            </label>
            <input
              id="skill-category"
              type="text"
              value={formData.category || ''}
              onChange={(e) => handleChange('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Mental, Physical, Social"
            />
          </div>
        </div>

        <div>
          <label htmlFor="skill-description" className="block text-sm font-medium mb-1">
            Description
          </label>
          <textarea
            id="skill-description"
            value={formData.description || ''}
            onChange={(e) => handleChange('description', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
            placeholder="Describe what this skill represents and how it's used"
          />
        </div>

        {/* Difficulty and Values */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label htmlFor="skill-difficulty" className="block text-sm font-medium mb-1">
              Difficulty
            </label>
            <select
              id="skill-difficulty"
              value={formData.difficulty || DEFAULT_SKILL_DIFFICULTY}
              onChange={(e) => handleChange('difficulty', e.target.value as SkillDifficulty)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {SKILL_DIFFICULTIES.map(diff => (
                <option key={diff.value} value={diff.value}>
                  {diff.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="min-value" className="block text-sm font-medium mb-1">
              Minimum Value
            </label>
            <input
              id="min-value"
              type="number"
              value={formData.minValue ?? MIN_SKILL_VALUE}
              onChange={(e) => handleChange('minValue', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
              max="10"
            />
          </div>

          <div>
            <label htmlFor="max-value" className="block text-sm font-medium mb-1">
              Maximum Value
            </label>
            <input
              id="max-value"
              type="number"
              value={formData.maxValue ?? MAX_SKILL_VALUE}
              onChange={(e) => handleChange('maxValue', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
              max="10"
            />
          </div>

          <div>
            <label htmlFor="base-value" className="block text-sm font-medium mb-1">
              Base Value
            </label>
            <input
              id="base-value"
              type="number"
              value={formData.baseValue ?? SKILL_DEFAULT_VALUE}
              onChange={(e) => handleChange('baseValue', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              min={formData.minValue ?? MIN_SKILL_VALUE}
              max={formData.maxValue ?? MAX_SKILL_VALUE}
            />
          </div>
        </div>

        {/* Linked Attributes */}
        <div>
          <h3 className="text-md font-medium mb-3">Linked Attributes</h3>
          {existingAttributes.length === 0 ? (
            <p className="text-gray-500 italic">No attributes available. Create attributes first.</p>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-gray-600 mb-3">
                Select one or more attributes that this skill is based on. Skills can use multiple attributes.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {existingAttributes.map(attribute => (
                  <label
                    key={attribute.id}
                    className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.attributeIds?.includes(attribute.id) || false}
                      onChange={() => handleAttributeToggle(attribute.id)}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{attribute.name}</div>
                      <div className="text-sm text-gray-500">{attribute.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-1">
            {errors.map((error, index) => (
              <p key={index} className="text-sm text-red-600">
                {error}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-4 border-t">
        <div className="flex gap-2">
          {mode === 'edit' && onDelete && (
            <button
              onClick={handleDeleteClick}
              className="px-4 py-3 text-red-600 border border-red-600 rounded-lg hover:bg-red-50 font-medium transition-colors"
              aria-label="Delete skill"
            >
              Delete Skill
            </button>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
          >
            {mode === 'create' ? 'Create Skill' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <DeleteConfirmationDialog
          isOpen={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          onConfirm={handleDeleteConfirm}
          title="Delete Skill"
          description={
            deleteWarnings.length > 0 
              ? deleteWarnings.join('. ') + '. This action cannot be undone.'
              : 'This action cannot be undone.'
          }
          itemName={formData.name || 'this skill'}
          confirmButtonText="Delete Skill"
          cancelButtonText="Cancel"
          isDeleting={false}
        />
      )}
    </div>
  );
}