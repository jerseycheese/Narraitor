import React, { useState, useEffect } from 'react';
import { WorldAttribute, WorldSkill } from '@/types/world.types';
import { EntityID } from '@/types/common.types';
import { generateUniqueId } from '@/lib/utils/generateId';
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';


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
    
    // Check maxAttributes limit in create mode
    if (mode === 'create' && maxAttributes !== undefined && existingAttributes.length >= maxAttributes) {
      validationErrors.push(`Cannot create more attributes. Maximum of ${maxAttributes} attributes allowed.`);
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
    const skillsLinked = linkedSkills.filter(skill => skill.attributeIds?.includes(attributeId));
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
    <>
      <div >
        <h2 >
          {mode === 'create' ? 'Create New Attribute' : 'Edit Attribute'}
        </h2>
      </div>

      <div >
        <div >
          <Label htmlFor="attribute-name">
            Attribute Name <span >*</span>
          </Label>
          <Input
            id="attribute-name"
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="e.g., Strength, Intelligence"
            aria-describedby={errors.length > 0 ? "attribute-errors" : undefined}
            aria-invalid={errors.length > 0}
          />
        </div>

        <div >
          <Label htmlFor="attribute-description">
            Description
          </Label>
          <Textarea
            id="attribute-description"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Describe what this attribute represents"
          />
        </div>

        <div >
          <div >
            <Label htmlFor="min-value">
              Minimum Value
            </Label>
            <Input
              id="min-value"
              type="number"
              value={formData.minValue}
              onChange={(e) => handleChange('minValue', e.target.value)}
              min={-999}
              max={999}
            />
          </div>

          <div >
            <Label htmlFor="max-value">
              Maximum Value
            </Label>
            <Input
              id="max-value"
              type="number"
              value={formData.maxValue}
              onChange={(e) => handleChange('maxValue', e.target.value)}
              min={-999}
              max={999}
            />
          </div>
        </div>

        {errors.length > 0 && (
          <div 
            id="attribute-errors"
            role="alert" 
            aria-live="polite"
            
          >
            {errors.map((error, index) => (
              <p key={index} >
                {error}
              </p>
            ))}
          </div>
        )}
      </div>

      <div >
        <div >
          {mode === 'edit' && onDelete && (
            <Button
              onClick={handleDeleteClick}
              variant="destructive"
              aria-label="Delete attribute"
            >
              Delete Attribute
            </Button>
          )}
        </div>

        <div >
          <Button
            onClick={onCancel}
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="default"
          >
            {mode === 'create' ? 'Create Attribute' : 'Save Changes'}
          </Button>
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
    </>
  );
}
