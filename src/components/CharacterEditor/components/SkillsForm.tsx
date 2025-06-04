import React from 'react';
import { World } from '@/types/world.types';

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
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">Skills</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {skills.map((skill, index) => {
          // Ensure we have a unique key
          const uniqueKey = skill.skillId || `skill-${index}`;
          const worldSkill = world.skills.find(ws => ws.id === skill.skillId);
          const minValue = worldSkill?.minValue || 0;
          const maxValue = worldSkill?.maxValue || 10;
          
          return (
            <div key={uniqueKey}>
              <div className="flex items-center gap-2 mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  {worldSkill?.name || `Skill ${index + 1}`}
                </label>
                {worldSkill?.difficulty && (
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    worldSkill.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                    worldSkill.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {worldSkill.difficulty}
                  </span>
                )}
              </div>
              {worldSkill?.description && (
                <p className="text-xs text-gray-500 mb-2">{worldSkill.description}</p>
              )}
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={minValue}
                  max={maxValue}
                  value={skill.level}
                  onChange={(e) => handleSkillChange(skill.skillId, parseInt(e.target.value))}
                  className="flex-1"
                />
                <span className="w-12 text-center font-medium">{skill.level}</span>
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Range: {minValue} - {maxValue}
                {worldSkill?.linkedAttributeId && (
                  <span className="ml-2">
                    • Linked to: {world.attributes.find(a => a.id === worldSkill.linkedAttributeId)?.name || 'Unknown'}
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
