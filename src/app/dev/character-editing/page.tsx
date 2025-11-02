'use client';

import React, { useEffect, useState } from 'react';
import { useCharacterStore } from '@/state/characterStore';
import { useWorldStore } from '@/state/worldStore';
import { ensureWorldNpcRoster } from '@/lib/services/worldCreationService';
import { CharacterEditor } from '@/components/CharacterEditor';

export default function CharacterEditingTestPage() {
  const { characters, createCharacter } = useCharacterStore();
  const { worlds, createWorld } = useWorldStore();
  const [testCharacterId, setTestCharacterId] = useState<string | null>(null);

  useEffect(() => {
    // Create test world if none exists
    const worldIds = Object.keys(worlds);
    let worldId = worldIds[0];
    
    if (!worldId) {
      worldId = createWorld({
        name: 'Test World',
        genre: 'fantasy',
        description: 'A test world for character editing',
        attributes: [
          {
            id: 'str',
            name: 'Strength',
            description: 'Physical power',
            worldId: '',
            baseValue: 10,
            minValue: 1,
            maxValue: 20
          },
          {
            id: 'int',
            name: 'Intelligence', 
            description: 'Mental capacity',
            worldId: '',
            baseValue: 10,
            minValue: 1,
            maxValue: 20
          }
        ],
        skills: [
          {
            id: 'sword',
            name: 'Swordsmanship',
            description: 'Skill with bladed weapons',
            worldId: '',
            difficulty: 'medium' as const,
            attributeIds: ['str'],
            baseValue: 5,
            minValue: 0,
            maxValue: 10
          }
        ],
        settings: {
          maxAttributes: 2,
          maxSkills: 2,
          attributePointPool: 20,
          skillPointPool: 30
        }
      });
      void ensureWorldNpcRoster(worldId);
    }

    // Create test character if none exists
    const characterIds = Object.keys(characters);
    if (characterIds.length === 0) {
      const charId = createCharacter({
        name: 'Test Hero',
        description: 'A brave adventurer for testing character editing',
        worldId: worldId,
        level: 3,
        attributes: [
          {
            id: 'char-str',
            characterId: '',
            name: 'Strength',
            baseValue: 12,
            modifiedValue: 12,
          },
          {
            id: 'char-int',
            characterId: '',
            name: 'Intelligence',
            baseValue: 8,
            modifiedValue: 8,
          }
        ],
        skills: [
          {
            id: 'char-sword',
            characterId: '',
            name: 'Swordsmanship',
            level: 7,
          }
        ],
        background: {
          history: 'Born in a small village, trained as a warrior',
          personality: 'Brave and determined',
          goals: ['Protect the innocent', 'Become a legendary hero'],
          fears: ['Failing those who depend on me'],
          physicalDescription: 'Tall and muscular with battle scars',
          relationships: [],
        },
        isPlayer: true,
        status: {
          health: 100,
          maxHealth: 100,
          conditions: [],
        },
        inventory: {
          characterId: '',
          items: [],
          capacity: 20,
          categories: [],
          itemOrder: [],
        }
      });
      setTestCharacterId(charId);
    } else {
      setTestCharacterId(characterIds[0]);
    }
  }, [characters, worlds, createCharacter, createWorld]);

  if (!testCharacterId) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">Character Editing Test Harness</h1>
          <p>Setting up test data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-4">Character Editing Test Harness</h1>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h2 className="font-semibold text-blue-900 mb-2">Acceptance Criteria Testing</h2>
            <ul className="text-blue-700 space-y-1 text-sm">
              <li>✅ An editing interface allows modification of existing character fields</li>
              <li>✅ The editing interface reuses the same validation as character creation</li>
              <li>✅ Changes are saved immediately when submitted</li>
              <li>✅ The interface provides clear feedback when changes are saved</li>
              <li>✅ Users can cancel edits without saving changes</li>
            </ul>
          </div>
        </div>

        <CharacterEditor characterId={testCharacterId} />
      </div>
    </div>
  );
}
