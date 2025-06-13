'use client';

import React, { useState, useEffect } from 'react';
import { World, WorldAttribute } from '@/types/world.types';
import { AttributeSuggestion } from '../WorldCreationWizard';
import { generateUniqueId } from '@/lib/utils/generateId';
import AttributeRangeEditor from '@/components/forms/AttributeRangeEditor';
import { AttributeEditor } from '@/components/world/AttributeEditor/AttributeEditor';
import { 
  wizardStyles,
  WizardFormSection,
  WizardFormGroup,
  WizardTextField,
  WizardTextArea
} from '@/components/shared/wizard';

interface AttributeReviewStepProps {
  worldData: Partial<World>;
  suggestions: AttributeSuggestion[];
  errors: Record<string, string>;
  onUpdate: (updates: Partial<World>) => void;
}

export default function AttributeReviewStep({
  worldData,
  suggestions,
  errors,
  onUpdate,
}: AttributeReviewStepProps) {
  // Custom attribute management state
  const [customAttributes, setCustomAttributes] = useState<WorldAttribute[]>([]);
  const [isCreatingCustomAttribute, setIsCreatingCustomAttribute] = useState(false);
  const [editingCustomAttributeId, setEditingCustomAttributeId] = useState<string | null>(null);
  // Initialize state based on existing selections
  const [localSuggestions, setLocalSuggestions] = useState(() => {
    // If we have existing attributes in worldData, match them to suggestions
    if (worldData.attributes && worldData.attributes.length > 0) {
      return suggestions.map(suggestion => {
        const existingAttr = worldData.attributes?.find(attr => attr.name === suggestion.name);
        return {
          ...suggestion,
          accepted: suggestion.accepted !== undefined ? suggestion.accepted : true, // Use suggestion's accepted value, default to true
          showDetails: suggestions.indexOf(suggestion) === 0, // Show details for the first one
          baseValue: existingAttr?.baseValue ?? Math.floor((suggestion.minValue + suggestion.maxValue) / 2),
        };
      });
    }
    return suggestions.map((suggestion, index) => ({
      ...suggestion,
      baseValue: Math.floor((suggestion.minValue + suggestion.maxValue) / 2),
      accepted: suggestion.accepted !== undefined ? suggestion.accepted : true, // Use suggestion's accepted value, default to true
      showDetails: index === 0, // Show details only for the first one
    }));
  });

  // Update local state only on initial load or when suggestions change
  useEffect(() => {
    // This should only run on initial mount or when suggestions change from parent
    // Not on every worldData update to prevent overriding user toggles
    if (suggestions.length > 0) {
      const newSuggestions = suggestions.map(suggestion => {
        const existingAttr = worldData.attributes?.find(attr => attr.name === suggestion.name);
        // Use the suggestion's accepted value, defaulting to true if not specified
        const accepted = suggestion.accepted !== undefined ? suggestion.accepted : true;
        // For the first attribute, show details by default to give user a clue
        return {
          ...suggestion,
          accepted,
          showDetails: suggestions.indexOf(suggestion) === 0, // Show details for the first one
          baseValue: existingAttr?.baseValue ?? Math.floor((suggestion.minValue + suggestion.maxValue) / 2),
        };
      });
      
      setLocalSuggestions(newSuggestions);
      
      // Automatically save the initially selected attributes to parent state
      const acceptedAttributes = newSuggestions
        .filter(s => s.accepted)
        .map(s => ({
          id: generateUniqueId('attr'),
          worldId: '',
          name: s.name,
          description: s.description,
          baseValue: s.baseValue,
          minValue: s.minValue,
          maxValue: s.maxValue,
          category: s.category,
        }));
      
      // Only update if we don't already have attributes or if the count is different
      if (!worldData.attributes || worldData.attributes.length !== acceptedAttributes.length) {
        onUpdate({ ...worldData, attributes: acceptedAttributes });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suggestions]); // Only depend on suggestions, not worldData.attributes

  const handleToggleAttribute = (index: number) => {
    // Toggle the state in a new array
    const updatedSuggestions = [...localSuggestions];
    updatedSuggestions[index] = {
      ...updatedSuggestions[index],
      accepted: !updatedSuggestions[index].accepted
    };
    
    // Update local state
    setLocalSuggestions(updatedSuggestions);
    
    // Convert to WorldAttribute objects for the store
    const acceptedAttributes = updatedSuggestions
      .filter(s => s.accepted)
      .map(s => ({
        id: generateUniqueId('attr'),
        worldId: '',
        name: s.name,
        description: s.description,
        baseValue: s.baseValue,
        minValue: s.minValue,
        maxValue: s.maxValue,
        category: s.category,
      }));
    
    // Include custom attributes
    const allAttributes = [...acceptedAttributes, ...customAttributes];
    onUpdate({ ...worldData, attributes: allAttributes });
  };

  const handleModifyAttribute = (index: number, field: keyof AttributeSuggestion, value: string | number) => {
    const updatedSuggestions = [...localSuggestions];
    updatedSuggestions[index] = { ...updatedSuggestions[index], [field]: value };
    setLocalSuggestions(updatedSuggestions);
    
    // Re-calculate accepted attributes
    const acceptedAttributes: WorldAttribute[] = updatedSuggestions
      .filter(s => s.accepted)
      .map(s => ({
        id: generateUniqueId('attr'),
        worldId: '',
        name: s.name,
        description: s.description,
        baseValue: s.baseValue,
        minValue: s.minValue,
        maxValue: s.maxValue,
        category: s.category,
      }));
    
    const allAttributes = [...acceptedAttributes, ...customAttributes];
    onUpdate({ ...worldData, attributes: allAttributes });
  };


  const acceptedCount = localSuggestions.filter(s => s.accepted).length + customAttributes.length;

  // Custom attribute handlers
  const handleAddCustomAttribute = () => {
    setIsCreatingCustomAttribute(true);
    setEditingCustomAttributeId(null);
  };

  const handleSaveCustomAttribute = (attribute: WorldAttribute) => {
    let updatedCustomAttributes: WorldAttribute[];
    
    if (editingCustomAttributeId) {
      // Edit existing custom attribute
      updatedCustomAttributes = customAttributes.map(a => a.id === editingCustomAttributeId ? attribute : a);
    } else {
      // Add new custom attribute
      updatedCustomAttributes = [...customAttributes, attribute];
    }
    
    setCustomAttributes(updatedCustomAttributes);
    setIsCreatingCustomAttribute(false);
    setEditingCustomAttributeId(null);
    
    // Recalculate world attributes
    const acceptedAIAttributes: WorldAttribute[] = localSuggestions
      .filter(s => s.accepted)
      .map(s => ({
        id: generateUniqueId('attr'),
        worldId: '',
        name: s.name,
        description: s.description,
        baseValue: s.baseValue,
        minValue: s.minValue,
        maxValue: s.maxValue,
        category: s.category,
      }));
    
    const allAttributes = [...acceptedAIAttributes, ...updatedCustomAttributes];
    onUpdate({ ...worldData, attributes: allAttributes });
  };

  const handleEditCustomAttribute = (attributeId: string) => {
    setEditingCustomAttributeId(attributeId);
    setIsCreatingCustomAttribute(true);
  };

  const handleDeleteCustomAttribute = (attributeId: string) => {
    const updatedCustomAttributes = customAttributes.filter(a => a.id !== attributeId);
    setCustomAttributes(updatedCustomAttributes);
    
    // Recalculate world attributes
    const acceptedAIAttributes: WorldAttribute[] = localSuggestions
      .filter(s => s.accepted)
      .map(s => ({
        id: generateUniqueId('attr'),
        worldId: '',
        name: s.name,
        description: s.description,
        baseValue: s.baseValue,
        minValue: s.minValue,
        maxValue: s.maxValue,
        category: s.category,
      }));
    
    const allAttributes = [...acceptedAIAttributes, ...updatedCustomAttributes];
    onUpdate({ ...worldData, attributes: allAttributes });
  };

  const handleCancelCustomAttribute = () => {
    setIsCreatingCustomAttribute(false);
    setEditingCustomAttributeId(null);
  };

  return (
    <div data-testid="attribute-review-step">
      <WizardFormSection
        title="Review Attributes"
        description="We've suggested attributes for your world. Click 'Customize' to modify any attribute, or 'Selected/Excluded' to include/exclude it. You can have up to 6 attributes total."
      >

      <div className="space-y-4">
        {localSuggestions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-lg mb-2">No attribute suggestions available</p>
            <p className="text-sm">You can add attributes to your world later in the world editor.</p>
          </div>
        ) : (
          localSuggestions.map((suggestion, index) => (
          <div 
            key={index} 
            className={wizardStyles.card.base} 
            data-testid={`attribute-card-${index}`}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium">
                  {suggestion.name}
                </span>
                {suggestion.category && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {suggestion.category}
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  type="button" 
                  className="text-sm text-blue-600 hover:underline focus:outline-none"
                  onClick={(e) => {
                    e.stopPropagation();
                    const newSuggestions = [...localSuggestions];
                    newSuggestions[index] = {
                      ...newSuggestions[index],
                      showDetails: !newSuggestions[index].showDetails
                    };
                    setLocalSuggestions(newSuggestions);
                  }}
                >
                  {suggestion.showDetails ? 'Hide details' : 'Customize'}
                </button>
                <button
                  type="button"
                  data-testid={`attribute-toggle-${index}`}
                  onClick={() => handleToggleAttribute(index)}
                  className={`${wizardStyles.toggle.button} ${
                    suggestion.accepted 
                      ? wizardStyles.toggle.active 
                      : wizardStyles.toggle.inactive
                  }`}
                >
                  {suggestion.accepted ? 'Selected ✓' : 'Excluded'}
                </button>
              </div>
            </div>
            
            {suggestion.showDetails && (
              <div 
                key={`attribute-expanded-${index}`}
                className="mt-4 pl-7"
                onClick={(e) => e.stopPropagation()} // Prevent toggling when interacting with inputs
              >
                <WizardFormGroup label="Name">
                  <WizardTextField
                    value={suggestion.name}
                    onChange={(value) => handleModifyAttribute(index, 'name', value)}
                    testId={`attribute-name-input-${index}`}
                  />
                </WizardFormGroup>
                
                <WizardFormGroup label="Description">
                  <WizardTextArea
                    value={suggestion.description}
                    onChange={(value) => handleModifyAttribute(index, 'description', value)}
                    rows={2}
                    testId={`attribute-description-textarea-${index}`}
                  />
                </WizardFormGroup>

                {/* Fixed min/max range controls (for MVP) */}
                <div className="my-4">
                  <AttributeRangeEditor
                    attribute={{
                      id: '',
                      worldId: '',
                      name: suggestion.name,
                      description: suggestion.description,
                      baseValue: suggestion.baseValue,
                      minValue: 1, // Fixed for MVP
                      maxValue: 10, // Fixed for MVP
                    }}
                    onChange={(updates) => {
                      if (updates.baseValue !== undefined) {
                        handleModifyAttribute(index, 'baseValue', updates.baseValue);
                      }
                    }}
                    showLabels={false}
                  />
                </div>
              </div>
            )}
          </div>
          ))
        )}
        
        {/* Custom Attributes Section */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Custom Attributes</h3>
              <p className="text-sm text-gray-600">
                Create your own unique attributes for this world ({acceptedCount}/6 slots used)
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddCustomAttribute}
              className={`${wizardStyles.navigation.primaryButton} text-sm`}
              data-testid="add-custom-attribute-button"
              disabled={acceptedCount >= 6}
            >
              + Add Custom Attribute
            </button>
          </div>
          
          {customAttributes.length === 0 && !isCreatingCustomAttribute ? (
            <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <p className="text-sm text-gray-600 mb-2">No custom attributes yet</p>
              <p className="text-xs text-gray-500">
                {acceptedCount < 6 
                  ? `You have ${6 - acceptedCount} attribute slot${6 - acceptedCount !== 1 ? 's' : ''} available for custom attributes`
                  : 'Remove some suggested attributes to add custom ones'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {customAttributes.map((attribute) => (
                <div
                  key={attribute.id}
                  className={`${wizardStyles.card.base} border-l-4 border-l-green-500`}
                  data-testid={`custom-attribute-card-${attribute.id}`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{attribute.name}</span>
                      <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                        Custom
                      </span>
                      {attribute.category && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {attribute.category}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditCustomAttribute(attribute.id)}
                        className="text-sm text-blue-600 hover:underline"
                        data-testid={`edit-custom-attribute-${attribute.id}`}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCustomAttribute(attribute.id)}
                        className="text-sm text-red-600 hover:underline"
                        data-testid={`delete-custom-attribute-${attribute.id}`}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    {attribute.description}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Custom Attribute Editor */}
          {isCreatingCustomAttribute && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border" data-testid="custom-attribute-editor">
              <AttributeEditor
                worldId={worldData.id || ''}
                mode={editingCustomAttributeId ? 'edit' : 'create'}
                attributeId={editingCustomAttributeId || undefined}
                existingAttributes={[...customAttributes, ...(worldData.attributes || [])]}
                maxAttributes={6}
                onSave={handleSaveCustomAttribute}
                onDelete={editingCustomAttributeId ? handleDeleteCustomAttribute : undefined}
                onCancel={handleCancelCustomAttribute}
              />
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200" data-testid="attribute-count-summary">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-sm font-medium text-blue-900">
              Attributes Selected: {acceptedCount} / 6
            </span>
            {acceptedCount >= 6 && (
              <span className="text-xs text-amber-600 ml-2">
                (Maximum reached)
              </span>
            )}
          </div>
          <div className="text-xs text-blue-700">
            {acceptedCount < 6 
              ? `${6 - acceptedCount} slot${6 - acceptedCount !== 1 ? 's' : ''} available`
              : 'All slots filled'
            }
          </div>
        </div>
        <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
            style={{ width: `${(acceptedCount / 6) * 100}%` }}
          ></div>
        </div>
      </div>
      </WizardFormSection>

      {errors.attributes && (
        <div className={wizardStyles.form.error}>{errors.attributes}</div>
      )}

    </div>
  );
}
