import React from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { worldStore } from '@/state/worldStore';
import { characterStore } from '@/state/characterStore';
// Using API routes for secure AI operations - combines both approaches
import { generateTestCharacter } from '@/lib/generators/characterGenerator';
import { generateUniqueId } from '@/lib/utils/generateId';
import type { WorldImage } from '@/types/world.types';

export const TestDataGeneratorSection: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { worlds, currentWorldId, createWorld } = worldStore();
  const { createCharacter } = characterStore();
  
  // Check if we're on the characters page and get the worldId from URL
  const isOnCharactersPage = pathname === '/characters';
  const worldIdFromUrl = isOnCharactersPage ? searchParams.get('worldId') : null;
  const effectiveWorldId = worldIdFromUrl || currentWorldId;
  
  const handleGenerateWorld = async () => {
    try {
      // Generate a diverse mix of world types for testing (my enhancement)
      const worldTypeRandom = Math.random();
      let randomReference;
      let randomRelationship;
      
      if (worldTypeRandom < 0.33) {
        // 33% - Original worlds (no reference)
        console.log(`[DevTools] Generating original world...`);
      } else if (worldTypeRandom < 0.66) {
        // 33% - "Set in" worlds (existing universe)
        const tvMovieUniverses = [
          'Game of Thrones', 'Lord of the Rings', 'Star Wars', 'Twin Peaks', 
          'Stranger Things', 'Deadwood', 'The Witcher', 'The Walking Dead',
          'Black Mirror', 'The Matrix', 'Mad Max', 'Westworld', 'Star Trek', 'Dune'
        ];
        randomReference = tvMovieUniverses[Math.floor(Math.random() * tvMovieUniverses.length)];
        randomRelationship = 'set_in';
        console.log(`[DevTools] Generating "set in" world for ${randomReference} (canonical theme will be applied)...`);
      } else {
        // 34% - "Based on" worlds (inspired by existing universe)
        const tvMovieUniverses = [
          'Game of Thrones', 'Lord of the Rings', 'Star Wars', 'Twin Peaks', 
          'Stranger Things', 'Deadwood', 'The Witcher', 'The Walking Dead',
          'Black Mirror', 'The Matrix', 'Mad Max', 'Westworld', 'Star Trek', 'Dune'
        ];
        randomReference = tvMovieUniverses[Math.floor(Math.random() * tvMovieUniverses.length)];
        randomRelationship = 'based_on';
        console.log(`[DevTools] Generating "based on" world inspired by ${randomReference}...`);
      }
      
      const existingNames = Object.values(worlds).map(w => w.name);
      
      // Use the secure API route approach from develop branch
      const response = await fetch('/api/generate-world', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          worldReference: randomReference,
          worldRelationship: randomRelationship,
          existingNames
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate test world via API');
      }
      
      const testWorldData = await response.json();
      
      // Transform the generated data to match the store's expected format
      const worldDataForStore = {
        ...testWorldData,
        // Support both property patterns for compatibility
        reference: randomReference,
        relationship: randomRelationship,
        universeReference: randomReference,
        universeRelationship: randomRelationship,
        attributes: testWorldData.attributes.map((attr: { name: string; description: string; minValue: number; maxValue: number; defaultValue: number }) => ({
          ...attr,
          id: generateUniqueId('attr'),
          worldId: '' // Will be set by store
        })),
        skills: testWorldData.skills.map((skill: { name: string; description: string; difficulty: string; category: string }) => ({
          ...skill,
          id: generateUniqueId('skill'),
          worldId: '' // Will be set by store
        }))
      };
      
      const worldId = createWorld(worldDataForStore);
      console.log(`Test world "${testWorldData.name}" created with ID: ${worldId}`);
      
      // Set the newly created world as the active world
      const { setCurrentWorld } = worldStore.getState();
      setCurrentWorld(worldId);
      console.log(`[DevTools] Set newly generated world as active: ${worldId}`);
      
      // Generate world image asynchronously using my enhanced API
      try {
        // Get the created world from store
        const world = worldStore.getState().worlds[worldId];
        console.log(`[DevTools] Attempting to generate image for world:`, world?.name);
        if (world) {
          const response = await fetch('/api/generate-world-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ world })
          });
          
          if (response.ok) {
            const { imageUrl, aiGenerated, service } = await response.json();
            // Update the world with the generated image in WorldImage format (my enhancement)
            const image: WorldImage = {
              type: aiGenerated ? 'ai-generated' as const : 'placeholder' as const,
              url: imageUrl,
              generatedAt: new Date().toISOString()
            };
            worldStore.getState().updateWorld(worldId, { image });
            console.log(`[DevTools] Generated ${service} image for test world "${testWorldData.name}":`, imageUrl);
          } else {
            const errorText = await response.text();
            console.warn(`[DevTools] Failed to generate world image: ${response.status} - ${errorText}`);
          }
        }
      } catch (error) {
        console.error('Failed to generate world image for test world:', error);
        // Don't block world creation if image generation fails
      }
      
    } catch (error) {
      console.error('[DevTools] Error generating test world:', error);
      alert(`Error generating test world: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleGenerate5Worlds = async () => {
    const createdWorlds = [];
    
    try {
      // Get existing world names to ensure uniqueness
      const existingNames = Object.values(worlds).map(w => w.name);
      
      for (let i = 0; i < 5; i++) {
        console.log(`[DevTools] Generating diverse world ${i + 1}/5...`);
        
        // Generate a diverse mix of world types for testing (my enhancement)
        const worldTypeRandom = Math.random();
        let randomReference;
        let randomRelationship;
        
        if (worldTypeRandom < 0.33) {
          // 33% - Original worlds (no reference)
          console.log(`[DevTools] Generating original world ${i + 1}/5...`);
          randomReference = undefined;
          randomRelationship = undefined;
        } else if (worldTypeRandom < 0.66) {
          // 33% - "Set in" worlds (existing universe)
          const tvMovieUniverses = [
            'Game of Thrones', 'Lord of the Rings', 'Star Wars', 'Twin Peaks', 
            'Stranger Things', 'Deadwood', 'The Witcher', 'The Walking Dead',
            'Black Mirror', 'The Matrix', 'Mad Max', 'Westworld', 'Star Trek', 'Dune'
          ];
          randomReference = tvMovieUniverses[Math.floor(Math.random() * tvMovieUniverses.length)];
          randomRelationship = 'set_in';
          console.log(`[DevTools] Generating "set in" world ${i + 1}/5 for ${randomReference} (canonical theme will be applied)...`);
        } else {
          // 34% - "Based on" worlds (inspired by existing universe)
          const tvMovieUniverses = [
            'Game of Thrones', 'Lord of the Rings', 'Star Wars', 'Twin Peaks', 
            'Stranger Things', 'Deadwood', 'The Witcher', 'The Walking Dead',
            'Black Mirror', 'The Matrix', 'Mad Max', 'Westworld', 'Star Trek', 'Dune'
          ];
          randomReference = tvMovieUniverses[Math.floor(Math.random() * tvMovieUniverses.length)];
          randomRelationship = 'based_on';
          console.log(`[DevTools] Generating "based on" world ${i + 1}/5 inspired by ${randomReference}...`);
        }
        
        // Include existing names plus already created worlds in this batch to avoid duplicates
        const allExistingNames: string[] = [...existingNames, ...createdWorlds.map(w => w.name)];
        
        // Use the secure API route approach from develop branch
        const response = await fetch('/api/generate-world', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            worldReference: randomReference,
            worldRelationship: randomRelationship,
            existingNames: allExistingNames
          }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to generate test world via API');
        }
        
        const testWorldData = await response.json();
        
        // Transform the generated data to match the store's expected format
        const worldDataForStore = {
          ...testWorldData,
          // Support both property patterns for compatibility
          reference: randomReference,
          relationship: randomRelationship,
          universeReference: randomReference,
          universeRelationship: randomRelationship,
          attributes: testWorldData.attributes.map((attr: { name: string; description: string; minValue: number; maxValue: number; defaultValue: number }) => ({
            ...attr,
            id: generateUniqueId('attr'),
            worldId: '' // Will be set by store
          })),
          skills: testWorldData.skills.map((skill: { name: string; description: string; difficulty: string; category: string }) => ({
            ...skill,
            id: generateUniqueId('skill'),
            worldId: '' // Will be set by store
          }))
        };
        
        const worldId = createWorld(worldDataForStore);
        createdWorlds.push({ id: worldId, name: testWorldData.name });
        console.log(`Created test world: ${testWorldData.name}`);
        
        // Set the first created world as active (for batch generation)
        if (i === 0) {
          const { setCurrentWorld } = worldStore.getState();
          setCurrentWorld(worldId);
          console.log(`[DevTools] Set first generated world as active: ${worldId}`);
        }
        
        // Generate world image asynchronously for each world using my enhanced API
        try {
          // Get the created world from store
          const world = worldStore.getState().worlds[worldId];
          console.log(`[DevTools] Attempting to generate image for world ${i + 1}/5:`, world?.name);
          if (world) {
            const response = await fetch('/api/generate-world-image', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ world })
            });
            
            if (response.ok) {
              const { imageUrl, aiGenerated, service } = await response.json();
              // Update the world with the generated image in WorldImage format (my enhancement)
              const image: WorldImage = {
                type: aiGenerated ? 'ai-generated' as const : 'placeholder' as const,
                url: imageUrl,
                generatedAt: new Date().toISOString()
              };
              worldStore.getState().updateWorld(worldId, { image });
              console.log(`[DevTools] Generated ${service} image for test world "${testWorldData.name}":`, imageUrl);
            } else {
              const errorText = await response.text();
              console.warn(`[DevTools] Failed to generate world image for "${testWorldData.name}": ${response.status} - ${errorText}`);
            }
          }
        } catch (error) {
          console.error(`Failed to generate world image for test world "${testWorldData.name}":`, error);
          // Don't block world creation if image generation fails
        }
      }

      const worldNames = createdWorlds.map(w => w.name).join(', ');
      console.log(`[DevTools] Generated 5 test worlds with images:`, createdWorlds);
      alert(`Successfully generated 5 test worlds with images: ${worldNames}`);
      
    } catch (error) {
      console.error('[DevTools] Error generating test worlds:', error);
      alert(`Error generating test worlds: ${error instanceof Error ? error.message : 'Unknown error'}\\n\\nGenerated ${createdWorlds.length} worlds before error.`);
    }
  };
  
  const handleGenerateCharacter = async () => {
    const currentWorld = effectiveWorldId ? worlds[effectiveWorldId] : null;
    if (!currentWorld) {
      alert('Please select a world first');
      return;
    }
    
    // Generate test data using the traditional approach for form filling
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
          spent: testData.skills.filter(s => s.isActive).reduce((sum, skill) => sum + skill.level, 0),
          remaining: currentWorld.settings.skillPointPool - testData.skills.filter(s => s.isActive).reduce((sum, skill) => sum + skill.level, 0),
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
    const currentWorld = effectiveWorldId ? worlds[effectiveWorldId] : null;
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

  const handleGenerate5Characters = async () => {
    const currentWorld = effectiveWorldId ? worlds[effectiveWorldId] : null;
    if (!currentWorld) {
      alert('Please select a world first');
      return;
    }

    const createdCharacters = [];
    const { characters } = characterStore.getState();
    const existingCharacterNames = Object.values(characters)
      .filter(char => char.worldId === currentWorld.id)
      .map(char => char.name);

    try {
      for (let i = 0; i < 5; i++) {
        console.log(`[DevTools] Generating character ${i + 1}/5 for world "${currentWorld.name}"...`);
        
        // Smart character type selection based on world relationship (my enhancement)
        let characterType: 'known' | 'original';
        if (currentWorld.relationship === 'set_in' || currentWorld.universeRelationship === 'set_in') {
          // 100% known figures for "set in" worlds - all characters from that universe
          characterType = 'known';
        } else if (currentWorld.relationship === 'based_on' || currentWorld.universeRelationship === 'based_on') {
          // 100% original characters for "based on" worlds - inspired by but not from that universe
          characterType = 'original';
        } else {
          // No reference - 50/50 mix for variety
          characterType = Math.random() < 0.5 ? 'known' : 'original';
        }
        
        console.log(`[DevTools] Generating ${characterType} character for ${currentWorld.relationship || currentWorld.universeRelationship || 'no reference'} world`);
        
        // Use the AI character generator via API route (secure approach from develop)
        const response: Response = await fetch('/api/generate-character', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            worldId: currentWorld.id,
            characterType,
            existingNames: [...existingCharacterNames, ...createdCharacters.map(c => c.name)],
            world: currentWorld
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to generate character');
        }
        
        const aiCharacterData = await response.json();

        // Convert AI-generated data to character store format
        const characterData = {
          name: aiCharacterData.name,
          worldId: currentWorld.id,
          level: aiCharacterData.level || 1,
          isPlayer: true,
          attributes: aiCharacterData.attributes.map((attr: { id: string; value: number }) => {
            const worldAttr = currentWorld.attributes.find(wa => wa.id === attr.id);
            return {
              id: generateUniqueId('attr'),
              characterId: '', // Will be set by store
              name: worldAttr?.name || 'Unknown',
              baseValue: attr.value,
              modifiedValue: attr.value,
              category: worldAttr?.category
            };
          }),
          skills: aiCharacterData.skills.map((skill: { id: string; level: number }) => {
            const worldSkill = currentWorld.skills.find(ws => ws.id === skill.id);
            return {
              id: generateUniqueId('skill'),
              characterId: '', // Will be set by store
              name: worldSkill?.name || 'Unknown',
              level: skill.level,
              category: worldSkill?.category
            };
          }),
          background: {
            history: aiCharacterData.background.description || '',
            personality: aiCharacterData.background.personality || '',
            physicalDescription: aiCharacterData.background.physicalDescription || '',
            goals: aiCharacterData.background.motivation ? [aiCharacterData.background.motivation] : [],
            fears: [],
            isKnownFigure: characterType === 'known'
          },
          status: {
            hp: 100,
            mp: 50,
            stamina: 100
          }
        };

        const characterId = createCharacter(characterData);
        createdCharacters.push({ id: characterId, name: characterData.name });
        console.log(`[DevTools] Created AI ${characterType} character: ${characterData.name}`);
        
        // Generate portrait asynchronously via API route (secure approach)
        try {
          // Get the created character from store
          const storeCharacter = characterStore.getState().characters[characterId];
          if (storeCharacter) {
            console.log(`[DevTools] Generating portrait for ${characterType} character "${characterData.name}"...`);
            
            const response = await fetch('/api/generate-portrait', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                character: {
                  id: storeCharacter.id,
                  name: storeCharacter.name,
                  worldId: storeCharacter.worldId,
                  background: {
                    history: storeCharacter.background.history,
                    personality: storeCharacter.background.personality,
                    physicalDescription: storeCharacter.background.physicalDescription || '',
                    goals: storeCharacter.background.goals,
                    fears: storeCharacter.background.fears,
                    relationships: []
                  },
                  attributes: storeCharacter.attributes.map((attr: { id: string; name: string; baseValue: number }) => ({
                    attributeId: currentWorld.attributes.find(wa => wa.name === attr.name)?.id || attr.id,
                    value: attr.baseValue
                  })),
                  skills: storeCharacter.skills.map(skill => ({
                    skillId: currentWorld.skills.find(ws => ws.name === skill.name)?.id || skill.id,
                    level: skill.level,
                    experience: 0,
                    isActive: true
                  })),
                  inventory: {
                    characterId: storeCharacter.id,
                    items: [],
                    capacity: 100,
                    categories: []
                  },
                  status: {
                    health: storeCharacter.status.hp,
                    maxHealth: storeCharacter.status.hp,
                    conditions: [],
                    location: currentWorld.name
                  },
                  createdAt: storeCharacter.createdAt,
                  updatedAt: storeCharacter.updatedAt
                },
                world: currentWorld
              })
            });
            
            if (response.ok) {
              const { portrait } = await response.json();
              // Update the character with the generated portrait
              characterStore.getState().updateCharacter(characterId, { portrait });
              console.log(`[DevTools] Generated portrait for ${characterType} character "${characterData.name}"`);
            } else {
              console.warn(`[DevTools] Portrait generation failed for ${characterType} character "${characterData.name}"`);
            }
          }
        } catch (error) {
          console.error(`[DevTools] Failed to generate portrait for ${characterType} character "${characterData.name}":`, error);
          // Don't block character creation if portrait generation fails
        }
      }

      const characterNames = createdCharacters.map(c => c.name).join(', ');
      console.log(`[DevTools] Generated 5 AI characters (smart type selection) with portraits for world "${currentWorld.name}":`, createdCharacters);
      alert(`Successfully generated 5 AI characters (smart type selection) with portraits: ${characterNames}`);
      
    } catch (error) {
      console.error('[DevTools] Error generating AI characters:', error);
      alert(`Error generating characters: ${error instanceof Error ? error.message : 'Unknown error'}\\n\\nGenerated ${createdCharacters.length} characters before error.`);
    }
  };

  const handleDeleteAllWorlds = async () => {
    const worldCount = Object.keys(worlds).length;
    if (worldCount === 0) {
      alert('No worlds to delete');
      return;
    }

    const confirmed = confirm(`DELETE ALL WORLDS?\\n\\nThis will permanently delete all ${worldCount} worlds and their characters.\\n\\nThis action cannot be undone!`);
    if (!confirmed) return;

    try {
      // Get fresh references to the store methods
      const characterStoreState = characterStore.getState();
      const worldStoreState = worldStore.getState();
      
      // Delete all characters first
      const characterIds = Object.keys(characterStoreState.characters);
      for (const characterId of characterIds) {
        characterStoreState.deleteCharacter(characterId);
        await new Promise(resolve => setTimeout(resolve, 1));
      }

      // Then delete all worlds
      const worldIds = Object.keys(worldStoreState.worlds);
      for (const worldId of worldIds) {
        worldStoreState.deleteWorld(worldId);
        await new Promise(resolve => setTimeout(resolve, 1));
      }

      // Clear current world selection
      if (worldStoreState.currentWorldId) {
        worldStoreState.setCurrentWorld('');
      }

      console.log(`[DevTools] Deleted all ${worldCount} worlds and their characters`);
      alert(`Successfully deleted all ${worldCount} worlds and their characters`);
    } catch (error) {
      console.error('[DevTools] Error deleting all worlds:', error);
      alert(`Error during deletion: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDeleteAllCharactersInWorld = async () => {
    const currentWorld = effectiveWorldId ? worlds[effectiveWorldId] : null;
    if (!currentWorld) {
      alert('Please select a world first');
      return;
    }

    const { characters } = characterStore.getState();
    const worldCharacters = Object.values(characters).filter(char => char.worldId === currentWorld.id);
    
    if (worldCharacters.length === 0) {
      alert(`No characters found in world "${currentWorld.name}"`);
      return;
    }

    const confirmed = confirm(`DELETE ALL CHARACTERS IN "${currentWorld.name}"?\\n\\nThis will permanently delete ${worldCharacters.length} characters.\\n\\nThis action cannot be undone!`);
    if (!confirmed) return;

    try {
      const { deleteCharacter } = characterStore.getState();
      
      for (const character of worldCharacters) {
        deleteCharacter(character.id);
        await new Promise(resolve => setTimeout(resolve, 1));
      }

      const characterNames = worldCharacters.map(c => c.name).join(', ');
      console.log(`[DevTools] Deleted ${worldCharacters.length} characters from world "${currentWorld.name}":`, characterNames);
      alert(`Successfully deleted ${worldCharacters.length} characters from "${currentWorld.name}"`);
    } catch (error) {
      console.error('[DevTools] Error deleting characters:', error);
      alert(`Error during deletion: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleNukeEverything = async () => {
    const worldCount = Object.keys(worlds).length;
    const { characters } = characterStore.getState();
    const characterCount = Object.keys(characters).length;
    const totalItems = worldCount + characterCount;

    if (totalItems === 0) {
      alert('Nothing to delete - database is already empty');
      return;
    }

    const confirmed = confirm(`NUCLEAR OPTION - DELETE EVERYTHING?\\n\\nThis will permanently delete:\\n• ${worldCount} worlds\\n• ${characterCount} characters\\n• All associated data\\n\\nTHIS CANNOT BE UNDONE!\\n\\nAre you absolutely sure?`);
    if (!confirmed) return;

    const doubleConfirmed = confirm(`FINAL WARNING\\n\\nYou are about to delete EVERYTHING.\\n\\nClick OK to proceed with total data destruction.`);
    if (!doubleConfirmed) return;

    try {
      // Use the reset methods to completely clear both stores
      const characterStoreState = characterStore.getState();
      const worldStoreState = worldStore.getState();

      // Reset character store first
      characterStoreState.reset();
      await new Promise(resolve => setTimeout(resolve, 50));

      // Reset world store
      worldStoreState.reset();
      await new Promise(resolve => setTimeout(resolve, 50));

      // Also clear localStorage as a backup
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem('world-store');
          localStorage.removeItem('character-store');
          localStorage.removeItem('worlds'); // Legacy storage
        } catch (e) {
          console.warn('Failed to clear localStorage:', e);
        }
      }

      console.log(`[DevTools] NUKED EVERYTHING: Reset both stores, deleted ${worldCount} worlds and ${characterCount} characters`);
      alert(`NUCLEAR OPTION COMPLETE\\n\\nDeleted ${worldCount} worlds and ${characterCount} characters.\\n\\nDatabase is now empty.`);
      
      // Force a small delay before allowing any other operations
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error('[DevTools] Error during nuclear deletion:', error);
      alert(`Error during deletion: ${error instanceof Error ? error.message : 'Unknown error'}\\n\\nSome data may not have been deleted. Check console for details.`);
    }
  };

  const handleDebugPersistence = () => {
    const worldStoreState = worldStore.getState();
    const characterStoreState = characterStore.getState();
    
    console.log('[DevTools] Current Store States:');
    console.log('World Store:', {
      worldCount: Object.keys(worldStoreState.worlds).length,
      currentWorldId: worldStoreState.currentWorldId,
      worlds: worldStoreState.worlds
    });
    console.log('Character Store:', {
      characterCount: Object.keys(characterStoreState.characters).length,
      currentCharacterId: characterStoreState.currentCharacterId,
      characters: characterStoreState.characters
    });
    
    // Check localStorage
    if (typeof window !== 'undefined') {
      console.log('localStorage entries:');
      console.log('world-store:', localStorage.getItem('world-store'));
      console.log('character-store:', localStorage.getItem('character-store'));
      console.log('worlds (legacy):', localStorage.getItem('worlds'));
    }
    
    alert('Debug info logged to console. Check browser developer tools.');
  };
  
  return (
    <div className="space-y-4">
      <h3 className="font-bold text-sm">Test Data Generators</h3>
      
      <div className="space-y-2">
        <button
          onClick={handleGenerateWorld}
          className="w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm transition-colors"
          title="Creates diverse AI worlds: 33% original, 33% set in existing universes, 34% based on existing universes"
        >
          Generate Diverse AI World
        </button>
        
        <button
          onClick={handleGenerate5Worlds}
          className="w-full px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm transition-colors"
          title="Creates 5 diverse AI worlds with mix of original, 'set in', and 'based on' types for comprehensive testing"
        >
          Generate 5 Diverse AI Worlds
        </button>
        
        <button
          onClick={handleGenerateCharacter}
          className="w-full px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm transition-colors"
          disabled={!effectiveWorldId}
          title="Creates test character data and navigates to character creation form"
        >
          Generate & Fill Character Form
        </button>
        
        <button
          onClick={handleGenerate5Characters}
          className="w-full px-3 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 text-sm transition-colors"
          disabled={!effectiveWorldId}
          title="Creates 5 AI-generated characters directly in the selected world using smart character type selection based on world relationship"
        >
          Generate 5 Smart AI Characters for World
        </button>
        
        <button
          onClick={handleNavigateEmpty}
          className="w-full px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm transition-colors"
          disabled={!effectiveWorldId}
          title="Navigate to empty character creation form"
        >
          Go to Empty Form
        </button>
        
        <button
          onClick={handleDebugStorage}
          className="w-full px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm transition-colors"
          disabled={!effectiveWorldId}
          title="Check if test data exists in sessionStorage"
        >
          Debug: Check Storage
        </button>
      </div>
      
      <p className="text-xs text-gray-400">
        AI generators create diverse content for testing: original worlds, &quot;set in&quot; universes, and &quot;based on&quot; worlds.
        {!effectiveWorldId && ' Select a world to enable character generation.'}
        {worldIdFromUrl && <span className="block mt-1 text-blue-400">Using world from current page: {worlds[worldIdFromUrl]?.name}</span>}
      </p>

      {/* Destructive Operations Section */}
      <div className="border-t border-red-600 pt-4">
        <h4 className="font-bold text-sm text-red-400 mb-2">Destructive Operations</h4>
        <div className="space-y-2">
          <button
            onClick={handleDeleteAllCharactersInWorld}
            className="w-full px-3 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 text-sm transition-colors"
            disabled={!effectiveWorldId}
            title={`Deletes all characters in ${effectiveWorldId ? worlds[effectiveWorldId]?.name : 'the selected world'}`}
          >
            Delete All Characters in {effectiveWorldId ? worlds[effectiveWorldId]?.name : 'World'}
          </button>
          
          <button
            onClick={handleDeleteAllWorlds}
            className="w-full px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm transition-colors"
            title="Deletes all worlds and their characters"
          >
            Delete All Worlds
          </button>
          
          <button
            onClick={handleNukeEverything}
            className="w-full px-3 py-2 bg-red-800 text-white rounded hover:bg-red-900 text-sm transition-colors border-2 border-red-600"
            title="NUCLEAR OPTION: Deletes absolutely everything"
          >
            NUKE EVERYTHING
          </button>
        </div>
        <p className="text-xs text-red-300 mt-2">
          WARNING: These operations are permanent and cannot be undone!
        </p>
        
        <button
          onClick={handleDebugPersistence}
          className="w-full px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm transition-colors mt-2"
          title="Debug current store state and persistence"
        >
          Debug Persistence State
        </button>
      </div>
      
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