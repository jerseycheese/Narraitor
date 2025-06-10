import React from 'react';
import { WorldSkill, WorldAttribute } from '@/types/world.types';
import { generateUniqueId } from '@/lib/utils/generateId';
import { 
  MIN_SKILL_VALUE as SKILL_MIN_VALUE, 
  MAX_SKILL_VALUE as SKILL_MAX_VALUE, 
  SKILL_DEFAULT_VALUE 
} from '@/lib/constants/skillLevelDescriptions';
import {
  SKILL_DIFFICULTIES,
  DEFAULT_SKILL_DIFFICULTY,
  SkillDifficulty
} from '@/lib/constants/skillDifficultyLevels';
import SkillRangeEditor from './SkillRangeEditor';

interface WorldSkillsFormProps {
  skills: WorldSkill[];
  attributes: WorldAttribute[];
  worldId: string;
  onChange: (skills: WorldSkill[]) => void;
}

const WorldSkillsForm: React.FC<WorldSkillsFormProps> = ({ 
  skills, 
  attributes,
  worldId, 
  onChange 
}) => {
  // Add a new skill
  const handleAddSkill = () => {
    const newSkill: WorldSkill = {
      id: generateUniqueId('skill'),
      worldId,
      name: 'New Skill',
      description: 'Description of the new skill',
      difficulty: DEFAULT_SKILL_DIFFICULTY,
      attributeIds: attributes.length > 0 ? [attributes[0].id] : [],
      baseValue: SKILL_DEFAULT_VALUE,  // Default base value
      minValue: SKILL_MIN_VALUE,   // Default minimum value
      maxValue: SKILL_MAX_VALUE   // Default maximum value
    };
    
    onChange([...skills, newSkill]);
  };
  
  // Update a skill
  const handleUpdateSkill = (index: number, updates: Partial<WorldSkill>) => {
    const updatedSkills = [...skills];
    updatedSkills[index] = { ...updatedSkills[index], ...updates };
    onChange(updatedSkills);
  };
  
  // Remove a skill
  const handleRemoveSkill = (index: number) => {
    const updatedSkills = skills.filter((_, i) => i !== index);
    onChange(updatedSkills);
  };
  
  return (
    <section className="p-4 bg-white rounded shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Skills</h2>
        <button
          onClick={handleAddSkill}
          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
        >
          Add Skill
        </button>
      </div>
      
      {skills.length === 0 ? (
        <p className="text-gray-500 italic">No skills defined yet.</p>
      ) : (
        <div className="space-y-6">
          {skills.map((skill, index) => (
            <div key={skill.id} className="p-3 border border-gray-200 rounded">
              <div className="flex justify-between mb-2">
                <h3 className="font-medium">{skill.name}</h3>
                <button
                  onClick={() => handleRemoveSkill(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      value={skill.name}
                      onChange={(e) => handleUpdateSkill(index, { name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <input
                      type="text"
                      value={skill.category || ''}
                      onChange={(e) => handleUpdateSkill(index, { category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={skill.description}
                    onChange={(e) => handleUpdateSkill(index, { description: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Difficulty
                    </label>
                    <select
                      value={skill.difficulty}
                      onChange={(e) => handleUpdateSkill(index, { 
                        difficulty: e.target.value as SkillDifficulty
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                    >
                      {SKILL_DIFFICULTIES.map(difficulty => (
                        <option key={difficulty.value} value={difficulty.value}>
                          {difficulty.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Linked Attributes
                    </label>
                    {attributes.length === 0 ? (
                      <p className="text-gray-500 text-sm">No attributes available</p>
                    ) : (
                      <div className="space-y-2">
                        {attributes.map(attr => (
                          <label key={attr.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={skill.attributeIds.includes(attr.id)}
                              onChange={(e) => {
                                const isChecked = e.target.checked;
                                const currentAttributeIds = skill.attributeIds || [];
                                const newAttributeIds = isChecked
                                  ? [...currentAttributeIds, attr.id]
                                  : currentAttributeIds.filter(id => id !== attr.id);
                                handleUpdateSkill(index, { attributeIds: newAttributeIds });
                              }}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="text-sm text-gray-700">{attr.name}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="mt-4 border-t pt-4">
                  <h4 className="font-medium mb-2">Skill Default Level</h4>
                  <div className="mb-4">
                    <p className="text-sm text-gray-500 mb-2">
                      Set the default starting value for this skill. Skill values range from 1 (Novice) to 5 (Master).
                    </p>
                    
                    {/* Use the SkillRangeEditor component */}
                    <SkillRangeEditor
                      skill={{
                        ...skill,
                        minValue: SKILL_MIN_VALUE,
                        maxValue: SKILL_MAX_VALUE,
                      }}
                      onChange={(updates) => handleUpdateSkill(index, updates)}
                      showLevelDescriptions={true}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default WorldSkillsForm;