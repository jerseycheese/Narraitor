'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { worldStore } from '@/state/worldStore';
import type { GeneratedWorldData } from '@/lib/generators/worldGenerator';

export default function WorldGenerationTestPage() {
  const [worldReference, setWorldReference] = useState('');
  const [suggestedName, setSuggestedName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedWorld, setGeneratedWorld] = useState<GeneratedWorldData | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const { worlds } = worldStore();
  
  const handleGenerate = async () => {
    if (!worldReference.trim()) {
      setError('Please enter a world reference');
      return;
    }
    
    setIsGenerating(true);
    setError(null);
    setGeneratedWorld(null);
    
    try {
      // Use the world generation API route
      const existingNames = Object.values(worlds).map(w => w.name);
      const response = await fetch('/api/generate-world', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          worldReference: worldReference.trim(),
          existingNames,
          suggestedName: suggestedName.trim() || undefined
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate world');
      }

      const result: GeneratedWorldData = await response.json();
      setGeneratedWorld(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleCreateWorld = async () => {
    if (!generatedWorld) return;
    
    // Create the world
    const worldId = worldStore.getState().createWorld({
      name: generatedWorld.name,
      theme: generatedWorld.theme,
      description: generatedWorld.description,
      attributes: generatedWorld.attributes.map((attr) => ({
        ...attr,
        id: `attr-${Date.now()}-${Math.random()}`,
        worldId: '' // Will be set by the store
      })),
      skills: generatedWorld.skills.map((skill) => ({
        ...skill,
        id: `skill-${Date.now()}-${Math.random()}`,
        worldId: '' // Will be set by the store
      })),
      settings: generatedWorld.settings
    });
    
    // Generate world image
    try {
      const createdWorld = worldStore.getState().worlds[worldId];
      if (createdWorld) {
        const imageResponse = await fetch('/api/generate-world-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            world: createdWorld
          }),
        });

        if (imageResponse.ok) {
          const imageData = await imageResponse.json();
          // Update the world with the generated image
          worldStore.getState().updateWorld(worldId, {
            image: imageData.imageUrl
          });
          console.log(`Generated image for world "${generatedWorld.name}"`);
        }
      }
    } catch (imageError) {
      console.error('Failed to generate world image:', imageError);
      // Continue without image - world creation should still succeed
    }
    
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
    'The Witcher',
    'Ancient Rome',
    'Victorian England',
    'Wild West',
    'Post-Apocalyptic Wasteland',
    'Space Opera',
    'Steampunk',
    'Modern Spy Thriller',
    'Medieval Fantasy',
    'Superhero Universe'
  ];
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <Link 
        href="/dev" 
        className="text-blue-600 hover:text-blue-800 underline"
      >
        ← Back to Dev Harnesses
      </Link>
      <h1 className="text-3xl font-bold mb-6 mt-4">World Generation Test Harness</h1>
      
      <div className="space-y-6">
        {/* World Reference Input */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">World Reference</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Enter a fictional or non-fictional world reference:
              </label>
              <input
                type="text"
                value={worldReference}
                onChange={(e) => setWorldReference(e.target.value)}
                placeholder="e.g., Lord of the Rings, Ancient Rome, Cyberpunk 2077"
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Or choose a preset:</label>
              <div className="grid grid-cols-3 gap-2">
                {presetReferences.map(preset => (
                  <button
                    key={preset}
                    onClick={() => setWorldReference(preset)}
                    className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded border text-left"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Custom Name */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Custom Name (Optional)</h2>
          <div>
            <label className="block text-sm font-medium mb-1">
              Override the AI-generated name:
            </label>
            <input
              type="text"
              value={suggestedName}
              onChange={(e) => setSuggestedName(e.target.value)}
              placeholder="Leave empty to use AI-generated name"
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
        </div>
        
        {/* Generate Button */}
        <div className="bg-white rounded-lg shadow p-6">
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !worldReference.trim()}
            className="px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? 'Generating World...' : 'Generate World'}
          </button>
        </div>
        
        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}
        
        {/* Generated World Display */}
        {generatedWorld && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Generated World</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold">Name:</h3>
                <p>{generatedWorld.name}</p>
              </div>
              
              <div>
                <h3 className="font-semibold">Theme:</h3>
                <p>{generatedWorld.theme}</p>
              </div>
              
              <div>
                <h3 className="font-semibold">Description:</h3>
                <p className="text-gray-700">{generatedWorld.description}</p>
              </div>
              
              <div>
                <h3 className="font-semibold">Attributes ({generatedWorld.attributes.length}):</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  {generatedWorld.attributes.map((attr, index: number) => (
                    <div key={index} className="border rounded p-3">
                      <div className="font-medium">{attr.name}</div>
                      <div className="text-sm text-gray-600 mb-2">{attr.description}</div>
                      <div className="text-sm">
                        Range: {attr.minValue} - {attr.maxValue} (Default: {attr.baseValue})
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold">Skills ({generatedWorld.skills.length}):</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  {generatedWorld.skills.map((skill, index: number) => (
                    <div key={index} className="border rounded p-3">
                      <div className="font-medium">{skill.name}</div>
                      <div className="text-sm text-gray-600 mb-2">{skill.description}</div>
                      <div className="text-sm">
                        <span className={`px-2 py-1 rounded text-xs ${
                          skill.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                          skill.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {skill.difficulty}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold">Settings:</h3>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>Attribute Pool: {generatedWorld.settings.attributePointPool}</div>
                  <div>Skill Pool: {generatedWorld.settings.skillPointPool}</div>
                  <div>Max Attributes: {generatedWorld.settings.maxAttributes}</div>
                  <div>Max Skills: {generatedWorld.settings.maxSkills}</div>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t">
                <button
                  onClick={handleCreateWorld}
                  className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Create This World
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Existing Worlds */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Existing Worlds</h2>
          <div className="space-y-2">
            {Object.values(worlds).map(world => (
              <div key={world.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div>
                  <span className="font-medium">{world.name}</span>
                  <span className="text-sm text-gray-500 ml-2">({world.theme})</span>
                </div>
                <div className="text-sm text-gray-500">
                  {world.attributes.length} attrs, {world.skills.length} skills
                </div>
              </div>
            ))}
            {Object.values(worlds).length === 0 && (
              <p className="text-gray-500">No worlds created yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}