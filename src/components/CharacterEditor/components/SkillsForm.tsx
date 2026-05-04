import React, { useCallback } from 'react';
import { World } from '@/types/world.types';
import RangeSlider from '@/components/ui/RangeSlider';
import { Label } from '@/components/ui/label';
import { useSkillPointPool } from '@/hooks/usePointPoolManager';
import { PointPoolDisplay } from './PointPoolDisplay';

interface CharacterSkill {
  skillId: string;
  level: number;
  experience: number;
  isActive: boolean;
}

interface SkillsFormProps {
  skills: CharacterSkill[];
  world: World;
  onSkillsChange: (skills: CharacterSkill[]) => void;
}

export const SkillsForm: React.FC<SkillsFormProps> = ({
  skills,
  world,
  onSkillsChange,
}) => {
  const {
    pool,
    skills: managedSkills,
    canIncrease,
    setValue,
  } = useSkillPointPool({
    totalPoints: world.settings.skillPointPool,
    skills: skills.map(skill => {
      const worldSkill = world.skills.find(ws => ws.id === skill.skillId);
      return {
        id: skill.skillId,
        value: skill.level,
        minValue: worldSkill?.minValue || 0,
        maxValue: worldSkill?.maxValue || 10,
        isSelected: true, // All skills in editor count toward pool
      };
    }),
  });

  const handleValueChange = useCallback((skillId: string, newValue: number) => {
    setValue(skillId, newValue);

    // Update parent with new values
    const newSkills = skills.map(skill => ({
      ...skill,
      level: skill.skillId === skillId ? newValue : skill.level,
    }));
    onSkillsChange(newSkills);
  }, [setValue, skills, onSkillsChange]);

  return (
    <div className="component-skills-form">
      <div className="skills-form-header">
        <h2>Skills</h2>
        <PointPoolDisplay pool={pool} label="Skill Points" />
      </div>

      <div className="skills-form-list">
        {managedSkills.map((skill, index) => {
          const uniqueKey = skill.id || `skill-${index}`;
          const worldSkill = world.skills.find(ws => ws.id === skill.id);
          const cannotIncrease = !canIncrease(skill.id);

          // Calculate effective max based on pool constraints
          const currentValue = skill.value;
          const effectiveMax = cannotIncrease
            ? currentValue  // Can't increase beyond current value if pool exhausted
            : skill.maxValue; // Can increase up to max if pool has points

          return (
            <div
              key={uniqueKey}
              className="skills-form-row"
            >
              <div className="skills-form-label-row">
                <Label>
                {worldSkill?.name || `Skill ${index + 1}`}
                </Label>
                {worldSkill?.difficulty && (
                  <span className="skills-form-difficulty">
                    {worldSkill.difficulty}
                  </span>
                )}
              </div>
              {worldSkill?.description && (
                <p className="skills-form-description">
                  {worldSkill.description}
                </p>
              )}
              {cannotIncrease && currentValue < skill.maxValue && (
                <p className="skills-form-constraint">
                  No points remaining. Reduce other skills to increase this one.
                </p>
              )}
              <RangeSlider
                value={skill.value}
                min={skill.minValue}
                max={skill.maxValue}
                effectiveMax={effectiveMax}
                isConstrained={cannotIncrease}
                onChange={newValue => handleValueChange(skill.id, newValue)}
                disabled={false}
                showLabel={false}
                testId={`skill-${skill.id}`}
              />
              <div className="skills-form-meta">
                Range: {skill.minValue} - {skill.maxValue}
                {worldSkill?.attributeIds &&
                  worldSkill.attributeIds.length > 0 && (
                    <span>
                    • Linked to:{' '}
                      {worldSkill.attributeIds
                        .map(
                          id => world.attributes.find(a => a.id === id)?.name
                        )
                        .filter(Boolean)
                        .join(', ') || 'Unknown'}
                    </span>
                  )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
