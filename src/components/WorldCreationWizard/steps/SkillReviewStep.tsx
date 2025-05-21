'use client';

import React, { useState, useEffect } from 'react';
import { World, WorldSkill } from '@/types/world.types';
import { SkillSuggestion } from '../WorldCreationWizard';
import { generateUniqueId } from '@/lib/utils/generateId';
import SkillRangeEditor from '@/components/forms/SkillRangeEditor';
import { 
  MIN_SKILL_VALUE as SKILL_MIN_VALUE, 
  MAX_SKILL_VALUE as SKILL_MAX_VALUE, 
  SKILL_DEFAULT_VALUE 
} from '@/lib/constants/skillLevelDescriptions';
import {
  SKILL_DIFFICULTIES
} from '@/lib/constants/skillDifficultyLevels';

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
  // Initialize state based on existing selections - always accept all by default
  const [localSuggestions, setLocalSuggestions] = useState(() => {
    // Start with all suggestions accepted by default
    return suggestions.map((suggestion, index) => {
      // If we have existing skills in worldData, match them to suggestions
      // Note: We're always setting accepted to true, but we check for existing skill for future flexibility
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const existingSkill = worldData.skills?.find(skill => skill.name === suggestion.name);
      return {
        ...suggestion,
        // Always default to true (accepted) - only set to false if explicitly rejected before
        accepted: true,
        showDetails: index === 0 // Show details only for the first one
      };
    });
  });

  // Update local state only on initial load or when suggestions change
  useEffect(() => {
    // This should only run on initial mount or when suggestions change from parent
    // Not on every worldData update to prevent overriding user toggles
    if (suggestions.length > 0) {
      setLocalSuggestions(suggestions.map((suggestion, index) => {
        // Note: We're always setting accepted to true, but we check for existing skill for future flexibility
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const existingSkill = worldData.skills?.find(skill => skill.name === suggestion.name);
        // ALWAYS default to accepted (true) for better UX
        const accepted = true;
        return {
          ...suggestion,
          accepted,
          showDetails: index === 0 // Show details for the first one
        };
      }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suggestions]); // Only depend on suggestions, not worldData.skills

  const handleToggleSkill = (index: number) => {
    // Toggle the state in a new array
    const updatedSuggestions = [...localSuggestions];
    updatedSuggestions[index] = {
      ...updatedSuggestions[index],
      accepted: !updatedSuggestions[index].accepted
    };
    
    // Update local state
    setLocalSuggestions(updatedSuggestions);
    
    // Convert to WorldSkill objects for the store
    const acceptedSkills: WorldSkill[] = updatedSuggestions
      .filter(s => s.accepted)
      .map(s => ({
        id: generateUniqueId('skill'),
        worldId: '',
        name: s.name,
        description: s.description,
        difficulty: s.difficulty,
        category: s.category,
        baseValue: SKILL_DEFAULT_VALUE, // Default to middle value
        minValue: SKILL_MIN_VALUE, // Fixed value
        maxValue: SKILL_MAX_VALUE, // Fixed value
        linkedAttributeId: s.linkedAttributeName ? 
          worldData.attributes?.find(attr => attr.name === s.linkedAttributeName)?.id : 
          undefined,
      }));
    
    // Update parent state
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
        baseValue: SKILL_DEFAULT_VALUE, // Default to middle value
        minValue: SKILL_MIN_VALUE, // Fixed value
        maxValue: SKILL_MAX_VALUE, // Fixed value
        linkedAttributeId: s.linkedAttributeName ? 
          worldData.attributes?.find(attr => attr.name === s.linkedAttributeName)?.id : 
          undefined,
      }));
    
    onUpdate({ ...worldData, skills: acceptedSkills });
  };

  const validateAndNext = () => {
    // Check if more than 12 skills are selected
    if (localSuggestions.filter(s => s.accepted).length > 12) {
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
        baseValue: SKILL_DEFAULT_VALUE, // Default to middle value
        minValue: SKILL_MIN_VALUE, // Fixed value
        maxValue: SKILL_MAX_VALUE, // Fixed value
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
          <div 
            key={index} 
            className="border p-4 rounded" 
            data-testid={`skill-card-${index}`}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  data-testid={`skill-toggle-${index}`}
                  onClick={() => handleToggleSkill(index)}
                  className={`px-3 py-1 rounded-full ${
                    suggestion.accepted 
                      ? 'bg-green-100 text-green-700 border border-green-300' 
                      : 'bg-gray-100 text-gray-500 border border-gray-300'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                >
                  {suggestion.accepted ? 'Selected ✓' : 'Excluded'}
                </button>
                <span className="font-medium">
                  {suggestion.name}
                </span>
                <span className={`px-2 py-1 rounded text-xs text-white uppercase font-medium ${
                  suggestion.difficulty === 'easy' ? 'bg-green-500' :
                  suggestion.difficulty === 'medium' ? 'bg-yellow-500' : 
                  'bg-red-500'
                }`}>
                  {suggestion.difficulty}
                </span>
              </div>
              
              {/* Add a details toggle button */}
              <button 
                type="button" 
                className="text-sm text-blue-600 hover:underline focus:outline-none ml-2"
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
            
            {suggestion.showDetails && (
              <div 
                key={`skill-expanded-${index}`}
                className="mt-4 pl-7">
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
                      {SKILL_DIFFICULTIES.map(difficulty => (
                        <option key={difficulty.value} value={difficulty.value}>
                          {difficulty.label}
                        </option>
                      ))}
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
                
                {/* Default Value Range Editor */}
                <div className="mt-4">
                  {/* Create a temporary skill object for the range editor */}
                  {worldData.skills?.some(skill => skill.name === suggestion.name) && (
                    <SkillRangeEditor
                      skill={{
                        id: worldData.skills.find(skill => skill.name === suggestion.name)?.id || '',
                        worldId: '',
                        name: suggestion.name,
                        description: suggestion.description,
                        difficulty: suggestion.difficulty,
                        baseValue: worldData.skills.find(skill => skill.name === suggestion.name)?.baseValue || SKILL_DEFAULT_VALUE,
                        minValue: SKILL_MIN_VALUE,
                        maxValue: SKILL_MAX_VALUE,
                        category: suggestion.category,
                        linkedAttributeId: worldData.skills.find(skill => skill.name === suggestion.name)?.linkedAttributeId
                      }}
                      onChange={(updates) => {
                        // Find the skill in the worldData and update it
                        const updatedSkills = worldData.skills?.map(skill => {
                          if (skill.name === suggestion.name) {
                            return { ...skill, ...updates };
                          }
                          return skill;
                        });
                        onUpdate({ ...worldData, skills: updatedSkills });
                      }}
                      showLevelDescriptions={true}
                    />
                  )}
                  
                  <div className="text-xs text-gray-500">
                    <p>Values range from 1 (Novice) to 5 (Master).</p>
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

