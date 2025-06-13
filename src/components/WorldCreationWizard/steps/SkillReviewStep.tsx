'use client';

import React, { useState, useEffect } from 'react';
import { World, WorldSkill } from '@/types/world.types';
import { SkillSuggestion } from '../WorldCreationWizard';
import { generateUniqueId } from '@/lib/utils/generateId';
import SkillRangeEditor from '@/components/forms/SkillRangeEditor';
import { SkillEditor } from '@/components/world/SkillEditor';
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

interface ExtendedSkillSuggestion extends SkillSuggestion {
  showDetails?: boolean;
  selectedAttributeNames?: string[];
}

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
  // Helper function to convert attribute names to IDs
  const convertAttributeNamesToIds = (attributeNames: string[]): string[] => {
    return attributeNames
      .map(name => worldData.attributes?.find(attr => attr.name === name)?.id)
      .filter(Boolean) as string[];
  };

  // Custom skill management state
  const [customSkills, setCustomSkills] = useState<WorldSkill[]>([]);
  const [isCreatingCustomSkill, setIsCreatingCustomSkill] = useState(false);
  const [editingCustomSkillId, setEditingCustomSkillId] = useState<string | null>(null);

  // Initialize state based on existing selections - always accept all by default
  const [localSuggestions, setLocalSuggestions] = useState<ExtendedSkillSuggestion[]>(() => {
    // Start with all suggestions accepted by default
    return suggestions.map((suggestion, index) => {
      // If we have existing skills in worldData, match them to suggestions
      // Note: We're always setting accepted to true, but we check for existing skill for future flexibility
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const existingSkill = worldData.skills?.find(skill => skill.name === suggestion.name);
      
      // Initialize with multi-attribute support
      const initialAttributeNames = suggestion.linkedAttributeNames || 
        (suggestion.linkedAttributeName ? [suggestion.linkedAttributeName] : []);
      
      return {
        ...suggestion,
        // Always default to true (accepted) - only set to false if explicitly rejected before
        accepted: true,
        showDetails: index === 0, // Show details only for the first one
        selectedAttributeNames: initialAttributeNames
      };
    });
  });


  // Update local state only on initial load or when suggestions change
  useEffect(() => {
    // This should only run on initial mount or when suggestions change from parent
    // Not on every worldData update to prevent overriding user toggles
    if (suggestions.length > 0) {
      const newSuggestions = suggestions.map((suggestion, index) => {
        // Note: We're always setting accepted to true, but we check for existing skill for future flexibility
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const existingSkill = worldData.skills?.find(skill => skill.name === suggestion.name);
        // ALWAYS default to accepted (true) for better UX
        const accepted = true;
        
        // Initialize with multi-attribute support
        const initialAttributeNames = suggestion.linkedAttributeNames || 
          (suggestion.linkedAttributeName ? [suggestion.linkedAttributeName] : []);
        
        return {
          ...suggestion,
          accepted,
          showDetails: index === 0, // Show details for the first one
          selectedAttributeNames: initialAttributeNames
        };
      });
      
      setLocalSuggestions(newSuggestions);
      
      // Automatically save the initially selected skills to parent state
      const acceptedSkills = newSuggestions
        .filter(s => s.accepted)
        .map(s => ({
          id: generateUniqueId('skill'),
          worldId: '',
          name: s.name,
          description: s.description,
          difficulty: s.difficulty,
          category: s.category,
          baseValue: SKILL_DEFAULT_VALUE,
          minValue: SKILL_MIN_VALUE,
          maxValue: SKILL_MAX_VALUE,
          attributeIds: convertAttributeNamesToIds(s.selectedAttributeNames || s.linkedAttributeNames || (s.linkedAttributeName ? [s.linkedAttributeName] : [])),
        }));
      
      // Only update if we don't already have skills or if the count is different
      if (!worldData.skills || worldData.skills.length !== acceptedSkills.length) {
        onUpdate({ ...worldData, skills: acceptedSkills });
      }
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
    
    // Calculate and update world skills immediately
    const acceptedAISkills: WorldSkill[] = updatedSuggestions
      .filter(s => s.accepted)
      .map(s => ({
        id: generateUniqueId('skill'),
        worldId: '',
        name: s.name,
        description: s.description,
        difficulty: s.difficulty,
        category: s.category,
        baseValue: SKILL_DEFAULT_VALUE,
        minValue: SKILL_MIN_VALUE,
        maxValue: SKILL_MAX_VALUE,
        attributeIds: convertAttributeNamesToIds(s.selectedAttributeNames || s.linkedAttributeNames || (s.linkedAttributeName ? [s.linkedAttributeName] : [])),
      }));
    
    const allSkills = [...acceptedAISkills, ...customSkills];
    onUpdate({ ...worldData, skills: allSkills });
  };

  const handleModifySkill = (index: number, field: keyof SkillSuggestion, value: string) => {
    const updatedSuggestions = [...localSuggestions];
    updatedSuggestions[index] = { ...updatedSuggestions[index], [field]: value };
    setLocalSuggestions(updatedSuggestions);
    
    // Calculate and update world skills immediately
    const acceptedAISkills: WorldSkill[] = updatedSuggestions
      .filter(s => s.accepted)
      .map(s => ({
        id: generateUniqueId('skill'),
        worldId: '',
        name: s.name,
        description: s.description,
        difficulty: s.difficulty,
        category: s.category,
        baseValue: SKILL_DEFAULT_VALUE,
        minValue: SKILL_MIN_VALUE,
        maxValue: SKILL_MAX_VALUE,
        attributeIds: convertAttributeNamesToIds(s.selectedAttributeNames || s.linkedAttributeNames || (s.linkedAttributeName ? [s.linkedAttributeName] : [])),
      }));
    
    const allSkills = [...acceptedAISkills, ...customSkills];
    onUpdate({ ...worldData, skills: allSkills });
  };

  const handleAttributeToggle = (skillIndex: number, attributeName: string) => {
    const updatedSuggestions = [...localSuggestions];
    const currentAttributes = updatedSuggestions[skillIndex].selectedAttributeNames || [];
    
    let newAttributes: string[];
    if (currentAttributes.includes(attributeName)) {
      // Remove attribute
      newAttributes = currentAttributes.filter(name => name !== attributeName);
    } else {
      // Add attribute
      newAttributes = [...currentAttributes, attributeName];
    }
    
    updatedSuggestions[skillIndex] = {
      ...updatedSuggestions[skillIndex],
      selectedAttributeNames: newAttributes
    };
    
    setLocalSuggestions(updatedSuggestions);
    
    // Calculate and update world skills immediately
    const acceptedAISkills: WorldSkill[] = updatedSuggestions
      .filter(s => s.accepted)
      .map(s => ({
        id: generateUniqueId('skill'),
        worldId: '',
        name: s.name,
        description: s.description,
        difficulty: s.difficulty,
        category: s.category,
        baseValue: SKILL_DEFAULT_VALUE,
        minValue: SKILL_MIN_VALUE,
        maxValue: SKILL_MAX_VALUE,
        attributeIds: convertAttributeNamesToIds(s.selectedAttributeNames || s.linkedAttributeNames || (s.linkedAttributeName ? [s.linkedAttributeName] : [])),
      }));
    
    const allSkills = [...acceptedAISkills, ...customSkills];
    onUpdate({ ...worldData, skills: allSkills });
  };

  // Custom skill handlers
  const handleAddCustomSkill = () => {
    setIsCreatingCustomSkill(true);
    setEditingCustomSkillId(null);
  };

  const handleSaveCustomSkill = (skill: WorldSkill) => {
    let updatedCustomSkills: WorldSkill[];
    
    if (editingCustomSkillId) {
      // Edit existing custom skill
      updatedCustomSkills = customSkills.map(s => s.id === editingCustomSkillId ? skill : s);
    } else {
      // Add new custom skill
      updatedCustomSkills = [...customSkills, skill];
    }
    
    setCustomSkills(updatedCustomSkills);
    setIsCreatingCustomSkill(false);
    setEditingCustomSkillId(null);
    
    // Recalculate world skills
    const acceptedAISkills: WorldSkill[] = localSuggestions
      .filter(s => s.accepted)
      .map(s => ({
        id: generateUniqueId('skill'),
        worldId: '',
        name: s.name,
        description: s.description,
        difficulty: s.difficulty,
        category: s.category,
        baseValue: SKILL_DEFAULT_VALUE,
        minValue: SKILL_MIN_VALUE,
        maxValue: SKILL_MAX_VALUE,
        attributeIds: convertAttributeNamesToIds(s.selectedAttributeNames || s.linkedAttributeNames || (s.linkedAttributeName ? [s.linkedAttributeName] : [])),
      }));
    
    const allSkills = [...acceptedAISkills, ...updatedCustomSkills];
    onUpdate({ ...worldData, skills: allSkills });
  };

  const handleEditCustomSkill = (skillId: string) => {
    setEditingCustomSkillId(skillId);
    setIsCreatingCustomSkill(true);
  };

  const handleDeleteCustomSkill = (skillId: string) => {
    const updatedCustomSkills = customSkills.filter(s => s.id !== skillId);
    setCustomSkills(updatedCustomSkills);
    
    // Recalculate world skills
    const acceptedAISkills: WorldSkill[] = localSuggestions
      .filter(s => s.accepted)
      .map(s => ({
        id: generateUniqueId('skill'),
        worldId: '',
        name: s.name,
        description: s.description,
        difficulty: s.difficulty,
        category: s.category,
        baseValue: SKILL_DEFAULT_VALUE,
        minValue: SKILL_MIN_VALUE,
        maxValue: SKILL_MAX_VALUE,
        attributeIds: convertAttributeNamesToIds(s.selectedAttributeNames || s.linkedAttributeNames || (s.linkedAttributeName ? [s.linkedAttributeName] : [])),
      }));
    
    const allSkills = [...acceptedAISkills, ...updatedCustomSkills];
    onUpdate({ ...worldData, skills: allSkills });
  };

  const handleCancelCustomSkill = () => {
    setIsCreatingCustomSkill(false);
    setEditingCustomSkillId(null);
  };


  const acceptedCount = localSuggestions.filter(s => s.accepted).length + customSkills.length;

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
              <div className="flex items-center gap-2 flex-wrap">
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
                {suggestion.selectedAttributeNames && suggestion.selectedAttributeNames.length > 0 && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    Linked: {suggestion.selectedAttributeNames.join(', ')}
                  </span>
                )}
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
                    <WizardFormGroup label="Linked Attributes">
                      <div className="text-sm text-gray-600 mb-3">
                        Select one or more attributes this skill depends on
                      </div>
                      <div className="space-y-2" data-testid={`skill-attributes-${index}`}>
                        {worldData.attributes && worldData.attributes.length > 0 ? (
                          worldData.attributes.map((attribute) => (
                            <div key={attribute.id} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={`skill-${index}-attribute-${attribute.id}`}
                                checked={suggestion.selectedAttributeNames?.includes(attribute.name) || false}
                                onChange={() => handleAttributeToggle(index, attribute.name)}
                                className="rounded border-gray-300 focus:ring-blue-500"
                                data-testid={`skill-${index}-attribute-${attribute.name}-checkbox`}
                              />
                              <label 
                                htmlFor={`skill-${index}-attribute-${attribute.id}`}
                                className="text-sm font-normal cursor-pointer"
                              >
                                {attribute.name}
                              </label>
                              {attribute.description && (
                                <span className="text-xs text-gray-500">
                                  - {attribute.description}
                                </span>
                              )}
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500 italic">
                            No attributes available. Skills will not be linked to any attributes.
                          </p>
                        )}
                      </div>
                      {suggestion.selectedAttributeNames && suggestion.selectedAttributeNames.length > 0 && (
                        <div className="mt-2 text-xs text-blue-600">
                          Selected: {suggestion.selectedAttributeNames.join(', ')}
                        </div>
                      )}
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
                        attributeIds: worldData.skills.find(skill => skill.name === suggestion.name)?.attributeIds || []
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
        
        {/* Custom Skills Section */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Custom Skills</h3>
            <button
              type="button"
              onClick={handleAddCustomSkill}
              className={`${wizardStyles.navigation.primaryButton} text-sm`}
              data-testid="add-custom-skill-button"
              disabled={acceptedCount >= 12}
            >
              + Add Custom Skill
            </button>
          </div>
          
          {customSkills.length === 0 && !isCreatingCustomSkill ? (
            <div className="text-center py-6 text-gray-500">
              <p className="text-sm">No custom skills created yet.</p>
              <p className="text-xs">Use the button above to add skills unique to your world.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {customSkills.map((skill) => (
                <div
                  key={skill.id}
                  className={`${wizardStyles.card.base} border-l-4 border-l-blue-500`}
                  data-testid={`custom-skill-card-${skill.id}`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{skill.name}</span>
                      <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                        Custom
                      </span>
                      <span className={`${wizardStyles.badge.base} ${
                        skill.difficulty === 'easy' ? wizardStyles.badge.success :
                        skill.difficulty === 'medium' ? wizardStyles.badge.warning : 
                        wizardStyles.badge.danger
                      }`}>
                        {skill.difficulty}
                      </span>
                      {skill.attributeIds && skill.attributeIds.length > 0 && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          Linked: {skill.attributeIds.map(attrId => 
                            worldData.attributes?.find(attr => attr.id === attrId)?.name
                          ).filter(Boolean).join(', ')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditCustomSkill(skill.id)}
                        className="text-sm text-blue-600 hover:underline"
                        data-testid={`edit-custom-skill-${skill.id}`}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCustomSkill(skill.id)}
                        className="text-sm text-red-600 hover:underline"
                        data-testid={`delete-custom-skill-${skill.id}`}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    {skill.description}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Custom Skill Editor */}
          {isCreatingCustomSkill && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border" data-testid="custom-skill-editor">
              <SkillEditor
                worldId={worldData.id || ''}
                mode={editingCustomSkillId ? 'edit' : 'create'}
                skillId={editingCustomSkillId || undefined}
                existingSkills={[...customSkills, ...(worldData.skills || [])]}
                existingAttributes={worldData.attributes || []}
                maxSkills={12}
                onSave={handleSaveCustomSkill}
                onDelete={editingCustomSkillId ? handleDeleteCustomSkill : undefined}
                onCancel={handleCancelCustomSkill}
              />
            </div>
          )}
        </div>
      </div>

      <div className="mt-4" data-testid="skill-count-summary">
        Selected skills: {acceptedCount} / 12
        {acceptedCount >= 12 && (
          <span className="text-xs text-amber-600 ml-2">
            (Maximum reached)
          </span>
        )}
      </div>
      </WizardFormSection>

      {errors.skills && (
        <div className={wizardStyles.form.error}>{errors.skills}</div>
      )}

    </div>
  );
}

