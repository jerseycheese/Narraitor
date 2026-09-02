'use client';

import React, { useState, useEffect } from 'react';
import { World, WorldSkill } from '@/types/world.types';
import { SkillSuggestion } from '@/types/ai-suggestions.types';
import { generateUniqueId } from '@/lib/utils/generateId';
import SkillRangeEditor from '@/components/forms/SkillRangeEditor';
import { SkillEditor } from '@/components/world/SkillEditor';
import { Checkbox } from '@/components/ui/checkbox';
import {
  MIN_SKILL_VALUE as SKILL_MIN_VALUE,
  MAX_SKILL_VALUE as SKILL_MAX_VALUE,
  SKILL_DEFAULT_VALUE,
} from '@/lib/constants/skillLevelDescriptions';
import { SKILL_DIFFICULTIES } from '@/lib/constants/skillDifficultyLevels';
import {
  wizardStyles,
  WizardFormSection,
  WizardFormGroup,
  WizardTextField,
  WizardTextArea,
  WizardSelect,
} from '@/components/shared/wizard';
import { Button } from '@/components/ui/button';
import type { AIGuidanceSource } from '@/lib/constants/worldGuidance';

interface ExtendedSkillSuggestion extends SkillSuggestion {
  showDetails?: boolean;
  selectedAttributeNames?: string[];
}

interface WorldDataWithMeta extends Partial<World> {
  aiSuggestionMeta?: {
    source: AIGuidanceSource;
    generatedAt?: string;
    descriptionSnapshot?: string;
  };
}

/**
 * Props for the SkillReviewStep component
 */
interface SkillReviewStepProps {
  /** Current world data being created */
  worldData: WorldDataWithMeta;
  /** AI-generated skill suggestions to review */
  suggestions: SkillSuggestion[];
  /** Validation errors for the form */
  errors: Record<string, string>;
  /** Callback to update world data */
  onUpdate: (updates: Partial<World>) => void;
  /** Callback to clear AI suggestions */
  onClearSuggestions?: () => void;
}

