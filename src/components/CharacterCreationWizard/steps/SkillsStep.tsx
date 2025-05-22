import React from 'react';
import { RangeSlider } from '@/components/ui/RangeSlider';

interface SkillsStepProps {
  data: any;
  onUpdate: (updates: any) => void;
  onValidation: (valid: boolean, errors: string[]) => void;
  worldConfig: any;
}

export const SkillsStep: React.FC<SkillsStepProps> = ({
  data,
  onUpdate,
  onValidation,
}) => {
  const selectedSkills = data.characterData.skills.filter(skill => skill.isSelected);

  const handleSkillToggle = (skillId: string) => {
    const updatedSkills = data.characterData.skills.map(skill =>
      skill.skillId === skillId ? { ...skill, isSelected: !skill.isSelected } : skill
    );
    onUpdate({ skills: updatedSkills });
  };

  const handleSkillLevelChange = (skillId: string, level: number) => {
    const updatedSkills = data.characterData.skills.map(skill =>
      skill.skillId === skillId ? { ...skill, level } : skill
    );
    onUpdate({ skills: updatedSkills });
  };

  const validation = data.validation[2];
  const showErrors = validation?.touched && !validation?.valid;

  return (
    <div className="space-y-6">
      {/* Skill selection info */}
      <div className="bg-gray-100 p-4 rounded">
        <h3 className="font-semibold mb-2">Skill Selection</h3>
        <div className="text-sm">
          <p>Selected: {selectedSkills.length} / 8 maximum</p>
          <p className="text-gray-600 mt-1">Choose skills that define your character's abilities</p>
        </div>
      </div>

      {/* Skills list */}
      <div className="space-y-4">
        {data.characterData.skills.map((skill) => (
          <div key={skill.skillId} className="border rounded p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={skill.isSelected}
                  onChange={() => handleSkillToggle(skill.skillId)}
                  disabled={!skill.isSelected && selectedSkills.length >= 8}
                  className="w-4 h-4"
                />
                <span className="font-medium">{skill.name}</span>
              </label>
              {skill.isSelected && (
                <span className="text-lg font-bold">Level: {skill.level}</span>
              )}
            </div>
            
            {skill.isSelected && (
              <div className="mt-2">
                <RangeSlider
                  value={skill.level}
                  onChange={(value) => handleSkillLevelChange(skill.skillId, value)}
                  min={1}
                  max={5}
                  step={1}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Validation errors */}
      {showErrors && (
        <div className="bg-red-50 p-4 rounded">
          {validation.errors.map((error, index) => (
            <p key={index} className="text-sm text-red-600">
              {error}
            </p>
          ))}
        </div>
      )}

      <div className="bg-blue-50 p-4 rounded">
        <p className="text-sm text-blue-800">
          Select between 1 and 8 skills for your character. Each selected skill can be 
          leveled from 1 to 5.
        </p>
      </div>
    </div>
  );
};