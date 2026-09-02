import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import ActiveGameSession from '@/components/GameSession/ActiveGameSession';
import { World } from '@/types/world.types';
import { NarrativeSegment, Decision } from '@/types/narrative.types';
import { useNarrativeStore } from '@/state/narrativeStore';
import { useSessionStore } from '@/state/sessionStore';
import { useCharacterStore } from '@/state/characterStore';
import { ToastProvider } from '@/components/ui/toast';
import { getTimestamp } from '@/lib/utils';
import { withStores } from '../../../../.storybook/decorators/withStores';

const meta: Meta<typeof ActiveGameSession> = {
  title: '05-Pages/game-session/ActiveGameSession',
  component: ActiveGameSession,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `The main gameplay surface. Renders the narrative, the player's choices, and the character summary, driving generation through NarrativeController. Handles loading and error states for both narrative and choice generation, and reflects session status (active, paused, ended).`,
      },
    },
  },
  argTypes: {
    onChoiceSelected: { action: 'choice selected' },
    status: {
      control: 'select',
      options: ['active', 'paused', 'ended'],
    },
  },
  decorators: [
    // ActiveGameSession's useAutoSave calls useToast, so every story needs a ToastProvider ancestor.
    (Story) => <ToastProvider><Story /></ToastProvider>,
    // Reset stores to a clean active-session baseline before each story (clears
    // any ending so the endscreen doesn't show). Per-story decorators layer
    // character/narrative data on top. Dogfoods the shared withStores helper.
    withStores({
      narrative: {
        segments: {},
        sessionSegments: {},
        decisions: {},
        sessionDecisions: {},
        currentEnding: null,
        isGeneratingEnding: false,
        error: null,
        loading: false,
      },
      session: {
        id: 'session-123',
        status: 'active',
        currentSceneId: null,
        playerChoices: [],
        error: null,
        worldId: 'world-123',
        characterId: 'char-123',
        savedSessions: {},
      },
      character: {
        characters: {},
        entities: {},
        currentCharacterId: null,
        currentEntityId: null,
        error: null,
        loading: false,
      },
    }),
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
  genre: 'fantasy',
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
      attributeIds: ['attr-1'],
      difficulty: 'medium',
      baseValue: 5,
      minValue: 1,
      maxValue: 10,
    },
  ],
  settings: {
    maxAttributes: 6,
    maxSkills: 8,
    attributePointPool: 27,
    skillPointPool: 20,
  },
  createdAt: getTimestamp(),
  updatedAt: getTimestamp(),
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
    url: 'https://i.pravatar.cc/200?img=1',
    generatedAt: getTimestamp(),
    prompt: 'A brave warrior with noble bearing',
  },
  createdAt: getTimestamp(),
  updatedAt: getTimestamp(),
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
        entities: { 'char-123': mockCharacter },
        currentCharacterId: 'char-123',
        currentEntityId: 'char-123',
        error: null,
        loading: false,
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
        entities: { 'char-123': mockCharacter },
        currentCharacterId: 'char-123',
        currentEntityId: 'char-123',
        error: null,
        loading: false,
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
        entities: { 'char-123': mockCharacter },
        currentCharacterId: 'char-123',
        currentEntityId: 'char-123',
        error: null,
        loading: false,
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
        story: 'Shows a major decision with yellow styling. Tests decision weight visual indicators.',
      },
    },
  },
};

/**
 * Loading state showing the manuscript skeleton
 */
export const LoadingState: Story = {
  args: {
    worldId: 'world-123',
    sessionId: 'session-123',
    world: mockWorld,
    status: 'active',
  },
  decorators: [
    (Story) => {
      // Clear segments to trigger skeleton
      useNarrativeStore.setState({
        segments: {},
        sessionSegments: {},
        decisions: {},
        sessionDecisions: {},
        currentEnding: null,
        loading: true,
      });
      
      return <Story />;
    },
  ],
  parameters: {
    docs: {
      description: {
        story: 'Shows the initial loading state with the manuscript skeleton while waiting for the first narrative segment.',
      },
    },
  },
};

/**
 * Full manuscript overlay layout with progressive disclosure
 */
export const ManuscriptOverlay: Story = {
  args: {
    ...ActiveGameplay.args,
  },
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => {
      // Set up character and narrative
      useCharacterStore.setState({
        characters: { 'char-123': mockCharacter },
        entities: { 'char-123': mockCharacter },
        currentCharacterId: 'char-123',
        currentEntityId: 'char-123',
        error: null,
        loading: false,
      });
      useSessionStore.setState({ characterId: 'char-123' });
      populateNarrativeStore(mockSegments, [mockDecision]);
      
      // Note: Feature flags might need to be mocked globally or via decorator if possible
      // But since we use isFeatureEnabled, we might need to mock it in the story file
      
      return <Story />;
    },
  ],
};
