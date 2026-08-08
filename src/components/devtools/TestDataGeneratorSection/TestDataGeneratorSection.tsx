import React from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useWorldStore } from '@/state/worldStore';
import { useCharacterStore, type Character } from '@/state/characterStore';
import { Button } from '@/components/ui/button';
import { generateUniqueId } from '@/lib/utils/generateId';
import type { GeneratedImage } from '@/types/common.types';
import { getTimestamp } from '@/lib/utils';
import { ensureWorldNpcRoster } from '@/lib/services/worldCreationService';
import Logger from '@/lib/utils/logger';

const logger = new Logger('TestDataGenerator');

const TV_MOVIE_UNIVERSES = [
  'Game of Thrones',
  'Lord of the Rings',
  'Star Wars',
  'Twin Peaks',
  'Stranger Things',
  'Deadwood',
  'The Walking Dead',
  'Black Mirror',
  'The Matrix',
  'Mad Max',
  'Westworld',
  'Star Trek',
  'Dune',
];

type WorldRelationship = 'set_within' | 'inspired_by' | undefined;

/** Pick a random reference/relationship: 33% original, 33% set_within, 34% inspired_by. */
function pickRandomWorldType(): { reference?: string; relationship: WorldRelationship } {
  const roll = Math.random();
  if (roll < 0.33) return { reference: undefined, relationship: undefined };
  const reference = TV_MOVIE_UNIVERSES[Math.floor(Math.random() * TV_MOVIE_UNIVERSES.length)];
  return { reference, relationship: roll < 0.66 ? 'set_within' : 'inspired_by' };
}

/** Transform API-generated world data to the shape expected by `worldStore.createWorld`. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildWorldDataForStore(testWorldData: any, reference: string | undefined, relationship: WorldRelationship): any {
  return {
    ...testWorldData,
    reference,
    relationship,
    universeReference: reference,
    universeRelationship: relationship,
    attributes: testWorldData.attributes.map((attr: Record<string, unknown>) => ({
      ...attr,
      id: generateUniqueId('attr'),
      worldId: '',
    })),
    skills: testWorldData.skills.map((skill: Record<string, unknown>) => ({
      ...skill,
      id: generateUniqueId('skill'),
      worldId: '',
    })),
  };
}

/** Fire-and-await world image generation via API, swallowing failures so world creation isn't blocked. */
async function generateWorldImageAsync(worldId: string, worldName: string): Promise<void> {
  try {
    const world = useWorldStore.getState().worlds[worldId];
    if (!world) return;

    const response = await fetch('/api/generate-world-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ world }),
    });

    if (response.ok) {
      const { imageUrl, aiGenerated } = await response.json();
      const image: GeneratedImage = {
        type: aiGenerated ? 'ai-generated' : 'placeholder',
        url: imageUrl,
        generatedAt: getTimestamp(),
      };
      useWorldStore.getState().updateWorld(worldId, { image });
    } else {
      const errorText = await response.text();
      logger.warn(
        `[DevTools] Failed to generate world image for "${worldName}": ${response.status} - ${errorText}`
      );
    }
  } catch (error) {
    logger.error(`Failed to generate world image for test world "${worldName}":`, error);
  }
}

