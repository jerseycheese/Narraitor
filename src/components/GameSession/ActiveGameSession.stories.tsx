import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import ActiveGameSession from './ActiveGameSession';
import { World } from '@/types/world.types';
import { NarrativeSegment, Decision } from '@/types/narrative.types';
import { useNarrativeStore } from '@/state/narrativeStore';
import { useSessionStore } from '@/state/sessionStore';
import { useCharacterStore } from '@/state/characterStore';

const meta: Meta<typeof ActiveGameSession> = {
  title: 'Narraitor/GameSession/ActiveGameSession',
  component: ActiveGameSession,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
        # ActiveGameSession
        
        The ActiveGameSession component is the core narrative gameplay component that integrates
        narrative generation, choice selection, and character display. It replaces the older
        GameSessionActive component and provides full narrative engine integration.
        
        ## Key Features
        
        - Real-time narrative generation via NarrativeController
        - Player choice selection with AI-generated options
        - Character integration and summary display
        - Loading states for both narrative and choice generation
        - Error handling with fallback options
        - Session status management (active, paused, ended)
        
        ## Core Stories
        
        - **WithExistingSegments**: Main story showing active gameplay with narrative and choices
        - **LoadingNarrative**: Loading state during narrative generation
        - **ErrorState**: Error handling when narrative generation fails
        - **WithCharacter**: Complete integration with character system
        `,
      },
    },
  },
  argTypes: {
    onChoiceSelected: { action: 'choice selected' },
    onEnd: { action: 'session ended' },
    status: {
      control: 'select',
      options: ['active', 'paused', 'ended'],
    },
  },
  decorators: [
    (Story) => {
      // Reset stores before each story and clear any endings to prevent endscreen display
      useNarrativeStore.setState({
        segments: {},
        sessionSegments: {},
        decisions: {},
        sessionDecisions: {},
        currentEnding: null,
        isGeneratingEnding: false,
        error: null,
        loading: false,
      });
      
      useSessionStore.setState({
        id: 'session-123',
        status: 'active',
        currentSceneId: null,
        playerChoices: [],
        error: null,
        worldId: 'world-123',
        characterId: 'char-123',
        savedSessions: {},
      });
      
      useCharacterStore.setState({
        characters: {},
        currentCharacterId: null,
        error: null,
        loading: false,
      });
      
      return <Story />;
    },
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Helper function to populate narrative store
const populateNarrativeStore = (
  segments: NarrativeSegment[],
  decisions: Decision[] = []
) => {
  const segmentMap: Record<string, NarrativeSegment> = {};
  const sessionSegments: Record<string, string[]> = {};
  const decisionMap: Record<string, Decision> = {};
  const sessionDecisions: Record<string, string[]> = {};
  
  // Process segments
  segments.forEach(seg => {
    segmentMap[seg.id] = seg;
    if (seg.sessionId) {
      if (!sessionSegments[seg.sessionId]) {
        sessionSegments[seg.sessionId] = [];
      }
      sessionSegments[seg.sessionId].push(seg.id);
    }
  });
  
  // Process decisions
  decisions.forEach(dec => {
    decisionMap[dec.id] = dec;
    // Assume decisions belong to session-123 for this story
    if (!sessionDecisions['session-123']) {
      sessionDecisions['session-123'] = [];
    }
    sessionDecisions['session-123'].push(dec.id);
  });
  
  useNarrativeStore.setState({
    segments: segmentMap,
    sessionSegments,
    decisions: decisionMap,
    sessionDecisions,
    error: null,
    loading: false,
  });
};

// Mock data
const mockWorld: World = {
  id: 'world-123',
  name: 'The Realm of Shadows',
  description: 'A dark fantasy world filled with mystery and ancient magic',
  theme: 'Dark Fantasy',
  attributes: [
    {
      id: 'attr-1',
      worldId: 'world-123',
      name: 'Strength',
      description: 'Physical power',
      baseValue: 10,
      minValue: 1,
      maxValue: 20,
      category: 'Physical',
    },
    {
      id: 'attr-2',
      worldId: 'world-123',
      name: 'Intelligence',
      description: 'Mental acuity',
      baseValue: 10,
      minValue: 1,
      maxValue: 20,
      category: 'Mental',
    },
  ],
  skills: [
    {
      id: 'skill-1',
      worldId: 'world-123',
      name: 'Swordsmanship',
      description: 'Mastery of blade weapons',
      linkedAttributeId: 'attr-1',
      difficulty: 'medium',
      baseValue: 5,
      minValue: 1,
      maxValue: 10,
      category: 'Combat',
    },
  ],
  settings: {
    maxAttributes: 6,
    maxSkills: 8,
    attributePointPool: 27,
    skillPointPool: 20,
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Use a type-safe character mock that matches characterStore's internal structure
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockCharacter: any = {
  id: 'char-123',
  name: 'Aria Starweaver',
  worldId: 'world-123',
  level: 5,
  isPlayer: true,
  attributes: [
    {
      id: 'char-attr-1',
      characterId: 'char-123',
      name: 'Strength',
      baseValue: 15,
      modifiedValue: 15,
      category: 'Physical',
    },
    {
      id: 'char-attr-2',
      characterId: 'char-123',
      name: 'Intelligence',
      baseValue: 12,
      modifiedValue: 12,
      category: 'Mental',
    },
  ],
  skills: [
    {
      id: 'char-skill-1',
      characterId: 'char-123',
      name: 'Swordsmanship',
      level: 7,
      category: 'Combat',
    },
  ],
  background: {
    description: 'A seasoned explorer from the Northern Kingdoms.',
    personality: 'Brave and curious, always seeking new adventures.',
    motivation: 'To find ancient artifacts and uncover the world\'s mysteries',
    physicalDescription: 'Tall and lean with weathered features',
  },
  status: {
    hp: 100,
    mp: 50,
    stamina: 75,
  },
  portrait: {
    type: 'ai-generated',
    url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8ZGVmcz4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0iZ3JhZCIgeDI9IjEiIHkyPSIxIj4KICAgICAgPHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iIzY2NjZmZiIvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiM5OTMzZmYiLz4KICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgPC9kZWZzPgogIDxyZWN0IHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4IiBmaWxsPSJ1cmwoI2dyYWQpIi8+CiAgPGNpcmNsZSBjeD0iNjQiIGN5PSI1MCIgcj0iMjAiIGZpbGw9IiNmZmYiIG9wYWNpdHk9IjAuOCIvPgogIDxlbGxpcHNlIGN4PSI2NCIgY3k9IjkwIiByeD0iMjUiIHJ5PSIyMCIgZmlsbD0iI2ZmZiIgb3BhY2l0eT0iMC44Ii8+Cjwvc3ZnPg==',
    generatedAt: new Date().toISOString(),
    prompt: 'A brave warrior with noble bearing',
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockSegments: NarrativeSegment[] = [
  {
    id: 'seg-1',
    content: 'You stand at the entrance to the ancient dungeon. The stone archway looms before you, covered in mysterious runes that seem to pulse with an otherworldly light.',
    type: 'scene',
    sessionId: 'session-123',
    worldId: 'world-123',
    timestamp: new Date(Date.now() - 120000),
    createdAt: new Date(Date.now() - 120000).toISOString(),
    updatedAt: new Date(Date.now() - 120000).toISOString(),
    metadata: {
      location: 'Dungeon Entrance',
      mood: 'mysterious',
      tags: ['entrance', 'dungeon', 'beginning'],
    },
  },
  {
    id: 'seg-2',
    content: 'The air is thick with anticipation as you consider your options. The path ahead is shrouded in darkness, but you can hear the faint echo of dripping water from within.',
    type: 'scene',
    sessionId: 'session-123',
    worldId: 'world-123',
    timestamp: new Date(Date.now() - 60000),
    createdAt: new Date(Date.now() - 60000).toISOString(),
    updatedAt: new Date(Date.now() - 60000).toISOString(),
    metadata: {
      mood: 'tense',
      tags: ['atmosphere', 'anticipation'],
    },
  },
];

const mockDecision: Decision = {
  id: 'decision-1',
  prompt: 'What will you do?',
  options: [
    { id: 'choice-1', text: 'Enter the dungeon', hint: 'Face whatever dangers lie within', alignment: 'chaotic' },
    { id: 'choice-2', text: 'Set up camp', hint: 'Rest and prepare before venturing forth', alignment: 'neutral' },
    { id: 'choice-3', text: 'Return to town', hint: 'Gather more supplies and information', alignment: 'lawful' },
  ],
  decisionWeight: 'minor',
  contextSummary: 'Standing before the ancient dungeon entrance, you must decide your next move.',
};

/**
 * Complete active gameplay with character - shows journal button
 */
export const ActiveGameplay: Story = {
  args: {
    worldId: 'world-123',
    sessionId: 'session-123',
    world: mockWorld,
    status: 'active',
    existingSegments: mockSegments,
    choices: mockDecision.options.map(opt => ({
      id: opt.id,
      text: opt.text,
      isSelected: false,
    })),
  },
  decorators: [
    (Story) => {
      // Set up character and narrative
      useCharacterStore.setState({
        characters: { 'char-123': mockCharacter },
        currentCharacterId: 'char-123',
      });
      useSessionStore.setState({ characterId: 'char-123' });
      populateNarrativeStore(mockSegments, [mockDecision]);
      
      return <Story />;
    },
  ],
};


/**
 * No predefined choices - custom input only
 */
export const NoChoicesAvailable: Story = {
  args: {
    worldId: 'world-123',
    sessionId: 'session-123',
    world: mockWorld,
    status: 'active',
    existingSegments: mockSegments,
    choices: [], // No predefined choices
  },
  decorators: [
    (Story) => {
      // Character assigned - should show journal button and custom input
      useCharacterStore.setState({
        characters: { 'char-123': mockCharacter },
        currentCharacterId: 'char-123',
      });
      useSessionStore.setState({ characterId: 'char-123' });
      populateNarrativeStore(mockSegments, []); // No decisions
      
      return <Story />;
    },
  ],
  parameters: {
    docs: {
      description: {
        story: 'Shows custom input when no predefined choices are available. Players can still type custom responses. Journal button should appear.',
      },
    },
  },
};

/**
 * Major decision with critical choice styling
 */
export const MajorDecision: Story = {
  args: {
    worldId: 'world-123',
    sessionId: 'session-123',
    world: mockWorld,
    status: 'active',
    existingSegments: mockSegments,
  },
  decorators: [
    (Story) => {
      // Set up character and major decision
      useCharacterStore.setState({
        characters: { 'char-123': mockCharacter },
        currentCharacterId: 'char-123',
      });
      useSessionStore.setState({ characterId: 'char-123' });
      
      // Create a major decision to test decision weight styling
      const majorDecision = {
        ...mockDecision,
        decisionWeight: 'major' as const,
        prompt: 'A critical moment has arrived. What will you do?',
        contextSummary: 'The fate of the kingdom hangs in the balance.',
      };
      
      populateNarrativeStore(mockSegments, [majorDecision]);
      
      return <Story />;
    },
  ],
  parameters: {
    docs: {
      description: {
        story: 'Shows a major decision with yellow border styling. Tests decision weight visual indicators.',
      },
    },
  },
};

