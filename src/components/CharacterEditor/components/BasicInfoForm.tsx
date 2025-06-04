import React from 'react';

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
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Character Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Level
          </label>
          <select
            value={level}
            onChange={(e) => onLevelChange(parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(level => (
              <option key={level} value={level}>Level {level}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Character Type
          </label>
          <select
            value={isPlayer ? 'player' : 'npc'}
            onChange={(e) => onPlayerTypeChange(e.target.value === 'player')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="player">Player Character</option>
            <option value="npc">Non-Player Character (NPC)</option>
          </select>
        </div>
      </div>
    </div>
  );
};
