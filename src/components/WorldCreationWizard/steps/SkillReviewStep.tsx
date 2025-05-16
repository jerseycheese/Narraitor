'use client';

import React, { useState, useEffect } from 'react';
import { World, WorldSkill } from '@/types/world.types';
import { SkillSuggestion } from '../WorldCreationWizard';
import { generateUniqueId } from '@/lib/utils/generateId';

interface SkillReviewStepProps {
  worldData: Partial<World>;
  suggestions: SkillSuggestion[];
  errors: Record<string, string>;
  onUpdate: (updates: Partial<World>) => void;
  onNext: () => void;
  onBack: () => void;
  onCancel: () => void;
}

export default function SkillReviewStep({
  worldData,
  suggestions,
  errors,
  onUpdate,
  onNext,
  onBack,
  onCancel,
}: SkillReviewStepProps) {
  // Initialize state based on existing selections
  const [localSuggestions, setLocalSuggestions] = useState(() => {
    // If we have existing skills in worldData, match them to suggestions
    if (worldData.skills && worldData.skills.length > 0) {
      return suggestions.map(suggestion => {
        const existingSkill = worldData.skills?.find(skill => skill.name === suggestion.name);
        return {
          ...suggestion,
          accepted: !!existingSkill
        };
      });
    }
    return [...suggestions];
  });

  // Update local state when suggestions prop changes
  useEffect(() => {
    if (suggestions.length > 0) {
      setLocalSuggestions(suggestions.map(suggestion => {
        const existingSkill = worldData.skills?.find(skill => skill.name === suggestion.name);
        return {
          ...suggestion,
          accepted: !!existingSkill
        };
      }));
    }
  }, [suggestions, worldData.skills]);

  const handleToggleSkill = (index: number) => {
    const updatedSuggestions = [...localSuggestions];
    updatedSuggestions[index].accepted = !updatedSuggestions[index].accepted;
    setLocalSuggestions(updatedSuggestions);
    
    // Update the worldData with accepted skills
    const acceptedSkills: WorldSkill[] = updatedSuggestions
      .filter(s => s.accepted)
      .map(s => ({
        id: generateUniqueId('skill'),
        worldId: '', // Will be set when world is created
        name: s.name,
        description: s.description,
        difficulty: s.difficulty,
        category: s.category,
        // Map linkedAttributeName to an actual attribute ID if needed
        linkedAttributeId: s.linkedAttributeName ? 
          worldData.attributes?.find(attr => attr.name === s.linkedAttributeName)?.id : 
          undefined,
      }));
    
    onUpdate({ ...worldData, skills: acceptedSkills });
  };

  const handleModifySkill = (index: number, field: keyof SkillSuggestion, value: string) => {
    const updatedSuggestions = [...localSuggestions];
    updatedSuggestions[index] = { ...updatedSuggestions[index], [field]: value };
    setLocalSuggestions(updatedSuggestions);
    
    // Re-calculate accepted skills
    const acceptedSkills: WorldSkill[] = updatedSuggestions
      .filter(s => s.accepted)
      .map(s => ({
        id: generateUniqueId('skill'),
        worldId: '',
        name: s.name,
        description: s.description,
        difficulty: s.difficulty,
        category: s.category,
        linkedAttributeId: s.linkedAttributeName ? 
          worldData.attributes?.find(attr => attr.name === s.linkedAttributeName)?.id : 
          undefined,
      }));
    
    onUpdate({ ...worldData, skills: acceptedSkills });
  };

  const validateAndNext = () => {
    const acceptedCount = localSuggestions.filter(s => s.accepted).length;
    
    // Check if more than 12 skills are selected
    if (acceptedCount > 12) {
      // Don't proceed if validation fails
      return;
    }
    
    // Update the world data with accepted skills
    const acceptedSkills: WorldSkill[] = localSuggestions
      .filter(s => s.accepted)
      .map(s => ({
        id: generateUniqueId('skill'),
        worldId: '',
        name: s.name,
        description: s.description,
        difficulty: s.difficulty,
        category: s.category,
        linkedAttributeId: s.linkedAttributeName ?
          worldData.attributes?.find(attr => attr.name === s.linkedAttributeName)?.id :
          undefined,
      }));
    
    onUpdate({ ...worldData, skills: acceptedSkills });
    
    onNext();
  };

  const acceptedCount = localSuggestions.filter(s => s.accepted).length;

  return (
    <div data-testid="skill-review-step">
      <h2 className="text-xl font-bold mb-4">Review Skills</h2>
      <p className="mb-4">
        Based on your description, we&apos;ve suggested these skills. You can accept, modify, or reject each one. Select up to 12 skills for your world.
      </p>

      <div className="space-y-4">
        {localSuggestions.map((suggestion, index) => (
          <div key={index} className="border p-4 rounded" data-testid={`skill-card-${index}`}>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`skill-${index}`}
                data-testid={`skill-checkbox-${index}`}
                checked={suggestion.accepted}
                onChange={() => handleToggleSkill(index)}
                className="w-5 h-5"
              />
              <label htmlFor={`skill-${index}`} className="font-medium flex-1">
                {suggestion.name}
              </label>
              <span className={`px-2 py-1 rounded text-xs text-white uppercase font-medium ${
                suggestion.difficulty === 'easy' ? 'bg-green-500' :
                suggestion.difficulty === 'medium' ? 'bg-yellow-500' : 
                'bg-red-500'
              }`}>
                {suggestion.difficulty}
              </span>
            </div>
            
            {suggestion.accepted && (
              <div className="mt-4 pl-7">
                <div className="mb-3">
                  <label className="block mb-1">Name</label>
                  <input
                    type="text"
                    data-testid={`skill-name-input-${index}`}
                    value={suggestion.name}
                    onChange={(e) => handleModifySkill(index, 'name', e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                </div>
                
                <div className="mb-3">
                  <label className="block mb-1">Description</label>
                  <textarea
                    data-testid={`skill-description-textarea-${index}`}
                    value={suggestion.description}
                    onChange={(e) => handleModifySkill(index, 'description', e.target.value)}
                    rows={2}
                    className="w-full p-2 border rounded"
                  />
                </div>
                
                <div className="flex gap-4 mb-3">
                  <div className="flex-1">
                    <label className="block mb-1">Learning Curve</label>
                    <select
                      data-testid={`skill-difficulty-select-${index}`}
                      value={suggestion.difficulty}
                      onChange={(e) => handleModifySkill(index, 'difficulty', e.target.value)}
                      className="w-full p-2 border rounded"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                  
                  <div className="flex-1">
                    <label className="block mb-1">Linked Attribute</label>
                    <select
                      data-testid={`skill-attribute-select-${index}`}
                      value={suggestion.linkedAttributeName || ''}
                      onChange={(e) => handleModifySkill(index, 'linkedAttributeName', e.target.value)}
                      className="w-full p-2 border rounded"
                    >
                      <option value="">None</option>
                      {worldData.attributes?.map((attr) => (
                        <option key={attr.id} value={attr.name}>
                          {attr.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4" data-testid="skill-count-summary">
        Selected skills: {acceptedCount} / 12
      </div>

      {errors.skills && (
        <div className="text-red-500">{errors.skills}</div>
      )}

      <div className="flex justify-between mt-6">
        <button
          type="button"
          data-testid="step-back-button"
          onClick={onBack}
          className="px-4 py-2 border rounded"
        >
          Back
        </button>
        <button
          type="button"
          data-testid="step-cancel-button"
          onClick={onCancel}
          className="px-4 py-2 border rounded"
        >
          Cancel
        </button>
        <button
          type="button"
          data-testid="step-next-button"
          onClick={validateAndNext}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Next
        </button>
      </div>
    </div>
  );
}

