'use client';

import React, { useState } from 'react';
import { useWorldStore } from '@/state/worldStore';
import {
  generateWorld,
  type GeneratedWorldData,
} from '@/lib/generators/worldGenerator';
import { safeTrim, capitalize } from '@/lib/utils';
import { worldCreationService } from '@/lib/services/worldCreationService';
import { toGenreValue } from '@/lib/constants/genres';

export default function WorldGenerationTestPage() {
  const [worldReference, setWorldReference] = useState('');
  const [suggestedName, setSuggestedName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedWorld, setGeneratedWorld] =
    useState<GeneratedWorldData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { worlds } = useWorldStore();

  const handleGenerate = async () => {
    if (!safeTrim(worldReference)) {
      setError('Please enter a world reference');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedWorld(null);

    try {
      const existingNames = Object.values(worlds).map((w) => w.name);
      const result = await generateWorld({
        method: 'ai',
        reference: safeTrim(worldReference),
        relationship: 'inspired_by',
        existingNames,
        suggestedName: safeTrim(suggestedName) || undefined,
      });

      setGeneratedWorld(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateWorld = async () => {
    if (!generatedWorld) return;

    await worldCreationService.createWorldFromGeneration({
      generatedData: generatedWorld,
      customizations: {
        name: generatedWorld.name,
        genre: toGenreValue(generatedWorld.genre),
        description: generatedWorld.description,
      },
    });

    setGeneratedWorld(null);
    setWorldReference('');
    setSuggestedName('');
  };

  const presetReferences = [
    'Lord of the Rings',
    'Star Wars',
    'Harry Potter',
    'Game of Thrones',
    'Cyberpunk 2077',
    'Ancient Rome',
    'Victorian England',
    'Wild West',
    'Post-Apocalyptic Wasteland',
    'space-opera',
    'Steampunk',
    'Modern Spy Thriller',
    'Medieval Fantasy',
    'Superhero Universe',
  ];

  return (
    <div>
      <h1>World Generation Test Harness</h1>

      <div>
        {/* World Reference Input */}
        <div>
          <h2>World Reference</h2>
          <div>
            <div>
              <label>Enter a fictional or non-fictional world reference:</label>
              <input
                type="text"
                value={worldReference}
                onChange={(e) => setWorldReference(e.target.value)}
                placeholder="e.g., Lord of the Rings, Ancient Rome, Cyberpunk 2077"
              />
            </div>

            <div>
              <label>Or choose a preset:</label>
              <div>
                {presetReferences.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setWorldReference(preset)}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Custom Name */}
        <div>
          <h2>Custom Name (Optional)</h2>
          <div>
            <label>Override the AI-generated name:</label>
            <input
              type="text"
              value={suggestedName}
              onChange={(e) => setSuggestedName(e.target.value)}
              placeholder="Leave empty to use AI-generated name"
            />
          </div>
        </div>

        {/* Generate Button */}
        <div>
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !safeTrim(worldReference)}
          >
            {isGenerating ? 'Generating World...' : 'Generate World'}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div>
            <p>{error}</p>
          </div>
        )}

        {/* Generated World Display */}
        {generatedWorld && (
          <div>
            <h2>Generated World</h2>

            <div>
              <div>
                <h3>Name:</h3>
                <p>{generatedWorld.name}</p>
              </div>

              <div>
                <h3>Genre:</h3>
                <p>{generatedWorld.genre}</p>
              </div>

              <div>
                <h3>Description:</h3>
                <p>{generatedWorld.description}</p>
              </div>

              <div>
                <h3>Attributes ({generatedWorld.attributes.length}):</h3>
                <div>
                  {generatedWorld.attributes.map((attr, index: number) => (
                    <div key={index}>
                      <div>{attr.name}</div>
                      <div>{attr.description}</div>
                      <div>
                        Range: {attr.minValue} - {attr.maxValue} (Default:{' '}
                        {attr.baseValue})
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3>Skills ({generatedWorld.skills.length}):</h3>
                <div>
                  {generatedWorld.skills.map((skill, index: number) => (
                    <div key={index}>
                      <div>{skill.name}</div>
                      <div>{skill.description}</div>
                      <div>
                        <span
                          className={`${
                            skill.difficulty === 'easy'
                              ? ''
                              : skill.difficulty === 'medium'
                                ? ''
                                : ''
                          }`}
                        >
                          {capitalize(skill.difficulty)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3>Settings:</h3>
                <div>
                  <div>
                    Attribute Pool: {generatedWorld.settings.attributePointPool}
                  </div>
                  <div>
                    Skill Pool: {generatedWorld.settings.skillPointPool}
                  </div>
                  <div>
                    Max Attributes: {generatedWorld.settings.maxAttributes}
                  </div>
                  <div>Max Skills: {generatedWorld.settings.maxSkills}</div>
                </div>
              </div>

              <div>
                <button onClick={handleCreateWorld}>Create This World</button>
              </div>
            </div>
          </div>
        )}

        {/* Existing Worlds */}
        <div>
          <h2>Existing Worlds</h2>
          <div>
            {Object.values(worlds).map((world) => (
              <div key={world.id}>
                <div>
                  <span>{world.name}</span>
                  <span>({world.genre})</span>
                </div>
                <div>
                  {world.attributes.length} attrs, {world.skills.length} skills
                </div>
              </div>
            ))}
            {Object.values(worlds).length === 0 && <p>No worlds created yet</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
