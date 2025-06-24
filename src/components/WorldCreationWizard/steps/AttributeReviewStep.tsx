'use client';

import React, { useEffect } from 'react';
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
import { useFormState } from '@/hooks';

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
  // Attribute review state management using hooks
  const attributeReviewState = useFormState({
    initialData: {
      // Custom attribute management state - initialize from existing world data when editing
      customAttributes: (() => {
        // When editing, identify existing custom attributes (those not in AI suggestions)
        if (worldData.attributes && worldData.attributes.length > 0) {
          const suggestionNames = new Set(suggestions.map(s => s.name));
          return worldData.attributes.filter(attr => !suggestionNames.has(attr.name));
        }
        return [];
      })() as WorldAttribute[],
      isCreatingCustomAttribute: false,
      editingCustomAttributeId: null as string | null,
      localSuggestions: [] as (AttributeSuggestion & { accepted: boolean; showDetails: boolean; baseValue: number })[]
    }
  });

  /**
   * Helper function to merge accepted AI attributes with custom attributes
   * 
   * This centralizes the merge logic to ensure consistency across all handlers
   * and reduces code duplication. Uses stable IDs to prevent unnecessary re-renders.
   * 
   * @param acceptedSuggestions - AI-generated attribute suggestions that are accepted
   * @param customAttributesList - Custom attributes to merge (defaults to current state)
   * @returns Combined array of accepted AI attributes and custom attributes
   */
  const mergeAllAttributes = (acceptedSuggestions: AttributeSuggestion[], customAttributesList = attributeReviewState.data.customAttributes): WorldAttribute[] => {
    const acceptedAttributes: WorldAttribute[] = acceptedSuggestions.map(s => {
      // Use stable ID based on attribute name to prevent unnecessary re-renders
      const existingAttribute = worldData.attributes?.find(attr => attr.name === s.name);
      return {
        id: existingAttribute?.id || generateUniqueId('attribute'),
        worldId: '',
        name: s.name,
        description: s.description,
        baseValue: s.baseValue,
        minValue: s.minValue,
        maxValue: s.maxValue,
        category: s.category,
      };
    });
    
    return [...acceptedAttributes, ...customAttributesList];
  };
  
  // Initialize local suggestions and update state when suggestions change

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
      
      attributeReviewState.updateField('localSuggestions', newSuggestions);
      
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
        console.log('[AttributeReviewStep] Auto-applying accepted AI suggestions:', {
          suggestionsCount: suggestions.length,
          acceptedCount: acceptedAttributes.length,
          worldDataAttributesCount: worldData.attributes?.length || 0
        });
        onUpdate({ ...worldData, attributes: acceptedAttributes });
      } else {
        console.log('[AttributeReviewStep] Skipping auto-apply - attributes already match:', {
          existingCount: worldData.attributes.length,
          acceptedCount: acceptedAttributes.length
        });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suggestions]); // Only depend on suggestions, not worldData.attributes or attributeReviewState

  const handleToggleAttribute = (index: number) => {
    // Toggle the state in a new array
    const updatedSuggestions = [...attributeReviewState.data.localSuggestions];
    updatedSuggestions[index] = {
      ...updatedSuggestions[index],
      accepted: !updatedSuggestions[index].accepted
    };
    
    // Update local state
    attributeReviewState.updateField('localSuggestions', updatedSuggestions);
    
    // Convert to WorldAttribute objects for the store
    const acceptedSuggestions = updatedSuggestions.filter(s => s.accepted);
    const allAttributes = mergeAllAttributes(acceptedSuggestions);
    onUpdate({ ...worldData, attributes: allAttributes });
  };

  const handleModifyAttribute = (index: number, field: keyof AttributeSuggestion, value: string | number) => {
    const updatedSuggestions = [...attributeReviewState.data.localSuggestions];
    updatedSuggestions[index] = { ...updatedSuggestions[index], [field]: value };
    attributeReviewState.updateField('localSuggestions', updatedSuggestions);
    
    // Re-calculate accepted attributes
    const acceptedSuggestions = updatedSuggestions.filter(s => s.accepted);
    const allAttributes = mergeAllAttributes(acceptedSuggestions);
    onUpdate({ ...worldData, attributes: allAttributes });
  };


  const acceptedCount = attributeReviewState.data.localSuggestions.filter(s => s.accepted).length + attributeReviewState.data.customAttributes.length;

  // Custom attribute handlers
  const handleAddCustomAttribute = () => {
    attributeReviewState.updateField('isCreatingCustomAttribute', true);
    attributeReviewState.updateField('editingCustomAttributeId', null);
  };

  const handleSaveCustomAttribute = (attribute: WorldAttribute) => {
    let updatedCustomAttributes: WorldAttribute[];
    
    if (attributeReviewState.data.editingCustomAttributeId) {
      // Edit existing custom attribute
      updatedCustomAttributes = attributeReviewState.data.customAttributes.map(a => a.id === attributeReviewState.data.editingCustomAttributeId ? attribute : a);
    } else {
      // Add new custom attribute
      updatedCustomAttributes = [...attributeReviewState.data.customAttributes, attribute];
    }
    
    attributeReviewState.updateData({
      ...attributeReviewState.data,
      customAttributes: updatedCustomAttributes,
      isCreatingCustomAttribute: false,
      editingCustomAttributeId: null
    });
    
    // Recalculate world attributes
    const acceptedSuggestions = attributeReviewState.data.localSuggestions.filter(s => s.accepted);
    const allAttributes = mergeAllAttributes(acceptedSuggestions, updatedCustomAttributes);
    onUpdate({ ...worldData, attributes: allAttributes });
  };

  const handleEditCustomAttribute = (attributeId: string) => {
    attributeReviewState.updateField('editingCustomAttributeId', attributeId);
    attributeReviewState.updateField('isCreatingCustomAttribute', true);
  };

  const handleDeleteCustomAttribute = (attributeId: string) => {
    const updatedCustomAttributes = attributeReviewState.data.customAttributes.filter(a => a.id !== attributeId);
    attributeReviewState.updateField('customAttributes', updatedCustomAttributes);
    
    // Recalculate world attributes
    const acceptedSuggestions = attributeReviewState.data.localSuggestions.filter(s => s.accepted);
    const allAttributes = mergeAllAttributes(acceptedSuggestions, updatedCustomAttributes);
    onUpdate({ ...worldData, attributes: allAttributes });
  };

  const handleCancelCustomAttribute = () => {
    attributeReviewState.updateField('isCreatingCustomAttribute', false);
    attributeReviewState.updateField('editingCustomAttributeId', null);
  };

  return (
    <div data-testid="attribute-review-step">
      <WizardFormSection
        title="Review Attributes"
        description="We've suggested attributes for your world. Click 'Customize' to modify any attribute, or 'Selected/Excluded' to include/exclude it. You can have up to 6 attributes total."
      >

      <div className="space-y-4 my-4">
        {attributeReviewState.data.localSuggestions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-lg mb-2">No attribute suggestions available</p>
            <p className="text-sm">You can add attributes to your world later in the world editor.</p>
          </div>
        ) : (
          attributeReviewState.data.localSuggestions.map((suggestion, index) => (
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
                    const newSuggestions = [...attributeReviewState.data.localSuggestions];
                    newSuggestions[index] = {
                      ...newSuggestions[index],
                      showDetails: !newSuggestions[index].showDetails
                    };
                    attributeReviewState.updateField('localSuggestions', newSuggestions);
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
          
          {attributeReviewState.data.customAttributes.length === 0 && !attributeReviewState.data.isCreatingCustomAttribute ? (
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
              {attributeReviewState.data.customAttributes.map((attribute) => (
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
          {attributeReviewState.data.isCreatingCustomAttribute && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border" data-testid="custom-attribute-editor">
              <AttributeEditor
                worldId={worldData.id || ''}
                mode={attributeReviewState.data.editingCustomAttributeId ? 'edit' : 'create'}
                attributeId={attributeReviewState.data.editingCustomAttributeId || undefined}
                existingAttributes={[...attributeReviewState.data.customAttributes, ...(worldData.attributes || [])]}
                maxAttributes={6}
                onSave={handleSaveCustomAttribute}
                onDelete={attributeReviewState.data.editingCustomAttributeId ? handleDeleteCustomAttribute : undefined}
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
