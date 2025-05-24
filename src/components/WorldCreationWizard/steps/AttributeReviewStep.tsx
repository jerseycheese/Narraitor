'use client';

import React, { useState, useEffect } from 'react';
import { World, WorldAttribute } from '@/types/world.types';
import { AttributeSuggestion } from '../WorldCreationWizard';
import { generateUniqueId } from '@/lib/utils/generateId';
import AttributeRangeEditor from '@/components/forms/AttributeRangeEditor';
import { wizardStyles, WizardFormSection } from '@/components/shared/wizard';

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
  // Initialize state based on existing selections
  const [localSuggestions, setLocalSuggestions] = useState(() => {
    // If we have existing attributes in worldData, match them to suggestions
    if (worldData.attributes && worldData.attributes.length > 0) {
      return suggestions.map(suggestion => {
        const existingAttr = worldData.attributes?.find(attr => attr.name === suggestion.name);
        return {
          ...suggestion,
          accepted: true, // Always default to true
          showDetails: suggestions.indexOf(suggestion) === 0, // Show details for the first one
          baseValue: existingAttr?.baseValue ?? Math.floor((suggestion.minValue + suggestion.maxValue) / 2),
        };
      });
    }
    return suggestions.map((suggestion, index) => ({
      ...suggestion,
      baseValue: Math.floor((suggestion.minValue + suggestion.maxValue) / 2),
      accepted: true, // Set to accepted by default
      showDetails: index === 0, // Show details only for the first one
    }));
  });

  // Update local state only on initial load or when suggestions change
  useEffect(() => {
    // This should only run on initial mount or when suggestions change from parent
    // Not on every worldData update to prevent overriding user toggles
    if (suggestions.length > 0) {
      setLocalSuggestions(suggestions.map(suggestion => {
        const existingAttr = worldData.attributes?.find(attr => attr.name === suggestion.name);
        // Always default to true (all attributes selected by default)
        const accepted = true;
        // For the first attribute, show details by default to give user a clue
        return {
          ...suggestion,
          accepted,
          showDetails: suggestions.indexOf(suggestion) === 0, // Show details for the first one
          baseValue: existingAttr?.baseValue ?? Math.floor((suggestion.minValue + suggestion.maxValue) / 2),
        };
      }));
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
    
    // Update parent state
    onUpdate({ ...worldData, attributes: acceptedAttributes });
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
    
    onUpdate({ ...worldData, attributes: acceptedAttributes });
  };


  const acceptedCount = localSuggestions.filter(s => s.accepted).length;

  return (
    <div data-testid="attribute-review-step">
      <WizardFormSection
        title="Review Attributes"
        description="Based on your description, we've suggested these attributes. You can accept, modify, or reject each one. Select up to 6 attributes for your world."
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
            className="border p-4 rounded" 
            data-testid={`attribute-card-${index}`}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {suggestion.name}
                </span>
                {/* Add a details toggle button */}
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
                  {suggestion.showDetails ? 'Hide details' : 'Show details'}
                </button>
              </div>
              
              <button
                type="button"
                data-testid={`attribute-toggle-${index}`}
                onClick={() => handleToggleAttribute(index)}
                className={`px-3 py-1 rounded-full ${
                  suggestion.accepted 
                    ? 'bg-green-100 text-green-700 border border-green-300' 
                    : 'bg-gray-100 text-gray-500 border border-gray-300'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              >
                {suggestion.accepted ? 'Selected ✓' : 'Excluded'}
              </button>
            </div>
            
            {suggestion.showDetails && (
              <div 
                key={`attribute-expanded-${index}`}
                className="mt-4 pl-7"
                onClick={(e) => e.stopPropagation()} // Prevent toggling when interacting with inputs
              >
                <div className="mb-3">
                  <label className="block mb-1">Name</label>
                  <input
                    type="text"
                    data-testid={`attribute-name-input-${index}`}
                    value={suggestion.name}
                    onChange={(e) => handleModifyAttribute(index, 'name', e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                </div>
                
                <div className="mb-3">
                  <label className="block mb-1">Description</label>
                  <textarea
                    data-testid={`attribute-description-textarea-${index}`}
                    value={suggestion.description}
                    onChange={(e) => handleModifyAttribute(index, 'description', e.target.value)}
                    rows={2}
                    className="w-full p-2 border rounded"
                  />
                </div>

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
      </div>

      <div className="mt-4" data-testid="attribute-count-summary">
        Selected attributes: {acceptedCount} / 6
      </div>
      </WizardFormSection>

      {errors.attributes && (
        <div className={wizardStyles.form.error}>{errors.attributes}</div>
      )}

    </div>
  );
}