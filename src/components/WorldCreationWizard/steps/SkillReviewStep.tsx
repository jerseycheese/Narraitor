'use client';

import React, { useState, useEffect } from 'react';
import { World, WorldSkill } from '@/types/world.types';
import { SkillSuggestion } from '../WorldCreationWizard';
import { generateUniqueId } from '@/lib/utils/generateId';
import SkillRangeEditor from '@/components/forms/SkillRangeEditor';
import { SkillEditor } from '@/components/world/SkillEditor';
import { Checkbox } from '@/components/ui/checkbox';
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

/**
 * Props for the SkillReviewStep component
 */
interface SkillReviewStepProps {
  /** Current world data being created */
  worldData: Partial<World>;
  /** AI-generated skill suggestions to review */
  suggestions: SkillSuggestion[];
  /** Validation errors for the form */
  errors: Record<string, string>;
  /** Callback to update world data */
  onUpdate: (updates: Partial<World>) => void;
}

/**
 * SkillReviewStep - World Creation Wizard step for reviewing and customizing skills
 * 
 * This component allows users to:
 * - Review AI-generated skill suggestions
 * - Accept/reject suggested skills
 * - Customize skill properties (name, description, difficulty, linked attributes)
 * - Create custom skills from scratch
 * - Manage multi-attribute skill linking
 * 
 * Key features:
 * - Up to 12 skills total (suggested + custom)
 * - Multi-attribute linking support for complex skills
 * - Real-time validation and progress tracking
 * - Intuitive UX with "Customize" buttons and progress indicators
 * 
 * @param props - Component props
 * @returns JSX element for the skill review step
 */
export default function SkillReviewStep({
  worldData,
  suggestions,
  errors,
  onUpdate,
}: SkillReviewStepProps) {
  /**
   * Helper function to convert attribute names to IDs for skill linking
   * 
   * This is necessary because the UI works with human-readable attribute names,
   * but the data model requires attribute IDs for proper relational linking.
   * 
   * @param attributeNames - Array of attribute names to convert
   * @returns Array of corresponding attribute IDs
   */
  const convertAttributeNamesToIds = (attributeNames: string[]): string[] => {
    return attributeNames
      .map(name => worldData.attributes?.find(attr => attr.name === name)?.id)
      .filter(Boolean) as string[];
  };

  // Custom skill management state
  const [customSkills, setCustomSkills] = useState<WorldSkill[]>([]);
  const [isCreatingCustomSkill, setIsCreatingCustomSkill] = useState(false);
  const [editingCustomSkillId, setEditingCustomSkillId] = useState<string | null>(null);

  /**
   * Initialize local suggestions state with all skills accepted by default
   * 
   * This provides a better UX by starting with all AI suggestions selected,
   * allowing users to deselect what they don't want rather than having to
   * manually select everything they do want.
   */
  const [localSuggestions, setLocalSuggestions] = useState<ExtendedSkillSuggestion[]>(() => {
    // Start with all suggestions accepted by default for better UX
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
        description="We've suggested skills for your world. Click 'Customize' to modify any skill, or 'Selected/Excluded' to include/exclude it. You can have up to 12 skills total."
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
                            <div key={attribute.id} className="space-y-1">
                              <Checkbox
                                id={`skill-${index}-attribute-${attribute.id}`}
                                checked={suggestion.selectedAttributeNames?.includes(attribute.name) || false}
                                onChange={() => handleAttributeToggle(index, attribute.name)}
                                label={attribute.name}
                                data-testid={`skill-${index}-attribute-${attribute.name}-checkbox`}
                              />
                              {attribute.description && (
                                <div className="ml-6 text-xs text-gray-500">
                                  {attribute.description}
                                </div>
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
            <div>
              <h3 className="text-lg font-medium text-gray-900">Custom Skills</h3>
              <p className="text-sm text-gray-600">
                Create your own unique skills for this world ({acceptedCount}/12 slots used)
              </p>
            </div>
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
            <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <p className="text-sm text-gray-600 mb-2">No custom skills yet</p>
              <p className="text-xs text-gray-500">
                {acceptedCount < 12 
                  ? `You have ${12 - acceptedCount} skill slot${12 - acceptedCount !== 1 ? 's' : ''} available for custom skills`
                  : 'Remove some suggested skills to add custom ones'
                }
              </p>
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

      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200" data-testid="skill-count-summary">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-sm font-medium text-blue-900">
              Skills Selected: {acceptedCount} / 12
            </span>
            {acceptedCount >= 12 && (
              <span className="text-xs text-amber-600 ml-2">
                (Maximum reached)
              </span>
            )}
          </div>
          <div className="text-xs text-blue-700">
            {acceptedCount < 12 
              ? `${12 - acceptedCount} slot${12 - acceptedCount !== 1 ? 's' : ''} available`
              : 'All slots filled'
            }
          </div>
        </div>
        <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
            style={{ width: `${(acceptedCount / 12) * 100}%` }}
          ></div>
        </div>
      </div>
      </WizardFormSection>

      {errors.skills && (
        <div className={wizardStyles.form.error}>{errors.skills}</div>
      )}

    </div>
  );
}

