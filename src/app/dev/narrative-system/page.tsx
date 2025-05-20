'use client';

import React, { useState, useEffect } from 'react';
import { MockNarrativeController } from './MockNarrativeController';
import { NarrativeHistory } from '@/components/Narrative/NarrativeHistory';
import { narrativeStore } from '@/state/narrativeStore';
import { World } from '@/types/world.types';
// PlayerChoice import removed as it's not needed
import { NarrativeSegment } from '@/types/narrative.types';

// Mock world for testing - Western theme to match test plan
const mockWorld: World = {
  id: 'world-1',
  name: 'Frontier Legends',
  description: 'A rugged Western world where outlaws and lawmen battle for control of the frontier',
  theme: 'Western',
  attributes: [
    { id: 'attr-1', name: 'Grit', description: 'Mental and physical toughness', worldId: 'world-1', baseValue: 7, minValue: 1, maxValue: 10 },
    { id: 'attr-2', name: 'Marksmanship', description: 'Accuracy with firearms', worldId: 'world-1', baseValue: 8, minValue: 1, maxValue: 10 },
    { id: 'attr-3', name: 'Honor', description: 'Personal code and reputation', worldId: 'world-1', baseValue: 6, minValue: 1, maxValue: 10 }
  ],
  skills: [
    { id: 'skill-1', name: 'Gunslinging', description: 'Quick-draw and shooting skill', worldId: 'world-1', difficulty: 'medium' },
    { id: 'skill-2', name: 'Tracking', description: 'Following trails and finding targets', worldId: 'world-1', difficulty: 'medium' },
    { id: 'skill-3', name: 'Horsemanship', description: 'Riding and horse care', worldId: 'world-1', difficulty: 'medium' }
  ],
  settings: {
    maxAttributes: 10,
    maxSkills: 10,
    attributePointPool: 100,
    skillPointPool: 100,
  },
  createdAt: '2023-01-01T10:00:00Z',
  updatedAt: '2023-01-01T10:00:00Z',
};

// Mock choices for testing - Western-themed
const mockChoices = [
  {
    id: 'enter-saloon',
    text: 'Enter the saloon',
    consequence: 'You push through the swinging doors...',
    requirements: [],
  },
  {
    id: 'visit-sheriff',
    text: 'Visit the sheriff\'s office',
    consequence: 'You head toward the law office...',
    requirements: [],
  },
  {
    id: 'check-stables',
    text: 'Check the stables',
    consequence: 'You decide to look after your horse...',
    requirements: [],
  },
];

export default function NarrativeSystemHarness() {
  const [sessionId, setSessionId] = useState('test-session');
  const [triggerGeneration, setTriggerGeneration] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [segments, setSegments] = useState<NarrativeSegment[]>([]);
  const [showController, setShowController] = useState(true); // Default to controller mode
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
      console.log('Triggering narrative generation via controller');
      setTriggerGeneration(true);
      // Reset trigger after a longer delay to ensure it's processed
      setTimeout(() => {
        setTriggerGeneration(false);
        console.log('Reset trigger generation flag');
      }, 500);
    } else {
      console.log('Manually generating narrative');
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
        timestamp: new Date(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {
          tags: ['opening', 'scene'],
          mood: 'mysterious'
        }
      };
      
      narrativeStore.getState().addSegment(sessionId, {
        content: newSegment.content,
        type: newSegment.type,
        worldId: newSegment.worldId,
        timestamp: new Date(), // Ensure we're using a Date object
        updatedAt: newSegment.updatedAt,
        metadata: newSegment.metadata
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
        type: 'action', // Changed from 'exploration' to match valid types
        sessionId,
        worldId: mockWorld.id,
        timestamp: new Date(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {
          tags: ['choice', 'player-action'],
          mood: 'mysterious'
        }
      };
      
      narrativeStore.getState().addSegment(sessionId, {
        content: newSegment.content,
        type: newSegment.type,
        worldId: newSegment.worldId,
        timestamp: new Date(), // Ensure we're using a Date object
        updatedAt: newSegment.updatedAt,
        metadata: newSegment.metadata
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
    
    // Clear any existing segments for the new session ID
    // to prevent duplications
    narrativeStore.getState().clearSessionSegments(newSessionId);
    
    console.log(`New session created and cleared: ${newSessionId}`);
    
    // Force a component refresh if in controller mode - wait a bit longer
    if (showController) {
      setShowController(false);
      
      // Use a slightly longer delay to ensure state is cleared
      setTimeout(() => {
        setShowController(true);
        
        // Set trigger AFTER controller is mounted
        setTimeout(() => {
          console.log('Triggering generation for new session');
          setTriggerGeneration(true);
          
          // Reset trigger after a reasonable delay
          setTimeout(() => setTriggerGeneration(false), 500);
        }, 200);
      }, 300);
    } else {
      // For manual mode, no trigger needed
      console.log('Ready for manual generation in new session');
    }
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