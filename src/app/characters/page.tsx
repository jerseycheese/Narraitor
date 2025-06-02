'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { characterStore } from '@/state/characterStore';
import { worldStore } from '@/state/worldStore';
import { CharacterPortrait } from '@/components/CharacterPortrait';
import { generateUniqueId } from '@/lib/utils/generateId';
import type { GeneratedCharacterData } from '@/lib/ai/characterGenerator';
import { GenerateCharacterDialog } from '@/components/GenerateCharacterDialog';
import { World } from '@/types/world.types';

// Type for character portrait update
type CharacterPortraitUpdate = {
  portrait: {
    type: 'ai-generated' | 'placeholder';
    url: string | null;
    generatedAt?: string;
    prompt?: string;
  };
};

// Helper function to transform generated data to character attributes
function transformGeneratedAttributes(generatedData: GeneratedCharacterData, currentWorld: World) {
  return generatedData.attributes.map((attr) => {
    const worldAttr = currentWorld.attributes.find((wa) => wa.id === attr.id);
    return {
      id: generateUniqueId('attr'),
      characterId: '', // Will be set by store
      worldAttributeId: attr.id, // Store reference to world attribute ID
      name: worldAttr?.name || 'Unknown',
      baseValue: attr.value, // Use the AI-generated value
      modifiedValue: attr.value, // Use the AI-generated value
      category: worldAttr?.category || 'General'
    };
  });
}

// Helper function to transform generated data to character skills
function transformGeneratedSkills(generatedData: GeneratedCharacterData, currentWorld: World) {
  return generatedData.skills.map((skill) => {
    const worldSkill = currentWorld.skills.find((ws) => ws.id === skill.id);
    return {
      id: generateUniqueId('skill'),
      characterId: '', // Will be set by store
      worldSkillId: skill.id, // Store reference to world skill ID
      name: worldSkill?.name || 'Unknown',
      level: skill.level,
      category: worldSkill?.category
    };
  });
}

// Helper function to generate portrait for character
async function generateCharacterPortrait(
  characterId: string,
  generatedData: GeneratedCharacterData,
  currentWorld: World,
  currentWorldId: string,
  updateCharacter: (id: string, updates: CharacterPortraitUpdate) => void
) {
  try {
    // Use the portrait generation API route
    const response = await fetch('/api/generate-portrait', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        character: {
          name: generatedData.name,
          background: generatedData.background.description,
          physicalDescription: generatedData.background.physicalDescription || ''
        },
        worldTheme: currentWorld.theme
      }),
    });

    if (response.ok) {
      const portrait = await response.json();
      // Update character with generated portrait
      updateCharacter(characterId, { 
        portrait: {
          type: 'ai-generated',
          url: portrait.image,
          generatedAt: new Date().toISOString(),
          prompt: portrait.prompt
        }
      });
    }
  } catch (portraitError) {
    console.error('Failed to generate portrait:', portraitError);
    // Continue without portrait - character already has placeholder
  }
}

