import React from 'react';
import { useRouter } from 'next/navigation';
import { worldStore } from '@/state/worldStore';
import { generateTestCharacter } from './generators/characterGenerator';
import { generateTestWorld } from './generators/worldGenerator';

export const TestDataGeneratorSection: React.FC = () => {
  const router = useRouter();
  const { worlds, currentWorldId, createWorld } = worldStore();
  
  const handleGenerateWorld = () => {
    const testWorld = generateTestWorld();
    const worldId = createWorld(testWorld);
    console.log(`Test world "${testWorld.name}" created with ID: ${worldId}`);
  };
  
  const handleGenerateCharacter = async () => {
    const currentWorld = currentWorldId ? worlds[currentWorldId] : null;
    if (!currentWorld) {
      alert('Please select a world first');
      return;
    }
    
    // Generate test data
    const testData = generateTestCharacter(currentWorld);
    
    // Store the complete wizard state
    const wizardState = {
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
    };
    
    // Store it in sessionStorage
    const storageKey = `character-creation-${currentWorld.id}`;
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(wizardState));
      console.log(`[TestDataGenerator] Stored test character data with key: ${storageKey}`, wizardState);
      
      // Verify it was stored
      const stored = sessionStorage.getItem(storageKey);
      if (!stored) {
        throw new Error('Failed to store data in sessionStorage');
      }
      
      // Force a small delay to ensure storage is committed
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Use window.location for a hard navigation to ensure fresh page load
      window.location.href = '/characters/create';
    } catch (error) {
      console.error('[TestDataGenerator] Error storing test data:', error);
      alert('Failed to store test data. Check console for details.');
    }
  };
  
  const handleDebugStorage = () => {
    const currentWorld = currentWorldId ? worlds[currentWorldId] : null;
    if (!currentWorld) {
      alert('Please select a world first');
      return;
    }
    
    const storageKey = `character-creation-${currentWorld.id}`;
    const storedData = sessionStorage.getItem(storageKey);
    
    if (storedData) {
      console.log('[TestDataGenerator] Current stored data:', JSON.parse(storedData));
      alert(`Data found in sessionStorage for key: ${storageKey}. Check console for details.`);
    } else {
      console.log('[TestDataGenerator] No data found in sessionStorage for key:', storageKey);
      alert(`No data found in sessionStorage for key: ${storageKey}`);
    }
  };
  
  const handleNavigateEmpty = () => {
    // Just navigate without any data
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
          title="Creates test character data and navigates to character creation form"
        >
          Generate & Fill Character Form
        </button>
        
        <button
          onClick={handleNavigateEmpty}
          className="w-full px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm transition-colors"
          disabled={!currentWorldId}
          title="Navigate to empty character creation form"
        >
          Go to Empty Form
        </button>
        
        <button
          onClick={handleDebugStorage}
          className="w-full px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm transition-colors"
          disabled={!currentWorldId}
          title="Check if test data exists in sessionStorage"
        >
          Debug: Check Storage
        </button>
      </div>
      
      <p className="text-xs text-gray-400">
        Test data generators create randomized content for development testing.
        {!currentWorldId && ' Select a world to enable character generation.'}
      </p>
      
      <div className="text-xs text-gray-500 bg-gray-800 p-2 rounded">
        <strong>Troubleshooting:</strong>
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li>If form isn&apos;t pre-filled, try the debug page at <code>/dev/test-character-form</code></li>
          <li>Check browser console for <code>[TestDataGenerator]</code> and <code>[CharacterCreationWizard]</code> logs</li>
          <li>Clear cache and hard refresh if needed (Cmd+Shift+R)</li>
        </ul>
      </div>
    </div>
  );
};