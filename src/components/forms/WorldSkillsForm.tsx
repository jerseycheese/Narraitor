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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

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
    <section >
      <div >
        <h3 >Skills</h3>
        <Button
          onClick={handleAddSkill}
          size="sm"
        >
          Add Skill
        </Button>
      </div>
      
      {skills.length === 0 ? (
        <p >No skills defined yet.</p>
      ) : (
        <div >
          {skills.map((skill, index) => (
            <div key={skill.id || skill.name || index} >
              <div >
                <h4 >{skill.name}</h4>
                <Button
                  onClick={() => handleRemoveSkill(index)}
                  variant="destructive"
                  size="sm"
                >
                  Remove
                </Button>
              </div>
              
              <div >
                <div >
                  <div >
                    <Label htmlFor={`skill-name-${index}`}>
                      Name
                    </Label>
                    <Input
                      id={`skill-name-${index}`}
                      type="text"
                      value={skill.name}
                      onChange={(e) => handleUpdateSkill(index, { name: e.target.value })}
                    />
                  </div>
                  
                  <div >
                    <Label htmlFor={`skill-category-${index}`}>
                      Category
                    </Label>
                    <Input
                      id={`skill-category-${index}`}
                      type="text"
                      value={skill.category || ''}
                      onChange={(e) => handleUpdateSkill(index, { category: e.target.value })}
                    />
                  </div>
                </div>
                
                <div >
                  <Label htmlFor={`skill-description-${index}`}>
                    Description
                  </Label>
                  <Textarea
                    id={`skill-description-${index}`}
                    value={skill.description}
                    onChange={(e) => handleUpdateSkill(index, { description: e.target.value })}
                    rows={2}
                  />
                </div>
                
                <div >
                  <div >
                    <Label htmlFor={`skill-difficulty-${index}`}>
                      Difficulty
                    </Label>
                    <Select
                      id={`skill-difficulty-${index}`}
                      value={skill.difficulty}
                      onChange={(e) => handleUpdateSkill(index, { 
                        difficulty: e.target.value as SkillDifficulty
                      })}
                    >
                      {SKILL_DIFFICULTIES.map(difficulty => (
                        <option key={difficulty.value} value={difficulty.value}>
                          {difficulty.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                  
                  <div >
                    <Label>
                      Linked Attributes
                    </Label>
                    {attributes.length === 0 ? (
                      <p >No attributes available</p>
                    ) : (
                      <div >
                        {attributes.map((attr, aIndex) => (
                          <div key={attr.id || attr.name || aIndex} >
                            <Checkbox
                              id={`skill-${index}-attr-${attr.id}`}
                              checked={skill.attributeIds?.includes(attr.id) || false}
                              onChange={(e) => {
                                const isChecked = e.target.checked;
                                const currentAttributeIds = skill.attributeIds || [];
                                const newAttributeIds = isChecked
                                  ? [...currentAttributeIds, attr.id]
                                  : currentAttributeIds.filter(id => id !== attr.id);
                                handleUpdateSkill(index, { attributeIds: newAttributeIds });
                              }}
                              label={attr.name}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <div >
                  <h5 >Skill Default Level</h5>
                  <div >
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