export default function CharactersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { characters, currentCharacterId, setCurrentCharacter, deleteCharacter, createCharacter, updateCharacter } = characterStore();
  const { worlds, currentWorldId } = worldStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingStatus, setGeneratingStatus] = useState<string>('');
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [characterName, setCharacterName] = useState('');
  const [generationType, setGenerationType] = useState<'known' | 'original' | 'specific'>('known');
  
  // Use worldId from URL if provided, otherwise use the current world
  const worldIdFromUrl = searchParams.get('worldId');
  const effectiveWorldId = worldIdFromUrl || currentWorldId;
  
  const currentWorld = effectiveWorldId ? worlds[effectiveWorldId] : null;
  const worldCharacters = Object.values(characters).filter(
    char => char.worldId === effectiveWorldId
  );

  const handleCreateCharacter = () => {
    router.push('/characters/create');
  };
  
  const handleGenerateCharacter = async () => {
    if (!currentWorld || !effectiveWorldId) return;
    
    // Validate specific character name
    if (generationType === 'specific' && !characterName.trim()) {
      setGenerateError('Please enter a character name');
      return;
    }
    
    setIsGenerating(true);
    setGenerateError(null);
    setGeneratingStatus('Creating character...');
    
    try {
      // Get existing character names to avoid duplicates
      const existingNames = worldCharacters.map(char => char.name);
      
      // Generate character data based on type
      const nameToUse = generationType === 'specific' ? characterName : undefined;
      
      // Use the character generation API route
      const response = await fetch('/api/generate-character', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          worldId: effectiveWorldId,
          characterType: generationType,
          existingNames: existingNames,
          suggestedName: nameToUse,
          world: currentWorld // Pass the world data to the API
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate character');
      }

      const generatedData: GeneratedCharacterData = await response.json();
      
      // Create the character with transformed attributes and skills
      const characterId = createCharacter({
        name: generatedData.name,
        worldId: effectiveWorldId,
        level: generatedData.level,
        attributes: transformGeneratedAttributes(generatedData, currentWorld),
        skills: transformGeneratedSkills(generatedData, currentWorld),
        background: {
          history: generatedData.background.description,
          personality: generatedData.background.personality,
          goals: generatedData.background.motivation ? [generatedData.background.motivation] : [],
          fears: generatedData.background.fears || [], // AI-generated fears
          physicalDescription: generatedData.background.physicalDescription || ''
        },
        isPlayer: true,
        status: {
          hp: 100,
          mp: 50,
          stamina: 100,
        },
        portrait: {
          type: 'placeholder',
          url: null
        }
      });
      
      // Select the new character
      setCurrentCharacter(characterId);
      
      // Generate portrait for the character
      setGeneratingStatus('Generating portrait...');
      await generateCharacterPortrait(
        characterId,
        generatedData,
        currentWorld,
        effectiveWorldId,
        updateCharacter
      );
      
      // Reset dialog state
      setShowGenerateDialog(false);
      setCharacterName('');
      setGenerationType('known');
      setGenerateError(null);
      
      // Navigate to view the character
      router.push(`/characters/${characterId}`);
    } catch (error) {
      console.error('Failed to generate character:', error);
      setGenerateError(error instanceof Error ? error.message : 'Failed to generate character');
    } finally {
      setIsGenerating(false);
      setGeneratingStatus('');
    }
  };

  const handleSelectCharacter = (characterId: string) => {
    setCurrentCharacter(characterId);
  };

  const handleViewCharacter = (characterId: string) => {
    router.push(`/characters/${characterId}`);
  };

  const handleEditCharacter = (characterId: string) => {
    router.push(`/characters/${characterId}/edit`);
  };

  const handleDeleteCharacter = (characterId: string) => {
    if (confirm('Are you sure you want to delete this character?')) {
      deleteCharacter(characterId);
    }
  };

  if (!effectiveWorldId || !currentWorld) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Characters</h1>
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2">Choose Your World</h2>
            <p className="text-gray-600 mb-6">
              Characters belong to specific worlds. To create characters, you need to select an active world first.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6 text-sm">
              <h3 className="font-medium text-blue-900 mb-2">How to get started:</h3>
              <ol className="list-decimal list-inside space-y-1 text-blue-800">
                <li>Go to the Worlds page</li>
                <li>Click &quot;Make Active&quot; on any world you want to play in</li>
                <li>Return here to create characters for that world</li>
              </ol>
            </div>
            <button
              onClick={() => router.push('/worlds')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-md hover:shadow-lg"
            >
              Go to Worlds
            </button>
            <p className="text-sm text-gray-500 mt-4">
              Each world has unique attributes, skills, and themes that shape your characters
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Show back link if viewing from a specific world */}
        {worldIdFromUrl && (
          <div className="mb-6">
            <Link
              href={`/world/${worldIdFromUrl}`}
              className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
            >
              <span>←</span> Back to {currentWorld.name}
            </Link>
          </div>
        )}
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Characters</h1>
            <p className="text-gray-600 mt-2">World: {currentWorld.name}</p>
          </div>
          <div className="flex gap-2">
            {currentCharacterId && effectiveWorldId && (
              <button
                onClick={() => {
                  const character = characters[currentCharacterId];
                  if (character) {
                    router.push(`/world/${character.worldId}/play`);
                  }
                }}
                className="px-4 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Start Playing
              </button>
            )}
            <button
              onClick={() => setShowGenerateDialog(true)}
              disabled={isGenerating}
              className="px-4 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {generatingStatus || 'Generating...'}
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Generate Character
                </>
              )}
            </button>
            <button
              onClick={handleCreateCharacter}
              className="px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium transition-colors"
            >
              Create Character
            </button>
          </div>
        </div>

        {generateError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <p className="font-medium">Generation Failed</p>
            <p className="text-sm mt-1">{generateError}</p>
          </div>
        )}

        {worldCharacters.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center max-w-2xl mx-auto">
            <div className="mb-6">
              <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold mb-2">Ready to bring {currentWorld.name} to life?</h2>
              <p className="text-gray-600 mb-2">
                Your world is set up and ready for characters to inhabit it.
              </p>
              <p className="text-gray-500 text-sm">
                Create characters to explore your world and shape their stories!
              </p>
            </div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleGenerateCharacter}
                disabled={isGenerating}
                className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-lg font-semibold transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {generatingStatus || 'Generating...'}
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    Generate Character
                  </>
                )}
              </button>
              <button
                onClick={handleCreateCharacter}
                className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 text-lg font-semibold transition-colors shadow-md hover:shadow-lg cursor-pointer"
              >
                Create Your First Character
              </button>
            </div>
            <div className="mt-6 text-sm text-gray-500">
              <p>Each character starts with:</p>
              <ul className="mt-2 space-y-1">
                <li>• Custom attributes based on {currentWorld.name}&apos;s rules</li>
                <li>• Unique skills from your world&apos;s skill system</li>
                <li>• A rich backstory and personality</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {worldCharacters.map(character => (
              <div
                key={character.id}
                className={`border rounded-lg transition-all duration-200 relative overflow-hidden flex flex-col h-full ${
                  currentCharacterId === character.id 
                    ? 'border-green-500 bg-green-50 shadow-xl ring-2 ring-green-400' 
                    : 'border-gray-300 bg-white hover:shadow-lg'
                }`}
                onClick={() => handleSelectCharacter(character.id)}
              >
                {/* Active Character Header */}
                {currentCharacterId === character.id && (
                  <div className="bg-green-600 text-white px-4 py-2 flex items-center justify-center">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="font-medium text-sm">Currently Active Character</span>
                    </div>
                  </div>
                )}

                <div className="p-8 flex-grow flex flex-col">
                  <div className="flex-grow mb-6">
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewCharacter(character.id);
                      }}
                      className="cursor-pointer float-right ml-4 mb-3"
                    >
                      <CharacterPortrait
                        portrait={character.portrait || { type: 'placeholder', url: null }}
                        characterName={character.name}
                        size="large"
                      />
                    </div>
                    <h3 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewCharacter(character.id);
                      }}
                      className="text-xl font-semibold hover:text-blue-600 transition-colors cursor-pointer mb-1"
                    >
                      {character.name}
                    </h3>
                    <span className="text-sm text-gray-500 block mb-3">Level {character.level || 1}</span>
                    <p className="text-gray-600 leading-relaxed">
                      {character.background.personality || 'No description provided'}
                    </p>
                    <div className="clear-both"></div>
                  </div>
                  
                  {/* Footer with buttons - always at bottom */}
                  <footer className="mt-auto pt-6 border-t border-gray-200">
                    {/* Make Active button for inactive characters */}
                    {currentCharacterId !== character.id && (
                      <div className="mb-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectCharacter(character.id);
                          }}
                          className="w-full px-4 py-2 bg-green-100 hover:bg-green-200 text-green-800 hover:text-green-900 rounded-md transition-colors border border-green-300 hover:border-green-400 font-medium flex items-center justify-center gap-2"
                          title="Set as active character"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Make Active
                        </button>
                      </div>
                    )}
                    
                    <div className="flex gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewCharacter(character.id);
                        }}
                        className="flex-1 px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium transition-colors"
                      >
                        View
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditCharacter(character.id);
                        }}
                        className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCharacter(character.id);
                        }}
                        className="px-4 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </footer>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Character Generation Dialog */}
        <GenerateCharacterDialog
          isOpen={showGenerateDialog}
          isGenerating={isGenerating}
          generatingStatus={generatingStatus}
          characterName={characterName}
          generationType={generationType}
          worldName={currentWorld?.name || ''}
          error={generateError}
          onClose={() => {
            setShowGenerateDialog(false);
            setCharacterName('');
            setGenerationType('known');
            setGenerateError(null);
          }}
          onGenerate={handleGenerateCharacter}
          onCharacterNameChange={setCharacterName}
          onGenerationTypeChange={setGenerationType}
        />
      </div>
    </div>
  );
}