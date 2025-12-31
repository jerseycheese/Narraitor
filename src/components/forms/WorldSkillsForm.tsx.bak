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
    <section className="p-4 bg-background rounded">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">Skills</h3>
        <Button
          onClick={handleAddSkill}
          size="sm"
        >
          Add Skill
        </Button>
      </div>
      
      {skills.length === 0 ? (
        <p className="text-muted-foreground italic">No skills defined yet.</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {skills.map((skill, index) => (
            <div key={skill.id || skill.name || index} className="bg-muted rounded-lg p-4 border border-l-4 border-l-primary">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-lg">{skill.name}</h4>
                <Button
                  onClick={() => handleRemoveSkill(index)}
                  variant="destructive"
                  size="sm"
                >
                  Remove
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
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
                  
                  <div className="space-y-2">
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
                
                <div className="space-y-2">
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
                
                <div className="space-y-4">
                  <div className="space-y-2">
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
                  
                  <div className="space-y-2">
                    <Label>
                      Linked Attributes
                    </Label>
                    {attributes.length === 0 ? (
                      <p className="text-muted-foreground text-sm">No attributes available</p>
                    ) : (
                      <div className="flex flex-wrap gap-4">
                        {attributes.map((attr, aIndex) => (
                          <div key={attr.id || attr.name || aIndex} className="flex items-center space-x-2">
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
                
                <div className="mt-4 border-t border-border pt-4">
                  <h5 className="font-medium mb-2">Skill Default Level</h5>
                  <div className="mb-4">
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
