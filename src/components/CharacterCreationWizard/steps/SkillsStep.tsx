import React, { useEffect, useMemo } from 'react';
import {
  wizardStyles,
  WizardFormSection,
  ToggleButton
} from '@/components/shared/wizard';
import RangeSlider from '@/components/ui/RangeSlider';
import { World } from '@/types/world.types';
import { validateSkills } from '../utils/validation';
import { getSkillBounds as resolveSkillBounds } from '../utils/skillAllocation';

const MAX_SKILL_SELECTION_LIMIT = 8;

interface CharacterWizardSkill {
  skillId: string;
  name: string;
  description?: string;
  level: number;
  minLevel: number;
  maxLevel: number;
  attributeIds?: string[];
  isSelected: boolean;
}

interface SkillsStepData {
  characterData: {
    skills: CharacterWizardSkill[];
  };
  pointPools: {
    skills: {
      total: number;
      spent: number;
      remaining: number;
    };
  };
  validation: Record<number, {
    valid: boolean;
    touched: boolean;
    errors: string[];
  }>;
}

interface SkillsStepProps {
  data: SkillsStepData;
  onUpdate: (updates: Record<string, unknown>) => void;
  onValidation: (valid: boolean, errors: string[]) => void;
  worldConfig: World;
}

export const SkillsStep: React.FC<SkillsStepProps> = ({
  data,
  onUpdate,
  onValidation,
  worldConfig,
}) => {
  const totalSkillPoints = worldConfig?.settings?.skillPointPool ?? data.pointPools?.skills?.total ?? 0;
  const worldSkillBounds = useMemo(
    () =>
      (worldConfig?.skills || []).map(skill => ({
        id: skill.id,
        minValue: skill.minValue,
        maxValue: skill.maxValue,
      })),
    [worldConfig]
  );

  const {
    remainingPoints,
    spentPoints,
    costBySkillId,
    boundsBySkillId,
    maxAllowedLevelBySkillId,
    totalCapacity,
  } = useMemo(() => {
    const bounds = new Map<string, { minLevel: number; maxLevel: number }>();
    const costs = new Map<string, number>();

    let totalSpent = 0;
    let capacity = 0;

    data.characterData.skills.forEach(skill => {
      const { minLevel, maxLevel } = resolveSkillBounds(skill, worldConfig);
      bounds.set(skill.skillId, { minLevel, maxLevel });

      if (skill.isSelected) {
        const cost = Math.max(0, (skill.level ?? minLevel) - minLevel);
        costs.set(skill.skillId, cost);
        totalSpent += cost;
        capacity += Math.max(0, maxLevel - minLevel);
      } else {
        costs.set(skill.skillId, 0);
      }
    });

    const remaining = totalSkillPoints - totalSpent;

    const maxAllowed = new Map<string, number>();
    data.characterData.skills.forEach(skill => {
      const bound = bounds.get(skill.skillId);
      if (!bound) return;
      const allocated = costs.get(skill.skillId) ?? 0;
      const availableForSkill = Math.max(remaining + allocated, 0);
      const maxLevel = Math.min(bound.maxLevel, bound.minLevel + availableForSkill);
      maxAllowed.set(skill.skillId, maxLevel);
    });

    return {
      remainingPoints: remaining,
      spentPoints: totalSpent,
      costBySkillId: costs,
      boundsBySkillId: bounds,
      maxAllowedLevelBySkillId: maxAllowed,
      totalCapacity: capacity,
    };
  }, [data.characterData.skills, totalSkillPoints, worldConfig]);

  useEffect(() => {
    const validationResult = validateSkills(
      data.characterData.skills,
      totalSkillPoints,
      worldSkillBounds
    );

    const currentValidation = data.validation[3];
    const errorsChanged =
      !currentValidation ||
      currentValidation.errors.length !== validationResult.errors.length ||
      currentValidation.errors.some((error, index) => error !== validationResult.errors[index]);

    if (
      !currentValidation ||
      currentValidation.valid !== validationResult.valid ||
      errorsChanged
    ) {
      onValidation(validationResult.valid, validationResult.errors);
    }
  }, [
    data.characterData.skills,
    data.validation,
    onValidation,
    totalSkillPoints,
    worldSkillBounds
  ]);

  const hasUnallocatedPoints = remainingPoints > 0;
  const validation = data.validation[3];
  const showErrors = validation?.touched && !validation?.valid;
  const selectedSkills = data.characterData.skills.filter(skill => skill.isSelected);
  const maxSelectable = Math.min(worldConfig?.settings?.maxSkills ?? MAX_SKILL_SELECTION_LIMIT, MAX_SKILL_SELECTION_LIMIT);
  const handleSkillToggle = (skillId: string) => {
    const updatedSkills = data.characterData.skills.map(skill => {
      if (skill.skillId !== skillId) return skill;
      const bounds = boundsBySkillId.get(skillId) ?? resolveSkillBounds(skill, worldConfig);
      if (skill.isSelected) {
        return {
          ...skill,
          isSelected: false,
          level: bounds.minLevel,
        };
      }
      return {
        ...skill,
        isSelected: true,
        level: bounds.minLevel,
      };
    });

    onUpdate({ skills: updatedSkills });
  };
  const handleLevelChange = (skillId: string, level: number) => {
    const bounds = boundsBySkillId.get(skillId) ?? resolveSkillBounds(
      data.characterData.skills.find(skill => skill.skillId === skillId)!,
      worldConfig
    );
    if (!bounds) return;

    const maxAllowed = maxAllowedLevelBySkillId.get(skillId) ?? bounds.maxLevel;
    const clampedLevel = Math.max(bounds.minLevel, Math.min(maxAllowed, level));

    const updatedSkills = data.characterData.skills.map(skill => {
      if (skill.skillId !== skillId) return skill;
      if (!skill.isSelected) return skill;
      return {
        ...skill,
        level: clampedLevel,
      };
    });

    onUpdate({ skills: updatedSkills });
  };

  return (
    <div className="component-skills-step">
      <WizardFormSection
        title="Allocate Skill Points"
        description={`Choose up to ${maxSelectable} starting skills and distribute ${totalSkillPoints} skill points across them.`}
      >
      <div className="wizard-skill-intro">
        <p>
          Each selected skill starts at its minimum level. Increase levels to invest skill points.
          Unspent points are allowed if you want to create a less experienced character.
        </p>
      </div>

      <div className="wizard-skill-summary-row">
        <div className={wizardStyles.card.base}>
          <h3 className={wizardStyles.subheading}>Skill Points</h3>
          <div className="wizard-badge-row">
            <span className={wizardStyles.badge.secondary}>Total: {totalSkillPoints}</span>
            <span className={wizardStyles.badge.primary}>Spent: {Math.max(spentPoints, 0)}</span>
            <span className={wizardStyles.badge.secondary}>
              Remaining: {Math.max(remainingPoints, 0)}
            </span>
            {totalSkillPoints > totalCapacity && (
              <span className={wizardStyles.badge.secondary}>
                Cap: {totalCapacity}
              </span>
            )}
          </div>
        </div>

        <div className={`${wizardStyles.card.base}`}>
          <h3 className={wizardStyles.subheading}>Skill Selection</h3>
          <div className="wizard-badge-row">
            <span className={wizardStyles.badge.primary}>Selected: {selectedSkills.length}</span>
            <span className={wizardStyles.badge.secondary}>Maximum: {maxSelectable}</span>
          </div>
        </div>
      </div>

      <div className="wizard-skill-allocation-list">
        {data.characterData.skills.map((skill, index) => {
          const bounds = boundsBySkillId.get(skill.skillId) ?? resolveSkillBounds(skill, worldConfig);
          const cost = costBySkillId.get(skill.skillId) ?? 0;
          const safeKey = skill.skillId || `${skill.name}-${index}`;
          const maxAllowedLevel = maxAllowedLevelBySkillId.get(skill.skillId) ?? bounds.maxLevel;
          const skillTitleId = `skill-allocation-title-${safeKey}`;

          return (
          <div 
            key={safeKey}
            className={`${wizardStyles.card.base} wizard-skill-card ${skill.isSelected ? wizardStyles.card.selected : ''}`}
          >
            <div>
              <div className="wizard-skill-card-head">
                <div className="wizard-skill-card-info">
                  <span id={skillTitleId} >{skill.name}</span>
                  {skill.description && (
                    <p>{skill.description}</p>
                  )}
                  {skill.attributeIds && skill.attributeIds.length > 0 && worldConfig?.attributes && (
                    <div className="wizard-skill-card-linked">
                      Linked to:{' '}
                      {skill.attributeIds
                        .map(attrId => worldConfig.attributes?.find(attr => attr.id === attrId)?.name || 'Unknown')
                        .filter(name => name !== 'Unknown')
                        .join(', ') || 'Unknown attributes'}
                    </div>
                  )}
                </div>
                <ToggleButton
                  isActive={skill.isSelected}
                  activeLabel="Selected"
                  inactiveLabel="Not Selected"
                  onClick={() => handleSkillToggle(skill.skillId)}
                  testId={`skill-toggle-${safeKey}`}
                />
              </div>

              {skill.isSelected && (
                <div className="wizard-skill-level">
                  <div className="wizard-skill-level-row">
                    <span>Level: {skill.level}</span>
                    <span>Allocated Points: {cost}</span>
                  </div>
                  <RangeSlider
                    value={skill.level}
                    min={bounds.minLevel}
                    max={bounds.maxLevel}
                    effectiveMax={maxAllowedLevel}
                    showLabel={false}
                    onChange={(value) => handleLevelChange(skill.skillId, value)}
                    testId={`skill-level-slider-${safeKey}`}
                    isConstrained={maxAllowedLevel < bounds.maxLevel}
                    ariaLabelledBy={skillTitleId}
                  />
                  <div className="wizard-skill-level-row">
                    <span>Min: {bounds.minLevel}</span>
                    <span>Max: {bounds.maxLevel}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          );
        })}
      </div>

      {totalSkillPoints > 0 && hasUnallocatedPoints && (
        <div className={`${wizardStyles.card.base}`}>
          <p>
            {totalSkillPoints > totalCapacity
              ? 'Your skill point pool exceeds the current skill caps. You can maximize existing skills or leave points unspent.'
              : `You have ${remainingPoints} unspent skill points. Spending them will improve your character's capabilities. You can continue with the current allocation or invest more points.`}
          </p>
        </div>
      )}

      {remainingPoints < 0 && (
        <div className={wizardStyles.errorContainer}>
          <p className={wizardStyles.form.error}>
            You have allocated more skill points than available. Reduce one or more skill levels.
          </p>
        </div>
      )}

      {showErrors && (
        <div className={wizardStyles.errorContainer}>
          {validation.errors.map((error, index) => (
            <p key={index} className={wizardStyles.form.error}>
              {error}
            </p>
          ))}
        </div>
      )}
      </WizardFormSection>
    </div>
  );
};
