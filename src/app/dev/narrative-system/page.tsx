'use client';

import React, { useState, useEffect } from 'react';
import { MockNarrativeController } from './MockNarrativeController';
import { NarrativeHistory } from '@/components/Narrative/NarrativeHistory';
import { narrativeStore } from '@/state/narrativeStore';
import { World, Choice } from '@/types/world.types';
import { NarrativeSegment } from '@/types/narrative.types';

// Mock world for testing
const mockWorld: World = {
  id: 'world-1',
  name: 'Fantasy Realm',
  description: 'A high fantasy world of magic and adventure',
  theme: 'Fantasy',
  attributes: [],
  skills: [],
  settings: {
    maxAttributes: 10,
    maxSkills: 10,
    attributePointPool: 100,
    skillPointPool: 100,
  },
  createdAt: '2023-01-01T10:00:00Z',
  updatedAt: '2023-01-01T10:00:00Z',
};

// Mock choices for testing
const mockChoices: Choice[] = [
  {
    id: 'enter-cave',
    text: 'Enter the cave',
    consequence: 'You step into the darkness...',
    requirements: [],
  },
  {
    id: 'go-around',
    text: 'Go around the mountain',
    consequence: 'You take the longer path...',
    requirements: [],
  },
  {
    id: 'set-up-camp',
    text: 'Set up camp',
    consequence: 'You decide to rest for the night...',
    requirements: [],
  },
];

export default function NarrativeSystemHarness() {
  const [sessionId, setSessionId] = useState('test-session');
  const [triggerGeneration, setTriggerGeneration] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [segments, setSegments] = useState<NarrativeSegment[]>([]);
  const [showController, setShowController] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    // Subscribe to narrative store updates
    const unsubscribe = narrativeStore.subscribe(() => {
      const state = narrativeStore.getState();
      setSegments(state.getSessionSegments(sessionId));
    });
    
    return () => unsubscribe();
  }, [sessionId]);

  const handleGenerateNarrative = () => {
    if (showController) {
      setTriggerGeneration(true);
      // Reset trigger after a short delay
      setTimeout(() => setTriggerGeneration(false), 100);
    } else {
      // Manual generation for history view
      const content = segments.length === 0
        ? 'You find yourself at the entrance of a mysterious cave. The air is cool and damp, and you can hear the distant sound of dripping water echoing from within.'
        : 'The story continues...';
      
      const newSegment: NarrativeSegment = {
        id: `seg-${Date.now()}`,
        content,
        type: 'scene',
        sessionId,
        worldId: mockWorld.id,
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      narrativeStore.getState().addSegment(sessionId, {
        content: newSegment.content,
        type: newSegment.type,
        worldId: newSegment.worldId,
        timestamp: newSegment.timestamp,
        updatedAt: newSegment.updatedAt
      });
    }
  };

  const handleChoiceSelected = (choiceId: string) => {
    if (showController) {
      // In controller mode, just pass the choiceId to the controller
      // The controller will handle the choice processing
      setSelectedChoice(choiceId);
    } else {
      // Manual generation for history view
      const choice = mockChoices.find(c => c.id === choiceId);
      const content = `You chose to ${choice?.text}. ${choice?.consequence}`;
      
      const newSegment: NarrativeSegment = {
        id: `seg-${Date.now()}`,
        content,
        type: 'exploration',
        sessionId,
        worldId: mockWorld.id,
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      narrativeStore.getState().addSegment(sessionId, {
        content: newSegment.content,
        type: newSegment.type,
        worldId: newSegment.worldId,
        timestamp: newSegment.timestamp,
        updatedAt: newSegment.updatedAt
      });
    }
  };

  const handleClearSession = () => {
    // Reset the narrative store
    narrativeStore.getState().reset();
    
    // Clear local state
    setSegments([]);
    setSelectedChoice(null);
    
    // Force a component refresh
    if (showController) {
      // Toggle controller off and on to force a fresh mount
      setShowController(false);
      setTimeout(() => setShowController(true), 50);
    }
    
    console.log('Session cleared');
  };

  const handleNewSession = () => {
    const newSessionId = `session-${Date.now()}`;
    
    // Update session ID
    setSessionId(newSessionId);
    
    // Clear local state
    setSegments([]);
    setSelectedChoice(null);
    
    // Reset trigger to enable initial narrative generation
    setTriggerGeneration(true);
    setTimeout(() => setTriggerGeneration(false), 100);
    
    // Force a component refresh if in controller mode
    if (showController) {
      setShowController(false);
      setTimeout(() => setShowController(true), 50);
    }
    
    console.log(`New session created: ${newSessionId}`);
  };

  if (!isClient) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Narrative System Test Harness</h1>
        <div>Loading test harness...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Narrative System Test Harness</h1>
      
      {/* Control Panel */}
      <div className="mb-6 p-4 bg-gray-100 rounded">
        <h2 className="text-xl font-semibold mb-4">Controls</h2>
        
        <div className="space-y-4">
          <div className="flex gap-2">
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={handleGenerateNarrative}
            >
              Generate Initial Narrative
            </button>
            
            <button
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              onClick={() => setShowController(!showController)}
            >
              {showController ? 'Use Manual History' : 'Use Controller'}
            </button>
            
            <button
              className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
              onClick={handleNewSession}
            >
              New Session
            </button>
            
            <button
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              onClick={handleClearSession}
            >
              Clear Session
            </button>
          </div>
          
          <div>
            <p className="text-sm text-gray-600">
              Session ID: <code className="bg-gray-200 px-2 py-1 rounded">{sessionId}</code>
            </p>
          </div>
        </div>
      </div>

      {/* Narrative Display */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Narrative</h2>
        <div className="border rounded p-4 bg-white min-h-[400px]">
          {showController ? (
            <MockNarrativeController
              worldId={mockWorld.id}
              sessionId={sessionId}
              triggerGeneration={triggerGeneration}
              choiceId={selectedChoice || undefined}
              onNarrativeGenerated={(segment) => {
                console.log('Narrative generated:', segment);
              }}
            />
          ) : (
            <NarrativeHistory
              segments={segments}
              isLoading={false}
            />
          )}
        </div>
      </div>

      {/* Choice Panel */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Player Choices</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {mockChoices.map((choice) => (
            <button
              key={choice.id}
              className="p-4 bg-blue-50 hover:bg-blue-100 rounded border border-blue-300 text-left"
              onClick={() => handleChoiceSelected(choice.id)}
            >
              <div className="font-semibold">{choice.text}</div>
              <div className="text-sm mt-2">{choice.consequence}</div>
            </button>
          ))}
        </div>
      </div>

      {/* State Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h2 className="text-xl font-semibold mb-2">Store State</h2>
          <div className="bg-slate-800 text-slate-100 p-4 rounded overflow-auto font-mono text-xs max-h-[300px]">
            <pre style={{ background: 'transparent' }}>{JSON.stringify(narrativeStore.getState(), null, 2)}</pre>
          </div>
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-2">Current Segments</h2>
          <div className="bg-slate-800 text-slate-100 p-4 rounded overflow-auto font-mono text-xs max-h-[300px]">
            <pre style={{ background: 'transparent' }}>{JSON.stringify(segments, null, 2)}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}