import React, { useEffect } from 'react';
import { WorldAttribute, WorldSkill } from '@/types/world.types';
import { EntityID } from '@/types/common.types';
import { generateUniqueId } from '@/lib/utils/generateId';
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useFormState, useModal, useErrorState } from '@/hooks';

export interface AttributeEditorProps {
  worldId: EntityID;
  mode: 'create' | 'edit';
  attributeId?: EntityID;
  onSave: (attribute: WorldAttribute) => void;
  onDelete?: (attributeId: EntityID) => void;
  onCancel: () => void;
  existingAttributes?: WorldAttribute[];
  existingSkills?: WorldSkill[];
  /** Maximum number of attributes allowed in create mode. When specified, prevents creation beyond this limit */
  maxAttributes?: number;
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
  maxAttributes,
}: AttributeEditorProps) {
  const linkedSkills = existingSkills;

  // Form state management with validation
  const form = useFormState({
    initialData: {
      name: '',
      description: '',
      minValue: 1,
      maxValue: 10,
    },
    validate: (data) => {
      const validationErrors: string[] = [];
      
      // Basic validation
      if (!data.name?.trim()) {
        validationErrors.push('Attribute name is required');
      }
      
      // Check for duplicate names
      const isDuplicate = existingAttributes.some(
        attr => attr.name.toLowerCase() === data.name?.toLowerCase() && attr.id !== attributeId
      );
      if (isDuplicate) {
        validationErrors.push('An attribute with this name already exists');
      }
      
      // Range validation
      if (data.minValue !== undefined && data.maxValue !== undefined && 
          data.minValue >= data.maxValue) {
        validationErrors.push('Maximum value must be greater than minimum value');
      }
      
      // Check maxAttributes limit in create mode
      if (mode === 'create' && maxAttributes !== undefined && existingAttributes.length >= maxAttributes) {
        validationErrors.push(`Cannot create more attributes. Maximum of ${maxAttributes} attributes allowed.`);
      }

      return validationErrors;
    },
    clearErrorsOnChange: true,
  });

  // Modal state management
  const deleteModal = useModal();
  
  // Delete warnings state
  const deleteWarnings = useErrorState();

  // Load existing attribute data in edit mode
  useEffect(() => {
    if (mode === 'edit' && attributeId) {
      const attribute = existingAttributes.find(attr => attr.id === attributeId);
      if (attribute) {
        form.setData({
          name: attribute.name,
          description: attribute.description,
          minValue: attribute.minValue,
          maxValue: attribute.maxValue,
        });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, attributeId, existingAttributes]);

  const handleChange = (field: keyof WorldAttribute, value: string | number) => {
    const processedValue = field === 'minValue' || field === 'maxValue' ? Number(value) : value;
    form.updateField(field as keyof typeof form.data, processedValue);
  };

  const handleSave = () => {
    if (!form.isValid()) {
      return;
    }

    const minVal = form.data.minValue ?? 1;
    const maxVal = form.data.maxValue ?? 10;
    
    const attribute: WorldAttribute = {
      id: mode === 'edit' && attributeId ? attributeId : generateUniqueId('attr'),
      worldId: worldId,
      name: form.data.name?.trim() || '',
      description: form.data.description?.trim() || '',
      minValue: minVal,
      maxValue: maxVal,
      baseValue: Math.floor((minVal + maxVal) / 2),
    };

    onSave(attribute);
  };

  const handleDeleteClick = () => {
    if (!attributeId) return;

    // Check for linked skills
    const skillsLinked = linkedSkills.filter(skill => skill.attributeIds?.includes(attributeId));
    if (skillsLinked.length > 0) {
      deleteWarnings.setError(
        `This attribute is linked to ${skillsLinked.length} skill${skillsLinked.length > 1 ? 's' : ''}. Deleting this attribute will affect these skills.`
      );
    } else {
      deleteWarnings.clearError();
    }
    deleteModal.open();
  };

  const handleDeleteConfirm = () => {
    if (onDelete && attributeId) {
      onDelete(attributeId);
    }
    deleteModal.close();
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">
        {mode === 'create' ? 'Create New Attribute' : 'Edit Attribute'}
      </h2>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="attribute-name">
            Attribute Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="attribute-name"
            type="text"
            value={form.data.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="e.g., Strength, Intelligence"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="attribute-description">
            Description
          </Label>
          <Textarea
            id="attribute-description"
            value={form.data.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Describe what this attribute represents"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="min-value">
              Minimum Value
            </Label>
            <Input
              id="min-value"
              type="number"
              value={form.data.minValue}
              onChange={(e) => handleChange('minValue', e.target.value)}
              min={-999}
              max={999}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="max-value">
              Maximum Value
            </Label>
            <Input
              id="max-value"
              type="number"
              value={form.data.maxValue}
              onChange={(e) => handleChange('maxValue', e.target.value)}
              min={-999}
              max={999}
            />
          </div>
        </div>

        {form.hasErrors && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-1">
            {form.errors.map((error, index) => (
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

      <DeleteConfirmationDialog
        {...deleteModal.modalProps}
        onConfirm={handleDeleteConfirm}
        title="Delete Attribute"
        description={
          deleteWarnings.hasError 
            ? deleteWarnings.error + '. This action cannot be undone.'
            : 'This action cannot be undone.'
        }
        itemName={form.data.name || 'this attribute'}
        confirmButtonText="Delete Attribute"
        cancelButtonText="Cancel"
        isDeleting={false}
      />
    </div>
  );
}
