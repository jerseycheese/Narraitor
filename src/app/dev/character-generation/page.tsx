'use client';

import React, { useState } from 'react';
import { useWorldStore } from '@/state/worldStore';
import { useCharacterStore, type StoreCharacter } from '@/state/characterStore';
import {
  generateAICharacter,
  type GeneratedCharacterData,
} from '@/lib/generators/characterGenerator';

export default function CharacterGenerationTestPage() {
  const [generationType, setGenerationType] = useState<
    'known' | 'original' | 'specific'
  >(() => {
    const types: Array<'known' | 'original'> = ['known', 'original'];
    return types[Math.floor(Math.random() * types.length)];
  });
  const [suggestedName, setSuggestedName] = useState('');
  const [selectedWorldId, setSelectedWorldId] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCharacter, setGeneratedCharacter] =
    useState<GeneratedCharacterData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { worlds } = useWorldStore();
  const { characters } = useCharacterStore();

  const handleGenerate = async () => {
    if (!selectedWorldId) {
      setError('Please select a world');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedCharacter(null);

    try {
      const world = worlds[selectedWorldId];
      const existingNames = (Object.values(characters) as StoreCharacter[])
        .filter((c) => c.worldId === selectedWorldId)
        .map((c) => c.name);

      const result = await generateAICharacter(
        world,
        existingNames,
        generationType === 'specific' ? suggestedName : undefined,
        generationType
      );

      setGeneratedCharacter(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateCharacter = () => {
    if (!generatedCharacter || !selectedWorldId) return;

    const world = worlds[selectedWorldId];

    useCharacterStore.getState().createCharacter({
      name: generatedCharacter.name,
      description: generatedCharacter.background.description || '',
      worldId: selectedWorldId,
      level: generatedCharacter.level || 1,
      attributes: generatedCharacter.attributes.map((attr) => {
        const worldAttr = world.attributes.find((wa) => wa.id === attr.id);
        return {
          id: `attr-${Date.now()}-${Math.random()}`,
          characterId: '',
          name: worldAttr?.name || 'Unknown',
          baseValue: attr.value,
          modifiedValue: attr.value,
        };
      }),
      skills: generatedCharacter.skills.map((skill) => {
        const worldSkill = world.skills.find((ws) => ws.id === skill.id);
        return {
          id: `skill-${Date.now()}-${Math.random()}`,
          characterId: '',
          name: worldSkill?.name || 'Unknown',
          level: skill.level,
        };
      }),
      derivedStats: [],
      background: {
        history: generatedCharacter.background.description,
        personality: generatedCharacter.background.personality,
        goals: generatedCharacter.background.motivation
          ? [generatedCharacter.background.motivation]
          : [],
        fears: generatedCharacter.background.fears || [],
        physicalDescription: generatedCharacter.background.physicalDescription,
        relationships: [],
      },
      isPlayer: true,
      status: {
        conditions: [],
      },
      inventory: {
        characterId: '',
        items: [],
        capacity: 20,
        categories: [],
        itemOrder: [],
      },
    });

    setGeneratedCharacter(null);
    setSuggestedName('');
  };

  return (
    <div>
      <h1>
        Character Generation Test Harness
      </h1>

      <div>
        {/* World Selection */}
        <div>
          <h2>Select World</h2>
          <select
            value={selectedWorldId}
            onChange={(e) => setSelectedWorldId(e.target.value)}
          >
            <option value="">-- Select a World --</option>
            {Object.entries(worlds).map(([id, world]) => (
              <option key={id} value={id}>
                {world.name} ({world.genre})
              </option>
            ))}
          </select>
        </div>

        {/* Generation Type */}
        <div>
          <h2>Generation Type</h2>
          <div>
            <label>
              <input
                type="radio"
                value="known"
                checked={generationType === 'known'}
                onChange={(e) =>
                  setGenerationType(e.target.value as typeof generationType)
                }
              />
              <span>Known Figure (canonical character from source)</span>
            </label>
            <label>
              <input
                type="radio"
                value="original"
                checked={generationType === 'original'}
                onChange={(e) =>
                  setGenerationType(e.target.value as typeof generationType)
                }
              />
              <span>Original Character (new character fitting the world)</span>
            </label>
            <label>
              <input
                type="radio"
                value="specific"
                checked={generationType === 'specific'}
                onChange={(e) =>
                  setGenerationType(e.target.value as typeof generationType)
                }
              />
              <span>Specific Character (provide name)</span>
            </label>
          </div>

          {generationType === 'specific' && (
            <div>
              <label>
                Character Name
              </label>
              <input
                type="text"
                value={suggestedName}
                onChange={(e) => setSuggestedName(e.target.value)}
                placeholder="Enter character name"
              />
            </div>
          )}
        </div>

        {/* Generate Button */}
        <div>
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !selectedWorldId}
          >
            {isGenerating ? 'Generating...' : 'Generate Character'}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div>
            <p>{error}</p>
          </div>
        )}

        {/* Generated Character Display */}
        {generatedCharacter && (
          <div>
            <h2>Generated Character</h2>

            <div>
              <div>
                <h3>Name:</h3>
                <p>{generatedCharacter.name}</p>
              </div>

              <div>
                <h3>Level:</h3>
                <p>{generatedCharacter.level || 1}</p>
              </div>

              <div>
                <h3>Background:</h3>
                <div>
                  <div>
                    <span>Description:</span>
                    <p>
                      {generatedCharacter.background.description}
                    </p>
                  </div>
                  <div>
                    <span>Personality:</span>
                    <p>
                      {generatedCharacter.background.personality}
                    </p>
                  </div>
                  <div>
                    <span>Motivation:</span>
                    <p>
                      {generatedCharacter.background.motivation}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3>Attributes:</h3>
                <div>
                  {generatedCharacter.attributes.map((attr) => {
                    const world = worlds[selectedWorldId];
                    const worldAttr = world.attributes.find(
                      (wa) => wa.id === attr.id
                    );
                    return (
                      <div key={attr.id} >
                        <span>{worldAttr?.name}:</span>
                        <span>{attr.value}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <h3>Skills:</h3>
                <div>
                  {generatedCharacter.skills.map((skill) => {
                    const world = worlds[selectedWorldId];
                    const worldSkill = world.skills.find(
                      (ws) => ws.id === skill.id
                    );
                    return (
                      <div key={skill.id} >
                        <span>{worldSkill?.name}:</span>
                        <span>{skill.level}/10</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <button
                  onClick={handleCreateCharacter}
                >
                  Create This Character
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Existing Characters */}
        <div>
          <h2>
            Existing Characters in Selected World
          </h2>
          {selectedWorldId ? (
            <div>
              {(Object.values(characters) as StoreCharacter[])
                .filter((c) => c.worldId === selectedWorldId)
                .map((char) => (
                  <div key={char.id}>
                    <p>{char.name}</p>
                    <p>
                      Level {char.level || 1} &bull; {char.description}
                    </p>
                  </div>
                ))}
              {(Object.values(characters) as StoreCharacter[]).filter(
                (c) => c.worldId === selectedWorldId
              ).length === 0 && (
                <p>No characters in this world yet</p>
              )}
            </div>
          ) : (
            <p>Select a world to see characters</p>
          )}
        </div>
      </div>
    </div>
  );
}
