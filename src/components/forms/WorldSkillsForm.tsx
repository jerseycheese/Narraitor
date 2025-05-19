import React from 'react';
import { WorldSkill, WorldAttribute } from '@/types/world.types';
import { generateUniqueId } from '@/lib/utils/generateId';

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
      difficulty: 'medium',
      linkedAttributeId: attributes.length > 0 ? attributes[0].id : undefined
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
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Difficulty
                    </label>
                    <select
                      value={skill.difficulty}
                      onChange={(e) => handleUpdateSkill(index, { 
                        difficulty: e.target.value as 'easy' | 'medium' | 'hard' 
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Linked Attribute
                    </label>
                    <select
                      value={skill.linkedAttributeId || ''}
                      onChange={(e) => handleUpdateSkill(index, { 
                        linkedAttributeId: e.target.value || undefined 
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                    >
                      <option value="">None</option>
                      {attributes.map(attr => (
                        <option key={attr.id} value={attr.id}>
                          {attr.name}
                        </option>
                      ))}
                    </select>
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