export const TestDataGeneratorSection: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { worlds, currentWorldId, createWorld } = useWorldStore();
  const { createCharacter } = useCharacterStore();

  // Check if we're on the characters page and get the worldId from URL
  const isOnCharactersPage = pathname === '/characters';
  const worldIdFromUrl = isOnCharactersPage
    ? searchParams.get('worldId')
    : null;
  const effectiveWorldId = worldIdFromUrl || currentWorldId;

  const handleGenerateWorld = async () => {
    try {
      const { reference, relationship } = pickRandomWorldType();
      const existingNames = Object.values(worlds).map((w) => w.name);

      const response = await fetch('/api/generate-world', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          worldReference: reference,
          worldRelationship: relationship,
          existingNames,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate test world via API');
      }

      const testWorldData = await response.json();
      const worldId = createWorld(buildWorldDataForStore(testWorldData, reference, relationship));
      await ensureWorldNpcRoster(worldId);

      useWorldStore.getState().setCurrentWorld(worldId);

      await generateWorldImageAsync(worldId, testWorldData.name);
    } catch (error) {
      logger.error('[DevTools] Error generating test world:', error);
      alert(
        `Error generating test world: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  const handleGenerate5Worlds = async () => {
    const createdWorlds: Array<{ id: string; name: string }> = [];

    try {
      const existingNames = Object.values(worlds).map((w) => w.name);

      for (let i = 0; i < 5; i++) {
        const { reference, relationship } = pickRandomWorldType();

        const allExistingNames = [
          ...existingNames,
          ...createdWorlds.map((w) => w.name),
        ];

        const response = await fetch('/api/generate-world', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            worldReference: reference,
            worldRelationship: relationship,
            existingNames: allExistingNames,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to generate test world via API');
        }

        const testWorldData = await response.json();
        const worldId = createWorld(buildWorldDataForStore(testWorldData, reference, relationship));
        await ensureWorldNpcRoster(worldId);
        createdWorlds.push({ id: worldId, name: testWorldData.name });

        if (i === 0) {
          useWorldStore.getState().setCurrentWorld(worldId);
        }

        await generateWorldImageAsync(worldId, testWorldData.name);
      }

      const worldNames = createdWorlds.map((w) => w.name).join(', ');
      alert(`Successfully generated 5 test worlds with images: ${worldNames}`);
    } catch (error) {
      logger.error('[DevTools] Error generating test worlds:', error);
      alert(
        `Error generating test worlds: ${error instanceof Error ? error.message : 'Unknown error'}\\n\\nGenerated ${createdWorlds.length} worlds before error.`
      );
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

    // User-invoked diagnostic: print directly so it shows regardless of Logger level.
    if (storedData) {
      console.log(
        '[TestDataGenerator] Current stored data:',
        JSON.parse(storedData)
      );
      alert(
        `Data found in sessionStorage for key: ${storageKey}. Check console for details.`
      );
    } else {
      console.log(
        '[TestDataGenerator] No data found in sessionStorage for key:',
        storageKey
      );
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
    const { characters } = useCharacterStore.getState();
    const existingCharacterNames = (Object.values(characters) as Character[])
      .filter((char) => char.worldId === currentWorld.id)
      .map((char) => char.name);

    try {
      for (let i = 0; i < 5; i++) {
        // Random character type selection (50/50 between known and original)
        const types: Array<'known' | 'original'> = ['known', 'original'];
        const characterType = types[Math.floor(Math.random() * types.length)];

        // Use the AI character generator via API route (secure approach from develop)
        const response: Response = await fetch('/api/generate-character', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            worldId: currentWorld.id,
            characterType,
            existingNames: [
              ...existingCharacterNames,
              ...createdCharacters.map((c) => c.name),
            ],
            world: currentWorld,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to generate character');
        }

        const aiCharacterData = await response.json();

        // Convert AI-generated data to character store format
        const characterData = {
          name: aiCharacterData.name,
          description: `A character from ${currentWorld.name}`,
          worldId: currentWorld.id,
          level: aiCharacterData.level || 1,
          isPlayer: true,
          attributes: aiCharacterData.attributes.map(
            (attr: { id: string; value: number }) => {
              const worldAttr = currentWorld.attributes.find(
                (wa) => wa.id === attr.id
              );
              return {
                id: generateUniqueId('attr'),
                characterId: '', // Will be set by store
                name: worldAttr?.name || 'Unknown',
                baseValue: attr.value,
                modifiedValue: attr.value,
                category: worldAttr?.category,
              };
            }
          ),
          skills: aiCharacterData.skills.map(
            (skill: { id: string; level: number }) => {
              const worldSkill = currentWorld.skills.find(
                (ws) => ws.id === skill.id
              );
              return {
                id: generateUniqueId('skill'),
                characterId: '', // Will be set by store
                name: worldSkill?.name || 'Unknown',
                level: skill.level,
                category: worldSkill?.category,
              };
            }
          ),
          derivedStats: [],
          background: {
            history: aiCharacterData.background.description || '',
            personality: aiCharacterData.background.personality || '',
            physicalDescription:
              aiCharacterData.background.physicalDescription || '',
            goals: aiCharacterData.background.motivation
              ? [aiCharacterData.background.motivation]
              : [],
            fears: [],
            relationships: [],
            isKnownFigure: characterType === 'known',
          },
          status: {
            health: 100,
            maxHealth: 100,
            conditions: [],
          },
          inventory: {
            characterId: '', // Will be set by store
            items: [],
            capacity: 100,
            categories: [],
            itemOrder: [],
          },
        };

        const characterId = createCharacter(characterData);
        createdCharacters.push({ id: characterId, name: characterData.name });

        // Generate portrait asynchronously via API route (secure approach)
        try {
          // Get the created character from store
          const storeCharacter =
            useCharacterStore.getState().characters[characterId];
          if (storeCharacter) {
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
                    physicalDescription:
                      storeCharacter.background.physicalDescription || '',
                    goals: storeCharacter.background.goals,
                    fears: storeCharacter.background.fears,
                    relationships: [],
                  },
                  attributes: storeCharacter.attributes.map(
                    (attr: {
                      id: string;
                      name: string;
                      baseValue: number;
                    }) => ({
                      attributeId:
                        currentWorld.attributes.find(
                          (wa) => wa.name === attr.name
                        )?.id || attr.id,
                      value: attr.baseValue,
                    })
                  ),
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  skills: storeCharacter.skills.map((skill: any) => ({
                    skillId:
                      currentWorld.skills.find((ws) => ws.name === skill.name)
                        ?.id || skill.id,
                    level: skill.level,
                    experience: 0,
                    isActive: true,
                  })),
                  inventory: {
                    characterId: storeCharacter.id,
                    items: [],
                    capacity: 100,
                    categories: [],
                  },
                  status: {
                    health: storeCharacter.status.health,
                    maxHealth: storeCharacter.status.maxHealth,
                    conditions: storeCharacter.status.conditions,
                    location: currentWorld.name,
                  },
                  createdAt: storeCharacter.createdAt,
                  updatedAt: storeCharacter.updatedAt,
                },
                world: currentWorld,
              }),
            });

            if (response.ok) {
              const { portrait } = await response.json();
              // Update the character with the generated portrait
              useCharacterStore
                .getState()
                .updateCharacter(characterId, { portrait });
            } else {
              logger.warn(
                `[DevTools] Portrait generation failed for ${characterType} character "${characterData.name}"`
              );
            }
          }
        } catch (error) {
          logger.error(
            `[DevTools] Failed to generate portrait for ${characterType} character "${characterData.name}":`,
            error
          );
          // Don't block character creation if portrait generation fails
        }
      }

      const characterNames = createdCharacters.map((c) => c.name).join(', ');
      alert(
        `Successfully generated 5 AI characters (random type selection) with portraits: ${characterNames}`
      );
    } catch (error) {
      logger.error('[DevTools] Error generating AI characters:', error);
      alert(
        `Error generating characters: ${error instanceof Error ? error.message : 'Unknown error'}\\n\\nGenerated ${createdCharacters.length} characters before error.`
      );
    }
  };

  const handleDeleteAllWorlds = async () => {
    const worldCount = Object.keys(worlds).length;
    if (worldCount === 0) {
      alert('No worlds to delete');
      return;
    }

    const confirmed = confirm(
      `DELETE ALL WORLDS?\\n\\nThis will permanently delete all ${worldCount} worlds and their characters.\\n\\nThis action cannot be undone!`
    );
    if (!confirmed) return;

    try {
      // Get fresh references to the store methods
      const characterStoreState = useCharacterStore.getState();
      const worldStoreState = useWorldStore.getState();

      // Delete all characters first
      const characterIds = Object.keys(characterStoreState.characters);
      for (const characterId of characterIds) {
        await characterStoreState.deleteCharacter(characterId);
        await new Promise((resolve) => setTimeout(resolve, 1));
      }

      // Then delete all worlds
      const worldIds = Object.keys(worldStoreState.worlds);
      for (const worldId of worldIds) {
        await worldStoreState.deleteWorld(worldId);
        await new Promise((resolve) => setTimeout(resolve, 1));
      }

      // Clear current world selection
      if (worldStoreState.currentWorldId) {
        worldStoreState.setCurrentWorld('');
      }

      alert(
        `Successfully deleted all ${worldCount} worlds and their characters`
      );
    } catch (error) {
      logger.error('[DevTools] Error deleting all worlds:', error);
      alert(
        `Error during deletion: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  const handleDeleteAllCharactersInWorld = async () => {
    const currentWorld = effectiveWorldId ? worlds[effectiveWorldId] : null;
    if (!currentWorld) {
      alert('Please select a world first');
      return;
    }

    const { characters } = useCharacterStore.getState();
    const worldCharacters = (Object.values(characters) as Character[]).filter(
      (char) => char.worldId === currentWorld.id
    );

    if (worldCharacters.length === 0) {
      alert(`No characters found in world "${currentWorld.name}"`);
      return;
    }

    const confirmed = confirm(
      `DELETE ALL CHARACTERS IN "${currentWorld.name}"?\\n\\nThis will permanently delete ${worldCharacters.length} characters.\\n\\nThis action cannot be undone!`
    );
    if (!confirmed) return;

    try {
      const { deleteCharacter } = useCharacterStore.getState();

      for (const character of worldCharacters) {
        await deleteCharacter(character.id);
        await new Promise((resolve) => setTimeout(resolve, 1));
      }

      alert(
        `Successfully deleted ${worldCharacters.length} characters from "${currentWorld.name}"`
      );
    } catch (error) {
      logger.error('[DevTools] Error deleting characters:', error);
      alert(
        `Error during deletion: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  const handleNukeEverything = async () => {
    const worldCount = Object.keys(worlds).length;
    const { characters } = useCharacterStore.getState();
    const characterCount = Object.keys(characters).length;
    const totalItems = worldCount + characterCount;

    if (totalItems === 0) {
      alert('Nothing to delete - database is already empty');
      return;
    }

    const confirmed = confirm(
      `NUCLEAR OPTION - DELETE EVERYTHING?\\n\\nThis will permanently delete:\\n• ${worldCount} worlds\\n• ${characterCount} characters\\n• All associated data\\n\\nTHIS CANNOT BE UNDONE!\\n\\nAre you absolutely sure?`
    );
    if (!confirmed) return;

    const doubleConfirmed = confirm(
      `FINAL WARNING\\n\\nYou are about to delete EVERYTHING.\\n\\nClick OK to proceed with total data destruction.`
    );
    if (!doubleConfirmed) return;

    try {
      // Use the reset methods to completely clear both stores
      const characterStoreState = useCharacterStore.getState();
      const worldStoreState = useWorldStore.getState();

      // Reset character store first
      characterStoreState.reset();
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Reset world store
      worldStoreState.reset();
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Also clear localStorage as a backup
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem('world-store');
          localStorage.removeItem('character-store');
          localStorage.removeItem('worlds'); // Legacy storage
        } catch (e) {
          logger.warn('Failed to clear localStorage:', e);
        }
      }

      alert(
        `NUCLEAR OPTION COMPLETE\\n\\nDeleted ${worldCount} worlds and ${characterCount} characters.\\n\\nDatabase is now empty.`
      );

      // Force a small delay before allowing any other operations
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      logger.error('[DevTools] Error during nuclear deletion:', error);
      alert(
        `Error during deletion: ${error instanceof Error ? error.message : 'Unknown error'}\\n\\nSome data may not have been deleted. Check console for details.`
      );
    }
  };

  const handleDebugPersistence = () => {
    const worldStoreState = useWorldStore.getState();
    const characterStoreState = useCharacterStore.getState();

    // User-invoked diagnostic: print directly so it shows regardless of Logger level.
    console.log('[DevTools] Current Store States:');
    console.log('World Store:', {
      worldCount: Object.keys(worldStoreState.worlds).length,
      currentWorldId: worldStoreState.currentWorldId,
      worlds: worldStoreState.worlds,
    });
    console.log('Character Store:', {
      characterCount: Object.keys(characterStoreState.characters).length,
      currentCharacterId: characterStoreState.currentCharacterId,
      characters: characterStoreState.characters,
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
    <div>
      <h3>Test Data Generators</h3>

      <div>
        <Button
          onClick={handleGenerateWorld}
          
          size="sm"
          variant="info"
          title="Creates diverse AI worlds: 33% original, 33% set in existing universes, 34% based on existing universes"
        >
          Generate Diverse AI World
        </Button>

        <Button
          onClick={handleGenerate5Worlds}
          
          size="sm"
          variant="info"
          title="Creates 5 diverse AI worlds with a mix of original, 'set in', and 'based on' types"
        >
          Generate 5 Diverse AI Worlds
        </Button>

        <Button
          onClick={handleGenerate5Characters}
          
          size="sm"
          variant="success"
          disabled={!effectiveWorldId}
          title="Creates 5 AI-generated characters directly in the selected world with random character type selection (50/50 known/original)"
        >
          Generate 5 AI Characters for World
        </Button>

        <Button
          onClick={handleNavigateEmpty}
          
          size="sm"
          variant="secondary"
          disabled={!effectiveWorldId}
          title="Navigate to empty character creation form"
        >
          Go to Empty Form
        </Button>

        <Button
          onClick={handleDebugStorage}
          
          size="sm"
          variant="default"
          disabled={!effectiveWorldId}
          title="Check if test data exists in sessionStorage"
        >
          Debug: Check Storage
        </Button>
      </div>

      <p>
        AI generators create diverse content for testing: original worlds,
        &quot;set in&quot; universes, and &quot;based on&quot; worlds.
        {!effectiveWorldId && 'Select a world to enable character generation.'}
        {worldIdFromUrl && (
          <span>
            Using world from current page: {worlds[worldIdFromUrl]?.name}
          </span>
        )}
      </p>

      {/* Destructive Operations Section */}
      <div>
        <h4>
          Destructive Operations
        </h4>
        <div>
          <Button
            onClick={handleDeleteAllCharactersInWorld}
            
            size="sm"
            variant="warning"
            disabled={!effectiveWorldId}
            title={`Deletes all characters in ${effectiveWorldId ? worlds[effectiveWorldId]?.name : 'the selected world'}`}
          >
            Delete All Characters in{' '}
            {effectiveWorldId ? worlds[effectiveWorldId]?.name : 'World'}
          </Button>

          <Button
            onClick={handleDeleteAllWorlds}
            
            size="sm"
            variant="destructive"
            title="Deletes all worlds and their characters"
          >
            Delete All Worlds
          </Button>

          <Button
            onClick={handleNukeEverything}
            
            size="sm"
            variant="destructive"
            title="NUCLEAR OPTION: Deletes absolutely everything"
          >
            NUKE EVERYTHING
          </Button>
        </div>
        <p>
          WARNING: These operations are permanent and cannot be undone!
        </p>

        <Button
          onClick={handleDebugPersistence}
          
          size="sm"
          variant="default"
          title="Debug current store state and persistence"
        >
          Debug Persistence State
        </Button>
      </div>

      <div>
        <strong>Troubleshooting:</strong>
        <ul>
          <li>
            If form isn&apos;t pre-filled, try the debug page at{' '}
            <code>/dev/test-character-form</code>
          </li>
          <li>
            Check browser console for <code>[TestDataGenerator]</code> and{' '}
            <code>[CharacterCreationWizard]</code> logs
          </li>
          <li>Clear cache and hard refresh if needed (Cmd+Shift+R)</li>
        </ul>
      </div>
    </div>
  );
};
