import React, { useState, useEffect } from 'react';
import { WorldAttribute, WorldSkill } from '@/types/world.types';
import { EntityID } from '@/types/common.types';
import { generateUniqueId } from '@/lib/utils/generateId';
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog';

export interface AttributeEditorProps {
  worldId: EntityID;
  mode: 'create' | 'edit';
  attributeId?: EntityID;
  onSave: (attribute: WorldAttribute) => void;
  onDelete?: (attributeId: EntityID) => void;
  onCancel: () => void;
  existingAttributes?: WorldAttribute[];
  existingSkills?: WorldSkill[];
}

export function AttributeEditor({
  worldId,
  mode,
  attributeId,
  onSave,
  onDelete,
  onCancel,
  existingAttributes = [],
  existingSkills = [],
}: AttributeEditorProps) {
  const linkedSkills = existingSkills;

  const [formData, setFormData] = useState<Partial<WorldAttribute>>({
    name: '',
    description: '',
    minValue: 1,
    maxValue: 10,
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteWarnings, setDeleteWarnings] = useState<string[]>([]);

  // Load existing attribute data in edit mode
  useEffect(() => {
    if (mode === 'edit' && attributeId) {
      // In a real implementation, this would fetch from the store
      // For now, we'll use the attributes passed via props
      const attribute = existingAttributes.find(attr => attr.id === attributeId);
      if (attribute) {
        setFormData({
          id: attribute.id,
          name: attribute.name,
          description: attribute.description,
          minValue: attribute.minValue,
          maxValue: attribute.maxValue,
        });
      }
    }
  }, [mode, attributeId, existingAttributes]);

  const handleChange = (field: keyof WorldAttribute, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: field === 'minValue' || field === 'maxValue' ? Number(value) : value,
    }));
    // Clear errors when user starts typing
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const handleSave = () => {
    const validationErrors: string[] = [];
    
    // Basic validation
    if (!formData.name?.trim()) {
      validationErrors.push('Attribute name is required');
    }
    
    // Check for duplicate names
    const isDuplicate = existingAttributes.some(
      attr => attr.name.toLowerCase() === formData.name?.toLowerCase() && attr.id !== attributeId
    );
    if (isDuplicate) {
      validationErrors.push('An attribute with this name already exists');
    }
    
    // Range validation
    if (formData.minValue !== undefined && formData.maxValue !== undefined && 
        formData.minValue >= formData.maxValue) {
      validationErrors.push('Maximum value must be greater than minimum value');
    }

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    const minVal = formData.minValue ?? 1;
    const maxVal = formData.maxValue ?? 10;
    
    const attribute: WorldAttribute = {
      id: mode === 'edit' && attributeId ? attributeId : generateUniqueId('attr'),
      worldId: worldId,
      name: formData.name?.trim() || '',
      description: formData.description?.trim() || '',
      minValue: minVal,
      maxValue: maxVal,
      baseValue: Math.floor((minVal + maxVal) / 2),
    };

    onSave(attribute);
  };

  const handleDeleteClick = () => {
    if (!attributeId) return;

    // Check for linked skills
    const skillsLinked = linkedSkills.filter(skill => skill.linkedAttributeId === attributeId);
    if (skillsLinked.length > 0) {
      setDeleteWarnings([
        `This attribute is linked to ${skillsLinked.length} skill${skillsLinked.length > 1 ? 's' : ''}`,
        'Deleting this attribute will affect these skills'
      ]);
    }
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = () => {
    if (onDelete && attributeId) {
      onDelete(attributeId);
    }
    setShowDeleteDialog(false);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">
        {mode === 'create' ? 'Create New Attribute' : 'Edit Attribute'}
      </h2>

      <div className="space-y-4">
        <div>
          <label htmlFor="attribute-name" className="block text-sm font-medium mb-1">
            Attribute Name
          </label>
          <input
            id="attribute-name"
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Strength, Intelligence"
          />
        </div>

        <div>
          <label htmlFor="attribute-description" className="block text-sm font-medium mb-1">
            Description
          </label>
          <textarea
            id="attribute-description"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
            placeholder="Describe what this attribute represents"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="min-value" className="block text-sm font-medium mb-1">
              Minimum Value
            </label>
            <input
              id="min-value"
              type="number"
              value={formData.minValue}
              onChange={(e) => handleChange('minValue', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="-999"
              max="999"
            />
          </div>

          <div>
            <label htmlFor="max-value" className="block text-sm font-medium mb-1">
              Maximum Value
            </label>
            <input
              id="max-value"
              type="number"
              value={formData.maxValue}
              onChange={(e) => handleChange('maxValue', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="-999"
              max="999"
            />
          </div>
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

      <div className="flex justify-between items-center pt-4 border-t">
        <div className="flex gap-2">
          {mode === 'edit' && onDelete && (
            <button
              onClick={handleDeleteClick}
              className="px-4 py-3 text-red-600 border border-red-600 rounded-lg hover:bg-red-50 font-medium transition-colors"
              aria-label="Delete attribute"
            >
              Delete Attribute
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
            {mode === 'create' ? 'Create Attribute' : 'Save Changes'}
          </button>
        </div>
      </div>

      {showDeleteDialog && (
        <DeleteConfirmationDialog
          isOpen={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          onConfirm={handleDeleteConfirm}
          title="Delete Attribute"
          description={
            deleteWarnings.length > 0 
              ? deleteWarnings.join('. ') + '. This action cannot be undone.'
              : 'This action cannot be undone.'
          }
          itemName={formData.name || 'this attribute'}
          confirmButtonText="Delete Attribute"
          cancelButtonText="Cancel"
          isDeleting={false}
        />
      )}
    </div>
  );
}