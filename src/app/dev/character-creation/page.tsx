'use client';

import React, { useEffect, useState } from 'react';
import { CharacterCreationWizard } from '@/components/CharacterCreationWizard';
import { worldStore } from '@/state/worldStore';
import { World } from '@/types/world.types';
import { generateUniqueId } from '@/lib/utils/generateId';

// Test world configurations
const testWorlds = {
  fantasy: {
    name: 'Fantasy Test World',
    description: 'A high fantasy world for testing character creation',
    theme: 'fantasy',
    attributes: [
      { id: 'attr-str', name: 'Strength', worldId: '', baseValue: 10, minValue: 1, maxValue: 10 },
      { id: 'attr-dex', name: 'Dexterity', worldId: '', baseValue: 10, minValue: 1, maxValue: 10 },
      { id: 'attr-con', name: 'Constitution', worldId: '', baseValue: 10, minValue: 1, maxValue: 10 },
      { id: 'attr-int', name: 'Intelligence', worldId: '', baseValue: 10, minValue: 1, maxValue: 10 },
      { id: 'attr-wis', name: 'Wisdom', worldId: '', baseValue: 10, minValue: 1, maxValue: 10 },
      { id: 'attr-cha', name: 'Charisma', worldId: '', baseValue: 10, minValue: 1, maxValue: 10 },
    ],
    skills: [
      { id: 'skill-1', name: 'Swordsmanship', worldId: '', difficulty: 'medium' as const, baseValue: 1, minValue: 1, maxValue: 5 },
      { id: 'skill-2', name: 'Archery', worldId: '', difficulty: 'medium' as const, baseValue: 1, minValue: 1, maxValue: 5 },
      { id: 'skill-3', name: 'Magic', worldId: '', difficulty: 'hard' as const, baseValue: 1, minValue: 1, maxValue: 5 },
      { id: 'skill-4', name: 'Stealth', worldId: '', difficulty: 'easy' as const, baseValue: 1, minValue: 1, maxValue: 5 },
      { id: 'skill-5', name: 'Diplomacy', worldId: '', difficulty: 'medium' as const, baseValue: 1, minValue: 1, maxValue: 5 },
      { id: 'skill-6', name: 'Survival', worldId: '', difficulty: 'easy' as const, baseValue: 1, minValue: 1, maxValue: 5 },
      { id: 'skill-7', name: 'Healing', worldId: '', difficulty: 'medium' as const, baseValue: 1, minValue: 1, maxValue: 5 },
      { id: 'skill-8', name: 'Alchemy', worldId: '', difficulty: 'hard' as const, baseValue: 1, minValue: 1, maxValue: 5 },
    ],
    settings: {
      maxAttributes: 6,
      maxSkills: 12,
      attributePointPool: 27,
      skillPointPool: 20,
    },
  },
  western: {
    name: 'Western Test World',
    description: 'A wild west world for testing character creation',
    theme: 'western',
    attributes: [
      { id: 'attr-grit', name: 'Grit', worldId: '', baseValue: 10, minValue: 1, maxValue: 10 },
      { id: 'attr-draw', name: 'Quick Draw', worldId: '', baseValue: 10, minValue: 1, maxValue: 10 },
      { id: 'attr-ride', name: 'Riding', worldId: '', baseValue: 10, minValue: 1, maxValue: 10 },
      { id: 'attr-sharp', name: 'Sharpshooting', worldId: '', baseValue: 10, minValue: 1, maxValue: 10 },
      { id: 'attr-charm', name: 'Charm', worldId: '', baseValue: 10, minValue: 1, maxValue: 10 },
    ],
    skills: [
      { id: 'skill-gun', name: 'Gunslinging', worldId: '', difficulty: 'medium' as const, baseValue: 1, minValue: 1, maxValue: 5 },
      { id: 'skill-gamble', name: 'Gambling', worldId: '', difficulty: 'easy' as const, baseValue: 1, minValue: 1, maxValue: 5 },
      { id: 'skill-track', name: 'Tracking', worldId: '', difficulty: 'medium' as const, baseValue: 1, minValue: 1, maxValue: 5 },
      { id: 'skill-brawl', name: 'Brawling', worldId: '', difficulty: 'easy' as const, baseValue: 1, minValue: 1, maxValue: 5 },
      { id: 'skill-intim', name: 'Intimidation', worldId: '', difficulty: 'medium' as const, baseValue: 1, minValue: 1, maxValue: 5 },
    ],
    settings: {
      maxAttributes: 5,
      maxSkills: 10,
      attributePointPool: 25,
      skillPointPool: 15,
    },
  },
};

export default function CharacterCreationTestPage() {
  const [selectedWorld, setSelectedWorld] = useState<string>('fantasy');
  const [testWorldId, setTestWorldId] = useState<string | null>(null);
  const { createWorld, setCurrentWorld } = worldStore();

  useEffect(() => {
    // Create the test world on mount
    const worldData = testWorlds[selectedWorld];
    const worldId = generateUniqueId('world');
    
    // Update worldId in attributes and skills
    const worldWithIds = {
      ...worldData,
      attributes: worldData.attributes.map(attr => ({ ...attr, worldId })),
      skills: worldData.skills.map(skill => ({ ...skill, worldId })),
    };
    
    const createdId = createWorld(worldWithIds as Omit<World, 'id' | 'createdAt' | 'updatedAt'>);
    setCurrentWorld(createdId);
    setTestWorldId(createdId);
  }, [selectedWorld, createWorld, setCurrentWorld]);

  const handleWorldChange = (worldType: string) => {
    setSelectedWorld(worldType);
    setTestWorldId(null); // Force recreation
  };

  const handleClearAutoSave = () => {
    if (testWorldId) {
      sessionStorage.removeItem(`character-creation-${testWorldId}`);
      alert('Auto-save data cleared');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Character Creation Test Harness</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Test Controls */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Test Controls</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Test World
              </label>
              <div className="flex gap-4">
                <button
                  onClick={() => handleWorldChange('fantasy')}
                  className={`px-4 py-2 rounded ${
                    selectedWorld === 'fantasy'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  Fantasy World (6 attributes, 8 skills)
                </button>
                <button
                  onClick={() => handleWorldChange('western')}
                  className={`px-4 py-2 rounded ${
                    selectedWorld === 'western'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  Western World (5 attributes, 5 skills)
                </button>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleClearAutoSave}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Clear Auto-Save Data
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Refresh Page
              </button>
            </div>
          </div>

          <div className="mt-4 p-4 bg-blue-50 rounded">
            <h3 className="font-semibold text-sm mb-2">Test Scenarios:</h3>
            <ul className="text-sm space-y-1 text-gray-700">
              <li>• Test character name validation (min 3 chars, max 50 chars)</li>
              <li>• Test attribute point allocation ({testWorlds[selectedWorld].settings.attributePointPool} points)</li>
              <li>• Test skill selection (max 8 skills)</li>
              <li>• Test background validation (history 50+ chars, personality 20+ chars)</li>
              <li>• Test auto-save by filling some fields and refreshing</li>
              <li>• Test navigation between steps</li>
              <li>• Test validation blocking progression</li>
            </ul>
          </div>
        </div>

        {/* Character Creation Wizard */}
        {testWorldId && (
          <div className="bg-white rounded-lg shadow p-8">
            <CharacterCreationWizard worldId={testWorldId} />
          </div>
        )}
      </div>
    </div>
  );
}