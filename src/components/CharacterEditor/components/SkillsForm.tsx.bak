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
    <div className="component-skills-form bg-background rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Skills</h2>
        <PointPoolDisplay pool={pool} label="Skill Points" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
              className="bg-muted rounded-lg p-4 border border-l-4 border-l-primary"
            >
              <div className="flex items-center gap-2 mb-1">
                <Label className="block text-sm font-medium">
                  {worldSkill?.name || `Skill ${index + 1}`}
                </Label>
                {worldSkill?.difficulty && (
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      worldSkill.difficulty === 'easy'
                        ? 'bg-green-100 text-green-800'
                        : worldSkill.difficulty === 'medium'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {worldSkill.difficulty}
                  </span>
                )}
              </div>
              {worldSkill?.description && (
                <p className="text-xs text-muted-foreground mb-2">
                  {worldSkill.description}
                </p>
              )}
              {cannotIncrease && currentValue < skill.maxValue && (
                <p className="text-xs text-amber-500 mb-2 font-medium">
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
              <div className="text-xs text-muted-foreground mt-1">
                Range: {skill.minValue} - {skill.maxValue}
                {worldSkill?.attributeIds &&
                  worldSkill.attributeIds.length > 0 && (
                    <span className="ml-2">
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
