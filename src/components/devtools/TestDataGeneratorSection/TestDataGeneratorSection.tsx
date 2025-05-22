import React from 'react';
import { useRouter } from 'next/navigation';
import { worldStore } from '@/state/worldStore';
import { characterStore } from '@/state/characterStore';
import { generateTestCharacter } from './generators/characterGenerator';
import { generateTestWorld } from './generators/worldGenerator';

export const TestDataGeneratorSection: React.FC = () => {
  const router = useRouter();
  const { worlds, currentWorldId, createWorld } = worldStore();
  const { createCharacter } = characterStore();
  
  const handleGenerateWorld = () => {
    const testWorld = generateTestWorld();
    const worldId = createWorld(testWorld);
    console.log(`Test world "${testWorld.name}" created with ID: ${worldId}`);
  };
  
  const handleGenerateCharacter = () => {
    const currentWorld = currentWorldId ? worlds[currentWorldId] : null;
    if (!currentWorld) {
      alert('Please select a world first');
      return;
    }
    
    // Navigate to character creation with test data
    const testData = generateTestCharacter(currentWorld);
    sessionStorage.setItem(
      `character-creation-${currentWorld.id}-test`, 
      JSON.stringify(testData)
    );
    router.push('/characters/create?testMode=true');
  };
  
  const handleFillCharacterForm = () => {
    const currentWorld = currentWorldId ? worlds[currentWorldId] : null;
    if (!currentWorld) {
      alert('Please select a world first');
      return;
    }
    
    // Generate test data and store it
    const testData = generateTestCharacter(currentWorld);
    sessionStorage.setItem(
      `character-creation-${currentWorld.id}`, 
      JSON.stringify({
        currentStep: 0,
        worldId: currentWorld.id,
        characterData: testData,
        validation: {},
        pointPools: {
          attributes: {
            total: currentWorld.settings.attributePointPool,
            spent: testData.attributes.reduce((sum, attr) => sum + attr.value, 0),
            remaining: currentWorld.settings.attributePointPool - testData.attributes.reduce((sum, attr) => sum + attr.value, 0),
          },
          skills: {
            total: currentWorld.settings.skillPointPool,
            spent: testData.skills.filter(s => s.isSelected).reduce((sum, skill) => sum + skill.level, 0),
            remaining: currentWorld.settings.skillPointPool - testData.skills.filter(s => s.isSelected).reduce((sum, skill) => sum + skill.level, 0),
          },
        },
      })
    );
    
    // Navigate to character creation
    router.push('/characters/create');
  };
  
  return (
    <div className="space-y-4">
      <h3 className="font-bold text-sm">Test Data Generators</h3>
      
      <div className="space-y-2">
        <button
          onClick={handleGenerateWorld}
          className="w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm transition-colors"
        >
          Generate Test World
        </button>
        
        <button
          onClick={handleGenerateCharacter}
          className="w-full px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm transition-colors"
          disabled={!currentWorldId}
        >
          Generate Test Character Data
        </button>
        
        <button
          onClick={handleFillCharacterForm}
          className="w-full px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm transition-colors"
          disabled={!currentWorldId}
        >
          Fill Character Creation Form
        </button>
      </div>
      
      <p className="text-xs text-gray-400">
        Test data generators create randomized content for development testing.
        {!currentWorldId && ' Select a world to enable character generation.'}
      </p>
    </div>
  );
};