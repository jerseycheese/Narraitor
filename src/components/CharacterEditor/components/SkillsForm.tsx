import React from 'react';
import { World } from '@/types/world.types';
import RangeSlider from '@/components/ui/RangeSlider';
import { Label } from '@/components/ui/label';

interface CharacterSkill {
  skillId: string;      // ← Actual structure from store
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
  onSkillsChange
}) => {
  const handleSkillChange = (skillId: string, level: number) => {
    const newSkills = skills.map(skill =>
      skill.skillId === skillId ? { ...skill, level } : skill
    );
    onSkillsChange(newSkills);
  };

  return (
    <div className="bg-background rounded-lg p-6">
      <h2 className="text-xl font-bold mb-4">Skills</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {skills.map((skill, index) => {
          // Ensure we have a unique key
          const uniqueKey = skill.skillId || `skill-${index}`;
          const worldSkill = world.skills.find(ws => ws.id === skill.skillId);
          const minValue = worldSkill?.minValue || 0;
          const maxValue = worldSkill?.maxValue || 10;
          
          return (
            <div key={uniqueKey} className="bg-muted rounded-lg p-4 border border-l-4 border-l-primary">
              <div className="flex items-center gap-2 mb-1">
                <Label className="block text-sm font-medium">
                  {worldSkill?.name || `Skill ${index + 1}`}
                </Label>
                {worldSkill?.difficulty && (
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    worldSkill.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                    worldSkill.difficulty === 'medium' ? 'bg-amber-100 text-amber-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {worldSkill.difficulty}
                  </span>
                )}
              </div>
              {worldSkill?.description && (
                <p className="text-xs text-muted-foreground mb-2">{worldSkill.description}</p>
              )}
              <RangeSlider
                value={skill.level}
                min={minValue}
                max={maxValue}
                onChange={(value) => handleSkillChange(skill.skillId, value)}
                showLabel={false}
                testId={`skill-${skill.skillId}`}
              />
              <div className="text-xs text-muted-foreground mt-1">
                Range: {minValue} - {maxValue}
                {worldSkill?.attributeIds && worldSkill.attributeIds.length > 0 && (
                  <span className="ml-2">
                    • Linked to: {worldSkill.attributeIds
                      .map(id => world.attributes.find(a => a.id === id)?.name)
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
