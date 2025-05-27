'use client';

import React, { useState } from 'react';
import { worldStore } from '@/state/worldStore';
import { characterStore } from '@/state/characterStore';
import { generateCharacter, type GeneratedCharacterData } from '@/lib/ai/characterGenerator';

export default function CharacterGenerationTestPage() {
  const [generationType, setGenerationType] = useState<'known' | 'original' | 'specific'>('known');
  const [suggestedName, setSuggestedName] = useState('');
  const [selectedWorldId, setSelectedWorldId] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCharacter, setGeneratedCharacter] = useState<GeneratedCharacterData | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const { worlds } = worldStore();
  const { characters } = characterStore();
  
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
      const existingNames = Object.values(characters)
        .filter(c => c.worldId === selectedWorldId)
        .map(c => c.name);
      
      const result = await generateCharacter(
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
    
    characterStore.getState().createCharacter({
      name: generatedCharacter.name,
      worldId: selectedWorldId,
      level: generatedCharacter.level || 1,
      attributes: generatedCharacter.attributes.map((attr) => {
        const worldAttr = world.attributes.find(wa => wa.id === attr.id);
        return {
          id: `attr-${Date.now()}-${Math.random()}`,
          characterId: '',
          name: worldAttr?.name || 'Unknown',
          baseValue: attr.value,
          modifiedValue: attr.value
        };
      }),
      skills: generatedCharacter.skills.map((skill) => {
        const worldSkill = world.skills.find(ws => ws.id === skill.id);
        return {
          id: `skill-${Date.now()}-${Math.random()}`,
          characterId: '',
          name: worldSkill?.name || 'Unknown',
          level: skill.level
        };
      }),
      background: generatedCharacter.background,
      isPlayer: true,
      status: {
        hp: 100,
        mp: 50,
        stamina: 75
      }
    });
    
    setGeneratedCharacter(null);
    setSuggestedName('');
  };
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Character Generation Test Harness</h1>
      
      <div className="space-y-6">
        {/* World Selection */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Select World</h2>
          <select
            value={selectedWorldId}
            onChange={(e) => setSelectedWorldId(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="">-- Select a World --</option>
            {Object.entries(worlds).map(([id, world]) => (
              <option key={id} value={id}>
                {world.name} ({world.theme})
              </option>
            ))}
          </select>
        </div>
        
        {/* Generation Type */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Generation Type</h2>
          <div className="space-y-3">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                value="known"
                checked={generationType === 'known'}
                onChange={(e) => setGenerationType(e.target.value as typeof generationType)}
              />
              <span>Known Figure (canonical character from source)</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                value="original"
                checked={generationType === 'original'}
                onChange={(e) => setGenerationType(e.target.value as typeof generationType)}
              />
              <span>Original Character (new character fitting the world)</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                value="specific"
                checked={generationType === 'specific'}
                onChange={(e) => setGenerationType(e.target.value as typeof generationType)}
              />
              <span>Specific Character (provide name)</span>
            </label>
          </div>
          
          {generationType === 'specific' && (
            <div className="mt-4">
              <label className="block text-sm font-medium mb-1">Character Name</label>
              <input
                type="text"
                value={suggestedName}
                onChange={(e) => setSuggestedName(e.target.value)}
                placeholder="Enter character name"
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          )}
        </div>
        
        {/* Generate Button */}
        <div className="bg-white rounded-lg shadow p-6">
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !selectedWorldId}
            className="px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? 'Generating...' : 'Generate Character'}
          </button>
        </div>
        
        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}
        
        {/* Generated Character Display */}
        {generatedCharacter && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Generated Character</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">Name:</h3>
                <p>{generatedCharacter.name}</p>
              </div>
              
              <div>
                <h3 className="font-semibold">Level:</h3>
                <p>{generatedCharacter.level || 1}</p>
              </div>
              
              <div>
                <h3 className="font-semibold">Background:</h3>
                <div className="pl-4 space-y-2">
                  <div>
                    <span className="font-medium">Description:</span>
                    <p className="text-gray-700">{generatedCharacter.background.description}</p>
                  </div>
                  <div>
                    <span className="font-medium">Personality:</span>
                    <p className="text-gray-700">{generatedCharacter.background.personality}</p>
                  </div>
                  <div>
                    <span className="font-medium">Motivation:</span>
                    <p className="text-gray-700">{generatedCharacter.background.motivation}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold">Attributes:</h3>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {generatedCharacter.attributes.map((attr) => {
                    const world = worlds[selectedWorldId];
                    const worldAttr = world.attributes.find(wa => wa.id === attr.id);
                    return (
                      <div key={attr.id} className="flex justify-between">
                        <span>{worldAttr?.name}:</span>
                        <span className="font-medium">{attr.value}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold">Skills:</h3>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {generatedCharacter.skills.map((skill) => {
                    const world = worlds[selectedWorldId];
                    const worldSkill = world.skills.find(ws => ws.id === skill.id);
                    return (
                      <div key={skill.id} className="flex justify-between">
                        <span>{worldSkill?.name}:</span>
                        <span className="font-medium">{skill.level}/10</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t">
                <button
                  onClick={handleCreateCharacter}
                  className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Create This Character
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Existing Characters */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Existing Characters in Selected World</h2>
          {selectedWorldId ? (
            <div className="space-y-2">
              {Object.values(characters)
                .filter(c => c.worldId === selectedWorldId)
                .map(character => (
                  <div key={character.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span>{character.name}</span>
                    <span className="text-sm text-gray-500">Level {character.level}</span>
                  </div>
                ))}
              {Object.values(characters).filter(c => c.worldId === selectedWorldId).length === 0 && (
                <p className="text-gray-500">No characters in this world yet</p>
              )}
            </div>
          ) : (
            <p className="text-gray-500">Select a world to see characters</p>
          )}
        </div>
      </div>
    </div>
  );
}