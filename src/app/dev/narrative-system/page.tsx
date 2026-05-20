'use client';

import React, { useState, useEffect } from 'react';
import { MockNarrativeController } from './MockNarrativeController';
import { NarrativeHistory } from '@/components/Narrative/NarrativeHistory';
import { useNarrativeStore } from '@/state/narrativeStore';
import { World } from '@/types/world.types';
// PlayerChoice import removed as it's not needed
import { NarrativeSegment } from '@/types/narrative.types';
import { getTimestamp } from '@/lib/utils';
import Logger from '@/lib/utils/logger';

const logger = new Logger('NarrativeSystemDev');

// Mock world for testing - Western theme to match test plan
const mockWorld: World = {
  id: 'world-1',
  name: 'Frontier Legends',
  description: 'A rugged Western world where outlaws and lawmen battle for control of the frontier',
  genre: 'fantasy',
  attributes: [
    { id: 'attr-1', name: 'Grit', description: 'Mental and physical toughness', worldId: 'world-1', baseValue: 7, minValue: 1, maxValue: 10 },
    { id: 'attr-2', name: 'Marksmanship', description: 'Accuracy with firearms', worldId: 'world-1', baseValue: 8, minValue: 1, maxValue: 10 },
    { id: 'attr-3', name: 'Honor', description: 'Personal code and reputation', worldId: 'world-1', baseValue: 6, minValue: 1, maxValue: 10 }
  ],
  skills: [
    { id: 'skill-1', name: 'Gunslinging', description: 'Quick-draw and shooting skill', worldId: 'world-1', difficulty: 'medium', baseValue: 5, minValue: 1, maxValue: 10, category: 'Combat' },
    { id: 'skill-2', name: 'Tracking', description: 'Following trails and finding targets', worldId: 'world-1', difficulty: 'medium', baseValue: 5, minValue: 1, maxValue: 10, category: 'Outdoors' },
    { id: 'skill-3', name: 'Horsemanship', description: 'Riding and horse care', worldId: 'world-1', difficulty: 'medium', baseValue: 5, minValue: 1, maxValue: 10, category: 'Travel' }
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
    const unsubscribe = useNarrativeStore.subscribe(() => {
      const state = useNarrativeStore.getState();
      setSegments(state.getSessionSegments(sessionId));
    });
    
    return () => unsubscribe();
  }, [sessionId]);

  const handleGenerateNarrative = () => {
    if (showController) {
      logger.debug('Triggering narrative generation via controller');
      setTriggerGeneration(true);
      // Reset trigger after a longer delay to ensure it's processed
      setTimeout(() => {
        setTriggerGeneration(false);
        logger.debug('Reset trigger generation flag');
      }, 500);
    } else {
      logger.debug('Manually generating narrative');
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
        createdAt: getTimestamp(),
        updatedAt: getTimestamp(),
        metadata: {
          tags: ['opening', 'scene'],
          mood: 'mysterious'
        }
      };
      
      useNarrativeStore.getState().addSegment(sessionId, {
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
        createdAt: getTimestamp(),
        updatedAt: getTimestamp(),
        metadata: {
          tags: ['choice', 'player-action'],
          mood: 'mysterious'
        }
      };
      
      useNarrativeStore.getState().addSegment(sessionId, {
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
    useNarrativeStore.getState().reset();
    
    // Clear local state
    setSegments([]);
    setSelectedChoice(null);
    
    // Force a component refresh
    if (showController) {
      // Toggle controller off and on to force a fresh mount
      setShowController(false);
      setTimeout(() => setShowController(true), 50);
    }
    
    logger.debug('Session cleared');
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
    useNarrativeStore.getState().clearSessionSegments(newSessionId);
    
    logger.debug(`New session created and cleared: ${newSessionId}`);
    
    // Force a component refresh if in controller mode - wait a bit longer
    if (showController) {
      setShowController(false);
      
      // Use a slightly longer delay to ensure state is cleared
      setTimeout(() => {
        setShowController(true);
        
        // Set trigger AFTER controller is mounted
        setTimeout(() => {
          logger.debug('Triggering generation for new session');
          setTriggerGeneration(true);
          
          // Reset trigger after a reasonable delay
          setTimeout(() => setTriggerGeneration(false), 500);
        }, 200);
      }, 300);
    } else {
      // For manual mode, no trigger needed
      logger.debug('Ready for manual generation in new session');
    }
  };

  if (!isClient) {
    return (
      <div>
        <h1>Narrative System Test Harness</h1>
        <div>Loading test harness...</div>
      </div>
    );
  }

  return (
    <div>
      <h2>Narrative System Test Harness</h2>
      
      {/* Control Panel */}
      <div>
        <h2>Controls</h2>
        
        <div>
          <div>
            <button
              onClick={handleGenerateNarrative}
            >
              Generate Initial Narrative
            </button>
            
            <button
              onClick={() => setShowController(!showController)}
            >
              {showController ? 'Use Manual History' : 'Use Controller'}
            </button>
            
            <button
              onClick={handleNewSession}
            >
              New Session
            </button>
            
            <button
              onClick={handleClearSession}
            >
              Clear Session
            </button>
          </div>
          
          <div>
            <p>
              Session ID: <code>{sessionId}</code>
            </p>
          </div>
        </div>
      </div>

      {/* Narrative Display */}
      <div>
        <h2>Narrative</h2>
        <div>
          {showController ? (
            <MockNarrativeController
              worldId={mockWorld.id}
              sessionId={sessionId}
              triggerGeneration={triggerGeneration}
              choiceId={selectedChoice || undefined}
              onNarrativeGenerated={(segment) => {
                logger.debug('Narrative generated:', segment);
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
      <div>
        <h2>Player Choices</h2>
        <div>
          {mockChoices.map((choice) => (
            <button
              key={choice.id}
              onClick={() => handleChoiceSelected(choice.id)}
            >
              <div>{choice.text}</div>
              <div>{choice.consequence}</div>
            </button>
          ))}
        </div>
      </div>

      {/* State Display */}
      <div>
        <div>
          <h2>Store State</h2>
          <div>
            <pre>{JSON.stringify(useNarrativeStore.getState(), null, 2)}</pre>
          </div>
        </div>
        
        <div>
          <h2>Current Segments</h2>
          <div>
            <pre>{JSON.stringify(segments, null, 2)}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
