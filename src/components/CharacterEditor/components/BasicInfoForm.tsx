import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';

interface BasicInfoFormProps {
  name: string;
  level: number;
  isPlayer: boolean;
  onNameChange: (name: string) => void;
  onLevelChange: (level: number) => void;
  onPlayerTypeChange: (isPlayer: boolean) => void;
}

export const BasicInfoForm: React.FC<BasicInfoFormProps> = ({
  name,
  level,
  isPlayer,
  onNameChange,
  onLevelChange,
  onPlayerTypeChange
}) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">Basic Information</h2>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="character-name">
            Character Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="character-name"
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="character-level">
            Level
          </Label>
          <Select
            id="character-level"
            value={level}
            onChange={(e) => onLevelChange(parseInt(e.target.value))}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(level => (
              <option key={level} value={level}>Level {level}</option>
            ))}
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="character-type">
            Character Type
          </Label>
          <Select
            id="character-type"
            value={isPlayer ? 'player' : 'npc'}
            onChange={(e) => onPlayerTypeChange(e.target.value === 'player')}
          >
            <option value="player">Player Character</option>
            <option value="npc">Non-Player Character (NPC)</option>
          </Select>
        </div>
      </div>
    </div>
  );
};
