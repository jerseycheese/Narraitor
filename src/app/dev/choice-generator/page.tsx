'use client';

import React, { useState, useEffect } from 'react';
import { NarrativeGenerator } from '@/lib/ai/narrativeGenerator';
import { createDefaultGeminiClient } from '@/lib/ai/defaultGeminiClient';
import { PlayerChoiceSelector } from '@/components/Narrative';
import { Decision, NarrativeContext, NarrativeSegment } from '@/types/narrative.types';
import { generateUniqueId } from '@/lib/utils/generateId';
import { worldStore } from '@/state/worldStore';

// Sample narrative context for testing
const createSampleNarrativeContext = (): NarrativeContext => {
  const createSampleSegment = (content: string, location = 'Forest'): NarrativeSegment => ({
    id: generateUniqueId('segment'),
    content,
    type: 'scene',
    metadata: {
      tags: ['fantasy'],
      location,
    },
    timestamp: new Date(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  return {
    recentSegments: [
      createSampleSegment('You find yourself in a dense forest. The trees tower above you, blocking out most of the sunlight.'),
      createSampleSegment('A strange noise catches your attention from deeper in the woods. Something is moving through the undergrowth.'),
    ],
    currentLocation: 'Forest',
  };
};

// Test harness for choice generator
export default function ChoiceGeneratorTestPage() {
  const [worldId, setWorldId] = useState('test-world');
  const [isGenerating, setIsGenerating] = useState(false);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [narrativeContext, setNarrativeContext] = useState<NarrativeContext>(createSampleNarrativeContext());
  const [worldName, setWorldName] = useState('Fantasy World');
  const [worldDescription, setWorldDescription] = useState('A world of magic and adventure');
  const [worldTheme, setWorldTheme] = useState('fantasy');
  
  // Initialize a test world in the store if it doesn't exist
  useEffect(() => {
    // Check if the test world already exists
    const worldExists = worldStore.getState().worlds[worldId];
    
    if (!worldExists) {
      try {
        // Create a test world
        const newWorldId = worldStore.getState().createWorld({
          name: worldName,
          description: worldDescription,
          theme: worldTheme,
          attributes: [],
          skills: [],
          settings: {
            maxAttributes: 10,
            maxSkills: 10,
            attributePointPool: 100,
            skillPointPool: 100
          }
        });
        
        // Update the state with the new world ID
        setWorldId(newWorldId);
      } catch (error) {
        console.error('Error creating test world:', error);
        setError('Failed to create test world');
      }
    }
  }, [worldId, worldName, worldDescription, worldTheme]);

  const generateChoices = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      // Update world properties if they've changed
      const currentWorld = worldStore.getState().worlds[worldId];
      if (currentWorld && (
        currentWorld.name !== worldName ||
        currentWorld.description !== worldDescription ||
        currentWorld.theme !== worldTheme
      )) {
        worldStore.getState().updateWorld(worldId, {
          name: worldName,
          description: worldDescription,
          theme: worldTheme
        });
      }
      
      // Generate choices using the narrative generator
      const narrativeGenerator = new NarrativeGenerator(createDefaultGeminiClient());
      const generatedDecision = await narrativeGenerator.generatePlayerChoices(
        worldId,
        narrativeContext,
        []
      );

      setDecision(generatedDecision);
    } catch (error) {
      console.error('Error generating choices:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleChoiceSelected = (optionId: string) => {
    if (decision) {
      setDecision({
        ...decision,
        selectedOptionId: optionId,
      });
    }
  };

  // Update narrative context when segments change
  const handleSegmentContentChange = (index: number, content: string) => {
    setNarrativeContext(prev => {
      const updatedSegments = [...prev.recentSegments];
      updatedSegments[index] = {
        ...updatedSegments[index],
        content,
      };
      return {
        ...prev,
        recentSegments: updatedSegments,
      };
    });
  };

  // Add a new segment to the narrative context
  const addSegment = () => {
    const newSegment: NarrativeSegment = {
      id: generateUniqueId('segment'),
      content: '',
      type: 'scene',
      metadata: {
        tags: [worldTheme],
        location: narrativeContext.currentLocation || 'Unknown',
      },
      timestamp: new Date(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setNarrativeContext(prev => ({
      ...prev,
      recentSegments: [...prev.recentSegments, newSegment],
    }));
  };

  // Remove a segment from the narrative context
  const removeSegment = (index: number) => {
    if (narrativeContext.recentSegments.length <= 1) {
      return; // Prevent removing all segments
    }

    setNarrativeContext(prev => ({
      ...prev,
      recentSegments: prev.recentSegments.filter((_, i) => i !== index),
    }));
  };

  // Update the current location
  const handleLocationChange = (location: string) => {
    setNarrativeContext(prev => ({
      ...prev,
      currentLocation: location,
    }));
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Choice Generator Test Harness</h1>
      
      <div className="mb-8 p-4 bg-gray-100 rounded">
        <h2 className="text-xl font-bold mb-2">World Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block mb-1">World Name:</label>
            <input
              type="text"
              value={worldName}
              onChange={(e) => setWorldName(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block mb-1">World Theme/Genre:</label>
            <select
              value={worldTheme}
              onChange={(e) => setWorldTheme(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="fantasy">Fantasy</option>
              <option value="sci-fi">Science Fiction</option>
              <option value="horror">Horror</option>
              <option value="western">Western</option>
              <option value="cyberpunk">Cyberpunk</option>
            </select>
          </div>
          <div>
            <label className="block mb-1">Current Location:</label>
            <input
              type="text"
              value={narrativeContext.currentLocation || ''}
              onChange={(e) => handleLocationChange(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>
        <div className="mb-4">
          <label className="block mb-1">World Description:</label>
          <textarea
            value={worldDescription}
            onChange={(e) => setWorldDescription(e.target.value)}
            className="w-full p-2 border rounded h-20"
          />
        </div>
      </div>

      <div className="mb-8 p-4 bg-gray-100 rounded">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-bold">Narrative Segments</h2>
          <button
            onClick={addSegment}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Add Segment
          </button>
        </div>

        {narrativeContext.recentSegments.map((segment, index) => (
          <div key={segment.id} className="mb-4 p-4 border rounded bg-white">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold">Segment {index + 1}</h3>
              <button
                onClick={() => removeSegment(index)}
                className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                disabled={narrativeContext.recentSegments.length <= 1}
              >
                Remove
              </button>
            </div>
            <textarea
              value={segment.content}
              onChange={(e) => handleSegmentContentChange(index, e.target.value)}
              className="w-full p-2 border rounded h-20"
            />
          </div>
        ))}
      </div>

      <div className="mb-8">
        <button
          onClick={generateChoices}
          disabled={isGenerating}
          className="px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 w-full"
        >
          {isGenerating ? 'Generating Choices...' : 'Generate Player Choices'}
        </button>
      </div>

      {error && (
        <div className="mb-8 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <h2 className="font-bold mb-2">Error</h2>
          <p>{error}</p>
        </div>
      )}

      {decision && (
        <div className="mb-8 p-4 bg-gray-100 rounded">
          <h2 className="text-xl font-bold mb-4">Generated Decision</h2>
          
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Decision Object:</h3>
            <pre className="bg-black text-green-400 p-4 rounded overflow-x-auto">
              {JSON.stringify(decision, null, 2)}
            </pre>
          </div>
          
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Player Choice UI:</h3>
            <div className="bg-white p-4 rounded border">
              <PlayerChoiceSelector
                decision={decision}
                onSelect={handleChoiceSelected}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}