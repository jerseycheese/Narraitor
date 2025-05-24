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
import { 
  wizardStyles,
  WizardFormSection,
  WizardFormGroup,
  WizardTextField,
  WizardTextArea,
  WizardSelect
} from '@/components/shared/wizard';

interface SkillReviewStepProps {
  worldData: Partial<World>;
  suggestions: SkillSuggestion[];
  errors: Record<string, string>;
  onUpdate: (updates: Partial<World>) => void;
}

export default function SkillReviewStep({
  worldData,
  suggestions,
  errors,
  onUpdate,
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


  const acceptedCount = localSuggestions.filter(s => s.accepted).length;

  return (
    <div data-testid="skill-review-step">
      <WizardFormSection
        title="Review Skills"
        description="Based on your description, we've suggested these skills. You can accept, modify, or reject each one. Select up to 12 skills for your world."
      >

      <div className="space-y-4">
        {localSuggestions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-lg mb-2">No skill suggestions available</p>
            <p className="text-sm">You can add skills to your world later in the world editor.</p>
          </div>
        ) : (
          localSuggestions.map((suggestion, index) => (
          <div 
            key={index} 
            className={wizardStyles.card.base} 
            data-testid={`skill-card-${index}`}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {suggestion.name}
                </span>
                <span className={`${wizardStyles.badge.base} ${
                  suggestion.difficulty === 'easy' ? wizardStyles.badge.success :
                  suggestion.difficulty === 'medium' ? wizardStyles.badge.warning : 
                  wizardStyles.badge.danger
                }`}>
                  {suggestion.difficulty}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
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
                <button
                  type="button"
                  data-testid={`skill-toggle-${index}`}
                  onClick={() => handleToggleSkill(index)}
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
                key={`skill-expanded-${index}`}
                className="mt-4 pl-7">
                <WizardFormGroup label="Name">
                  <WizardTextField
                    value={suggestion.name}
                    onChange={(value) => handleModifySkill(index, 'name', value)}
                    testId={`skill-name-input-${index}`}
                  />
                </WizardFormGroup>
                
                <WizardFormGroup label="Description">
                  <WizardTextArea
                    value={suggestion.description}
                    onChange={(value) => handleModifySkill(index, 'description', value)}
                    rows={2}
                    testId={`skill-description-textarea-${index}`}
                  />
                </WizardFormGroup>
                
                <div className="flex gap-4">
                  <div className="flex-1">
                    <WizardFormGroup label="Learning Curve">
                      <WizardSelect
                        value={suggestion.difficulty}
                        onChange={(value) => handleModifySkill(index, 'difficulty', value)}
                        options={SKILL_DIFFICULTIES.map(difficulty => ({
                          value: difficulty.value,
                          label: difficulty.label
                        }))}
                        testId={`skill-difficulty-select-${index}`}
                      />
                    </WizardFormGroup>
                  </div>
                  
                  <div className="flex-1">
                    <WizardFormGroup label="Linked Attribute">
                      <WizardSelect
                        value={suggestion.linkedAttributeName || ''}
                        onChange={(value) => handleModifySkill(index, 'linkedAttributeName', value)}
                        options={[
                          { value: '', label: 'None' },
                          ...(worldData.attributes?.map((attr) => ({
                            value: attr.name,
                            label: attr.name
                          })) || [])
                        ]}
                        testId={`skill-attribute-select-${index}`}
                      />
                    </WizardFormGroup>
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
          ))
        )}
      </div>

      <div className="mt-4" data-testid="skill-count-summary">
        Selected skills: {acceptedCount} / 12
      </div>
      </WizardFormSection>

      {errors.skills && (
        <div className={wizardStyles.form.error}>{errors.skills}</div>
      )}

    </div>
  );
}

