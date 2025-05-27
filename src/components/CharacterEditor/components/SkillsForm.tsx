import React from 'react';

interface CharacterSkill {
  id: string;
  characterId: string;
  name: string;
  level: number;
  category?: string;
}

interface SkillsFormProps {
  skills: CharacterSkill[];
  onSkillsChange: (skills: CharacterSkill[]) => void;
}

export const SkillsForm: React.FC<SkillsFormProps> = ({
  skills,
  onSkillsChange
}) => {
  const handleSkillChange = (skillId: string, level: number) => {
    const newSkills = skills.map(skill =>
      skill.id === skillId ? { ...skill, level } : skill
    );
    onSkillsChange(newSkills);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">Skills</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {skills.map((skill) => (
          <div key={skill.id}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {skill.name}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={10}
                value={skill.level}
                onChange={(e) => handleSkillChange(skill.id, parseInt(e.target.value))}
                className="flex-1"
              />
              <span className="w-12 text-center font-medium">{skill.level}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};