/** Maps a skill difficulty to its badge class names. */
const difficultyBadgeClass = (difficulty: string): string => {
  const variant =
    difficulty === 'easy'
      ? wizardStyles.badge.success
      : difficulty === 'medium'
        ? wizardStyles.badge.warning
        : wizardStyles.badge.danger;
  return `${wizardStyles.badge.base} ${variant}`;
};

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
  onClearSuggestions,
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
      .map(
        (name) => worldData.attributes?.find((attr) => attr.name === name)?.id
      )
      .filter(Boolean) as string[];
  };

  /**
   * Helper function to merge accepted AI skills with custom skills
   *
   * This centralizes the merge logic to ensure consistency across all handlers
   * and reduces code duplication. Uses stable IDs to prevent unnecessary re-renders.
   *
   * @param acceptedSuggestions - AI-generated skill suggestions that are accepted
   * @param customSkillsList - Custom skills to merge (defaults to current state)
   * @returns Combined array of accepted AI skills and custom skills
   */
  const mergeAllSkills = (
    acceptedSuggestions: ExtendedSkillSuggestion[],
    customSkillsList = customSkills
  ): WorldSkill[] => {
    const acceptedAISkills: WorldSkill[] = acceptedSuggestions
      .filter((s) => s.accepted)
      .map((s) => {
        // Use stable ID based on skill name to prevent unnecessary re-renders
        const existingSkill = worldData.skills?.find(
          (skill) => skill.name === s.name
        );
        return {
          id: existingSkill?.id || generateUniqueId('skill'),
          worldId: '',
          name: s.name,
          description: s.description,
          difficulty: s.difficulty,
          category: s.category,
          baseValue: SKILL_DEFAULT_VALUE,
          minValue: SKILL_MIN_VALUE,
          maxValue: SKILL_MAX_VALUE,
          attributeIds: convertAttributeNamesToIds(
            s.selectedAttributeNames || s.linkedAttributeNames || []
          ),
        };
      });

    return [...acceptedAISkills, ...customSkillsList];
  };

  // Custom skill management state - initialize from existing world data when editing
  const [customSkills, setCustomSkills] = useState<WorldSkill[]>(() => {
    // When editing, identify existing custom skills (those not in AI suggestions)
    if (worldData.skills && worldData.skills.length > 0) {
      const suggestionNames = new Set(suggestions.map((s) => s.name));
      return worldData.skills.filter(
        (skill) => !suggestionNames.has(skill.name)
      );
    }
    return [];
  });
  const [isCreatingCustomSkill, setIsCreatingCustomSkill] = useState(false);
  const [editingCustomSkillId, setEditingCustomSkillId] = useState<
    string | null
  >(null);
  const [showClearConfirmation, setShowClearConfirmation] = useState(false);

  /**
   * Helper function to initialize a suggestion with original values for modification tracking
   */
  const initializeSuggestionWithTracking = (
    suggestion: SkillSuggestion,
    accepted: boolean,
    showDetails: boolean
  ): ExtendedSkillSuggestion => {
    const initialAttributeNames = suggestion.linkedAttributeNames || [];

    return {
      ...suggestion,
      accepted,
      showDetails,
      selectedAttributeNames: initialAttributeNames,
      // Store original values for modification tracking
      originalName: suggestion.originalName || suggestion.name,
      originalDescription:
        suggestion.originalDescription || suggestion.description,
      originalDifficulty:
        suggestion.originalDifficulty || suggestion.difficulty,
      isModified: false,
    };
  };

  /**
   * Initialize local suggestions state with all skills accepted by default
   *
   * This provides a better UX by starting with all AI suggestions selected,
   * allowing users to deselect what they don't want rather than having to
   * manually select everything they do want.
   */
  const [localSuggestions, setLocalSuggestions] = useState<
    ExtendedSkillSuggestion[]
  >(() => {
    // Start with all suggestions accepted by default for better UX
    return suggestions.map((suggestion, index) => {
      // Use the suggestion's accepted value, defaulting to true if not specified
      const accepted =
        suggestion.accepted !== undefined ? suggestion.accepted : true;
      const showDetails = index === 0; // Show details only for the first one

      return initializeSuggestionWithTracking(
        suggestion,
        accepted,
        showDetails
      );
    });
  });

  // Update local state only on initial load or when suggestions change
  useEffect(() => {
    // This should only run on initial mount or when suggestions change from parent
    // Not on every worldData update to prevent overriding user toggles
    if (suggestions.length > 0) {
      const newSuggestions = suggestions.map((suggestion, index) => {
        // Use the suggestion's accepted value, defaulting to true if not specified
        const accepted =
          suggestion.accepted !== undefined ? suggestion.accepted : true;
        const showDetails = index === 0; // Show details for the first one

        return initializeSuggestionWithTracking(
          suggestion,
          accepted,
          showDetails
        );
      });

      setLocalSuggestions(newSuggestions);

      // Automatically save the initially selected skills to parent state
      const acceptedSkills = newSuggestions
        .filter((s) => s.accepted)
        .map((s) => ({
          id: generateUniqueId('skill'),
          worldId: '',
          name: s.name,
          description: s.description,
          difficulty: s.difficulty,
          category: s.category,
          baseValue: SKILL_DEFAULT_VALUE,
          minValue: SKILL_MIN_VALUE,
          maxValue: SKILL_MAX_VALUE,
          attributeIds: convertAttributeNamesToIds(
            s.selectedAttributeNames || s.linkedAttributeNames || []
          ),
        }));

      // Only update if we don't already have skills or if the count is different
      if (
        !worldData.skills ||
        worldData.skills.length !== acceptedSkills.length
      ) {
        onUpdate({ ...worldData, skills: acceptedSkills });
      }
    } else {
      // Clear AI suggestions when they are removed (preserves custom skills)
      setLocalSuggestions([]);

      // Update worldData to only contain custom skills (preserving user's manual work)
      // Only update if skills have actually changed to prevent infinite loop
      const currentSkillIds = (worldData.skills || [])
        .map((s) => s.id)
        .sort()
        .join(',');
      const customSkillIds = customSkills
        .map((s) => s.id)
        .sort()
        .join(',');

      if (currentSkillIds !== customSkillIds) {
        onUpdate({ ...worldData, skills: customSkills });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suggestions]); // Only depend on suggestions, not worldData.skills

  const handleToggleSkill = (index: number) => {
    // Toggle the state in a new array
    const updatedSuggestions = [...localSuggestions];
    const currentSuggestion = updatedSuggestions[index];

    updatedSuggestions[index] = {
      ...currentSuggestion,
      accepted: !currentSuggestion.accepted,
      // Keep existing isModified state - modification status persists
    };

    // Update local state
    setLocalSuggestions(updatedSuggestions);

    // Calculate and update world skills immediately
    const allSkills = mergeAllSkills(updatedSuggestions, customSkills);
    onUpdate({ ...worldData, skills: allSkills });
  };

  /**
   * Helper function to check if a skill has been modified from its original values
   */
  const isSkillModified = (suggestion: ExtendedSkillSuggestion): boolean => {
    return (
      suggestion.name !== suggestion.originalName ||
      suggestion.description !== suggestion.originalDescription ||
      suggestion.difficulty !== suggestion.originalDifficulty
    );
  };

  const handleModifySkill = (
    index: number,
    field: keyof SkillSuggestion,
    value: string
  ) => {
    const updatedSuggestions = [...localSuggestions];
    const updatedSuggestion = { ...updatedSuggestions[index], [field]: value };

    // Check if the skill is now modified
    updatedSuggestion.isModified = isSkillModified(updatedSuggestion);

    updatedSuggestions[index] = updatedSuggestion;
    setLocalSuggestions(updatedSuggestions);

    // Calculate and update world skills immediately
    const allSkills = mergeAllSkills(updatedSuggestions, customSkills);
    onUpdate({ ...worldData, skills: allSkills });
  };

  const handleAttributeToggle = (skillIndex: number, attributeName: string) => {
    const updatedSuggestions = [...localSuggestions];
    const currentAttributes =
      updatedSuggestions[skillIndex].selectedAttributeNames || [];

    let newAttributes: string[];
    if (currentAttributes.includes(attributeName)) {
      // Remove attribute
      newAttributes = currentAttributes.filter(
        (name) => name !== attributeName
      );
    } else {
      // Add attribute
      newAttributes = [...currentAttributes, attributeName];
    }

    updatedSuggestions[skillIndex] = {
      ...updatedSuggestions[skillIndex],
      selectedAttributeNames: newAttributes,
    };

    setLocalSuggestions(updatedSuggestions);

    // Calculate and update world skills immediately
    const allSkills = mergeAllSkills(updatedSuggestions, customSkills);
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
      updatedCustomSkills = customSkills.map((s) =>
        s.id === editingCustomSkillId ? skill : s
      );
    } else {
      // Add new custom skill
      updatedCustomSkills = [...customSkills, skill];
    }

    setCustomSkills(updatedCustomSkills);
    setIsCreatingCustomSkill(false);
    setEditingCustomSkillId(null);

    // Recalculate world skills
    const allSkills = mergeAllSkills(localSuggestions, updatedCustomSkills);
    onUpdate({ ...worldData, skills: allSkills });
  };

  const handleEditCustomSkill = (skillId: string) => {
    setEditingCustomSkillId(skillId);
    setIsCreatingCustomSkill(true);
  };

  const handleDeleteCustomSkill = (skillId: string) => {
    const updatedCustomSkills = customSkills.filter((s) => s.id !== skillId);
    setCustomSkills(updatedCustomSkills);

    // Recalculate world skills
    const allSkills = mergeAllSkills(localSuggestions, updatedCustomSkills);
    onUpdate({ ...worldData, skills: allSkills });
  };

  const handleCancelCustomSkill = () => {
    setIsCreatingCustomSkill(false);
    setEditingCustomSkillId(null);
  };

  const handleClearSuggestions = () => {
    if (onClearSuggestions) {
      onClearSuggestions();
      setShowClearConfirmation(false);
    }
  };

  const showClearButton =
    worldData.aiSuggestionMeta?.source === 'ai' && suggestions.length > 0;

  const acceptedCount =
    localSuggestions.filter((s) => s.accepted).length + customSkills.length;

  return (
    <div data-testid="skill-review-step">
      <WizardFormSection
        title="Review Skills"
        description="Keep the skills that fit your world. At least one, up to 12."
        dataTutorial="skill-editor"
      >
        {showClearButton && (
          <div>
            <Button
              type="button"
              onClick={() => setShowClearConfirmation(true)}
              variant="outline"
              size="sm"
              data-testid="clear-ai-suggestions-button"
            >
              Clear Suggestions
            </Button>
          </div>
        )}

        <div className="wizard-review-list">
          {(localSuggestions.length > 0 || customSkills.length > 0) && (
            <div
              className="wizard-difficulty-legend"
              data-testid="skill-difficulty-legend"
            >
              <span className="wizard-difficulty-legend-label">Difficulty</span>
              {SKILL_DIFFICULTIES.map((difficulty) => (
                <span
                  key={difficulty.value}
                  className={difficultyBadgeClass(difficulty.value)}
                  title={difficulty.description}
                >
                  {difficulty.label}
                </span>
              ))}
            </div>
          )}
          <div className="wizard-review-suggestions">
            {localSuggestions.length === 0 ? (
              <div className="wizard-empty-state">
                <p>No skill suggestions available</p>
                <p>
                  You can add skills to your world later in the world editor.
                </p>
              </div>
            ) : (
              localSuggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className={`${wizardStyles.card.base} wizard-review-card`}
                  data-testid={`skill-card-${index}`}
                  {...(index === 0
                    ? { 'data-tutorial': 'skill-suggestions' }
                    : {})}
                >
                  <div className="wizard-review-card-head">
                    <div className="wizard-review-card-meta">
                      <span>{suggestion.name}</span>
                      <span className={difficultyBadgeClass(suggestion.difficulty)}>
                        {suggestion.difficulty}
                      </span>
                      {suggestion.isModified && <span>Modified</span>}
                      {suggestion.selectedAttributeNames &&
                        suggestion.selectedAttributeNames.length > 0 && (
                          <span>
                            Linked:{' '}
                            {suggestion.selectedAttributeNames.join(', ')}
                          </span>
                        )}
                    </div>

                    <div className="wizard-review-card-tools">
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          const newSuggestions = [...localSuggestions];
                          newSuggestions[index] = {
                            ...newSuggestions[index],
                            showDetails: !newSuggestions[index].showDetails,
                          };
                          setLocalSuggestions(newSuggestions);
                        }}
                      >
                        {suggestion.showDetails ? 'Hide details' : 'Customize'}
                      </Button>
                      <Button
                        type="button"
                        data-testid={`skill-toggle-${index}`}
                        onClick={() => handleToggleSkill(index)}
                        variant={suggestion.accepted ? 'default' : 'outline'}
                        size="sm"
                      >
                        {suggestion.accepted ? 'Selected' : 'Excluded'}
                      </Button>
                    </div>
                  </div>

                  {suggestion.showDetails && (
                    <div
                      key={`skill-expanded-${index}`}
                      className="wizard-review-card-detail"
                    >
                      <WizardFormGroup label="Name">
                        <WizardTextField
                          value={suggestion.name}
                          onChange={(value) =>
                            handleModifySkill(index, 'name', value)
                          }
                          testId={`skill-name-input-${index}`}
                        />
                      </WizardFormGroup>

                      <WizardFormGroup label="Description">
                        <WizardTextArea
                          value={suggestion.description}
                          onChange={(value) =>
                            handleModifySkill(index, 'description', value)
                          }
                          rows={2}
                          testId={`skill-description-textarea-${index}`}
                        />
                      </WizardFormGroup>

                      <div className="wizard-review-detail-row">
                        <div>
                          <WizardFormGroup label="Difficulty">
                            <WizardSelect
                              value={suggestion.difficulty}
                              onChange={(value) =>
                                handleModifySkill(index, 'difficulty', value)
                              }
                              options={SKILL_DIFFICULTIES.map((difficulty) => ({
                                value: difficulty.value,
                                label: difficulty.label,
                              }))}
                              testId={`skill-difficulty-select-${index}`}
                            />
                          </WizardFormGroup>
                        </div>

                        <div>
                          <WizardFormGroup label="Linked Attributes">
                            <div className="form-help-text">
                              Select one or more attributes this skill depends
                              on
                            </div>
                            <div
                              className="wizard-skill-attr-grid"
                              data-testid={`skill-attributes-${index}`}
                            >
                              {worldData.attributes &&
                              worldData.attributes.length > 0 ? (
                                worldData.attributes.map((attribute) => (
                                  <div
                                    key={attribute.id}
                                    className="wizard-skill-attr-option"
                                  >
                                    <Checkbox
                                      id={`skill-${index}-attribute-${attribute.id}`}
                                      checked={
                                        suggestion.selectedAttributeNames?.includes(
                                          attribute.name
                                        ) || false
                                      }
                                      onChange={() =>
                                        handleAttributeToggle(
                                          index,
                                          attribute.name
                                        )
                                      }
                                      label={attribute.name}
                                      data-testid={`skill-${index}-attribute-${attribute.name}-checkbox`}
                                    />
                                    {attribute.description && (
                                      <div>{attribute.description}</div>
                                    )}
                                  </div>
                                ))
                              ) : (
                                <p>
                                  No attributes available. Skills will not be
                                  linked to any attributes.
                                </p>
                              )}
                            </div>
                          </WizardFormGroup>
                        </div>
                      </div>

                      {/* Default Value Range Editor */}
                      <div>
                        {/* Create a temporary skill object for the range editor */}
                        {worldData.skills?.some(
                          (skill) => skill.name === suggestion.name
                        ) && (
                          <SkillRangeEditor
                            skill={{
                              id:
                                worldData.skills.find(
                                  (skill) => skill.name === suggestion.name
                                )?.id || '',
                              worldId: '',
                              name: suggestion.name,
                              description: suggestion.description,
                              difficulty: suggestion.difficulty,
                              baseValue:
                                worldData.skills.find(
                                  (skill) => skill.name === suggestion.name
                                )?.baseValue || SKILL_DEFAULT_VALUE,
                              minValue: SKILL_MIN_VALUE,
                              maxValue: SKILL_MAX_VALUE,
                              category: suggestion.category,
                              attributeIds:
                                worldData.skills.find(
                                  (skill) => skill.name === suggestion.name
                                )?.attributeIds || [],
                            }}
                            onChange={(updates) => {
                              // Find the skill in the worldData and update it
                              const updatedSkills = worldData.skills?.map(
                                (skill) => {
                                  if (skill.name === suggestion.name) {
                                    return { ...skill, ...updates };
                                  }
                                  return skill;
                                }
                              );
                              onUpdate({ ...worldData, skills: updatedSkills });
                            }}
                            showLevelDescriptions={true}
                          />
                        )}

                        <div>
                          <p>Values range from 1 (Novice) to 5 (Master).</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Custom Skills Section */}
          <div className="wizard-review-custom" data-tutorial="skill-custom">
            <div className="wizard-review-custom-head">
              <div className="wizard-review-custom-heading">
                <h3 className="wizard-subheading">Custom Skills</h3>
                <p>
                  Create your own unique skills for this world ({acceptedCount}
                  /12 slots used)
                </p>
              </div>
              <Button
                type="button"
                onClick={handleAddCustomSkill}
                size="sm"
                data-testid="add-custom-skill-button"
                disabled={acceptedCount >= 12}
              >
                + Add Custom Skill
              </Button>
            </div>

            {customSkills.length === 0 && !isCreatingCustomSkill ? (
              <div className="wizard-empty-state">
                <p>No custom skills yet</p>
                <p>
                  {acceptedCount < 12
                    ? `You have ${12 - acceptedCount} skill slot${12 - acceptedCount !== 1 ? 's' : ''} available for custom skills`
                    : 'Remove some suggested skills to add custom ones'}
                </p>
              </div>
            ) : (
              <div className="wizard-review-custom-list">
                {customSkills.map((skill) => (
                  <div
                    key={skill.id}
                    className={`${wizardStyles.card.base} wizard-review-card`}
                    data-testid={`custom-skill-card-${skill.id}`}
                  >
                    <div className="wizard-review-card-head">
                      <div className="wizard-review-card-meta">
                        <span>{skill.name}</span>
                        <span>Custom</span>
                        <span className={difficultyBadgeClass(skill.difficulty)}>
                          {skill.difficulty}
                        </span>
                        {skill.attributeIds &&
                          skill.attributeIds.length > 0 && (
                            <span>
                                                          Linked:{' '}
                                                          {skill.attributeIds
                                                            .map(
                                                              (attrId) =>
                                                                worldData.attributes?.find(
                                                                  (attr) => attr.id === attrId
                                                                )?.name
                                                            )
                                                            .filter(Boolean)
                                                            .join(', ')}                            </span>
                          )}
                      </div>
                      <div className="wizard-review-card-tools">
                        <Button
                          type="button"
                          onClick={() => handleEditCustomSkill(skill.id)}
                          variant="link"
                          size="sm"
                          data-testid={`edit-custom-skill-${skill.id}`}
                        >
                          Edit
                        </Button>
                        <Button
                          type="button"
                          onClick={() => handleDeleteCustomSkill(skill.id)}
                          variant="destructive"
                          size="sm"
                          data-testid={`delete-custom-skill-${skill.id}`}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                    <div className="wizard-review-card-detail">{skill.description}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Custom Skill Editor */}
            {isCreatingCustomSkill && (
              <div className="wizard-custom-editor" data-testid="custom-skill-editor">
                <SkillEditor
                  worldId={worldData.id || ''}
                  mode={editingCustomSkillId ? 'edit' : 'create'}
                  skillId={editingCustomSkillId || undefined}
                  existingSkills={[
                    ...customSkills,
                    ...(worldData.skills || []),
                  ]}
                  existingAttributes={worldData.attributes || []}
                  maxSkills={12}
                  onSave={handleSaveCustomSkill}
                  onDelete={
                    editingCustomSkillId ? handleDeleteCustomSkill : undefined
                  }
                  onCancel={handleCancelCustomSkill}
                />
              </div>
            )}
          </div>
        </div>

        <div
          className="wizard-slot-summary"
          data-testid="skill-count-summary"
          data-tutorial="skill-summary"
        >
          <div className="wizard-slot-summary-text">
            <div className="wizard-slot-summary-count">
              <span>Skills Selected: {acceptedCount} / 12</span>
              {acceptedCount >= 12 && <span>(Maximum reached)</span>}
            </div>
            <div className="wizard-slot-summary-note">
              {acceptedCount < 12
                ? `${12 - acceptedCount} slot${12 - acceptedCount !== 1 ? 's' : ''} available`
                : 'All slots filled'}
            </div>
          </div>
          <div className="wizard-slot-meter-wrap">
            <div className="wizard-slot-meter">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className={
                    i < acceptedCount
                      ? 'wizard-slot-cell wizard-slot-cell-filled'
                      : 'wizard-slot-cell'
                  }
                />
              ))}
            </div>
          </div>
        </div>
      </WizardFormSection>

      {errors.skills && (
        <div className={wizardStyles.form.error}>{errors.skills}</div>
      )}

      {/* Clear Suggestions Confirmation Dialog */}
      {showClearConfirmation && (
        <div
          className="wizard-dialog-overlay"
          data-testid="clear-suggestions-dialog"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="clear-skills-dialog-title"
        >
          <div className="wizard-dialog-panel">
            <h3 id="clear-skills-dialog-title">Clear Suggestions?</h3>
            <p>
              This will remove all skill suggestions. You can still add custom
              skills or regenerate suggestions later.
            </p>
            <div className="wizard-dialog-actions">
              <Button
                type="button"
                onClick={() => setShowClearConfirmation(false)}
                variant="outline"
                size="sm"
                data-testid="cancel-clear-button"
                autoFocus
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleClearSuggestions}
                variant="destructive"
                size="sm"
                data-testid="confirm-clear-button"
              >
                Clear Suggestions
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
