import type { Meta, StoryObj } from '@storybook/react';
import ActiveGameSession from './ActiveGameSession';
import { World } from '@/types/world.types';
import { NarrativeSegment, Decision } from '@/types/narrative.types';
import { narrativeStore } from '@/state/narrativeStore';
import { sessionStore } from '@/state/sessionStore';
import { characterStore } from '@/state/characterStore';

const meta: Meta<typeof ActiveGameSession> = {
  title: 'Narraitor/GameSession/ActiveGameSession',
  component: ActiveGameSession,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
        # ActiveGameSession
        
        The ActiveGameSession component manages the complete narrative gameplay experience,
        integrating narrative generation, choice selection, and character display.
        
        ## Features
        
        - Automatic narrative generation on mount
        - Player choice selection and response
        - Character summary display
        - Loading states for narrative and choices
        - Error handling and fallback choices
        - Session status management (active, paused, ended)
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
      // Reset stores before each story
      narrativeStore.setState({
        segments: {},
        decisions: {},
        error: null,
        loading: false,
      });
      
      sessionStore.setState({
        id: null,
        status: 'initializing',
        currentSceneId: null,
        playerChoices: [],
        error: null,
        worldId: null,
        characterId: null,
        savedSessions: {},
      });
      
      characterStore.setState({
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
  
  narrativeStore.setState({
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
    type: 'placeholder',
    url: null,
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
    { id: 'choice-1', text: 'Enter the dungeon', hint: 'Face whatever dangers lie within' },
    { id: 'choice-2', text: 'Set up camp', hint: 'Rest and prepare before venturing forth' },
    { id: 'choice-3', text: 'Return to town', hint: 'Gather more supplies and information' },
  ],
};

/**
 * Default state showing initial narrative generation
 */
export const Default: Story = {
  args: {
    worldId: 'world-123',
    sessionId: 'session-123',
    world: mockWorld,
    status: 'active',
    triggerGeneration: true,
  },
  decorators: [
    (Story) => {
      // Set up minimal state for initial generation
      return (
        <div data-testid="active-game-session">
          <Story />
        </div>
      );
    },
  ],
};

/**
 * Component with pre-populated narrative segments
 */
export const WithExistingSegments: Story = {
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
      // Pre-populate narrative store
      populateNarrativeStore(mockSegments, [mockDecision]);
      
      return <Story />;
    },
  ],
};

/**
 * Loading state while generating narrative
 */
export const LoadingNarrative: Story = {
  args: {
    worldId: 'world-123',
    sessionId: 'session-123',
    world: mockWorld,
    status: 'active',
  },
  decorators: [
    (Story) => {
      // Set loading state in narrative store
      narrativeStore.setState({
        loading: true,
      });
      
      return (
        <div>
          <p className="text-sm text-gray-600 mb-4">Generating narrative...</p>
          <Story />
        </div>
      );
    },
  ],
};

/**
 * Loading state while generating choices
 */
export const LoadingChoices: Story = {
  args: {
    worldId: 'world-123',
    sessionId: 'session-123',
    world: mockWorld,
    status: 'active',
    existingSegments: mockSegments,
  },
  decorators: [
    (Story) => {
      // Pre-populate narrative but no decisions yet
      populateNarrativeStore(mockSegments, []);
      
      return (
        <div>
          <p className="text-sm text-gray-600 mb-4">Generating choices...</p>
          <Story />
        </div>
      );
    },
  ],
};

/**
 * Error state for narrative generation failure
 */
export const ErrorState: Story = {
  args: {
    worldId: 'world-123',
    sessionId: 'session-123',
    world: mockWorld,
    status: 'active',
  },
  decorators: [
    (Story) => {
      // Set error state
      narrativeStore.setState({
        ...narrativeStore.getState(),
        error: 'Failed to generate narrative: API request timeout',
      });
      
      return (
        <div>
          <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
            <p className="text-red-800">Failed to generate narrative. Please try again.</p>
          </div>
          <Story />
        </div>
      );
    },
  ],
};

/**
 * Component with a selected character
 */
export const WithCharacter: Story = {
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
      // Set up character in stores
      // Set up character in store
      characterStore.getState().characters['char-123'] = mockCharacter;
      characterStore.getState().currentCharacterId = 'char-123';
      
      sessionStore.setState({
        characterId: 'char-123',
      });
      
      populateNarrativeStore(mockSegments, [mockDecision]);
      
      return <Story />;
    },
  ],
};

/**
 * Component without a selected character
 */
export const WithoutCharacter: Story = {
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
      // Ensure no character is selected
      characterStore.setState({
        characters: {},
        currentCharacterId: null,
      });
      
      sessionStore.setState({
        characterId: null,
      });
      
      populateNarrativeStore(mockSegments, [mockDecision]);
      
      return (
        <div>
          <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-4">
            <p className="text-yellow-800">No character selected for this session.</p>
          </div>
          <Story />
        </div>
      );
    },
  ],
};

/**
 * Paused game session
 */
export const PausedState: Story = {
  args: {
    worldId: 'world-123',
    sessionId: 'session-123',
    world: mockWorld,
    status: 'paused',
    existingSegments: mockSegments,
    choices: mockDecision.options.map(opt => ({
      id: opt.id,
      text: opt.text,
      isSelected: false,
    })),
  },
  decorators: [
    (Story) => {
      populateNarrativeStore(mockSegments, [mockDecision]);
      
      return (
        <div>
          <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-4">
            <p className="text-blue-800 font-semibold">Session Paused</p>
            <p className="text-blue-600 text-sm">Your progress has been saved.</p>
          </div>
          <Story />
        </div>
      );
    },
  ],
};

/**
 * Ended game session
 */
export const EndedState: Story = {
  args: {
    worldId: 'world-123',
    sessionId: 'session-123',
    world: mockWorld,
    status: 'ended',
    existingSegments: mockSegments,
  },
  decorators: [
    (Story) => {
      populateNarrativeStore(mockSegments, [mockDecision]);
      
      return (
        <div>
          <div className="bg-gray-100 border border-gray-300 rounded p-4 mb-4">
            <p className="text-gray-800 font-semibold">Session Ended</p>
            <p className="text-gray-600 text-sm">Thank you for playing!</p>
          </div>
          <Story />
        </div>
      );
    },
  ],
};

/**
 * Interactive demo showing choice selection flow
 */
export const InteractiveDemo: Story = {
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
      // Set up full interactive state
      // Set up character in store
      characterStore.getState().characters['char-123'] = mockCharacter;
      characterStore.getState().currentCharacterId = 'char-123';
      
      sessionStore.setState({
        characterId: 'char-123',
      });
      
      populateNarrativeStore(mockSegments, [mockDecision]);
      
      return (
        <div>
          <div className="bg-green-50 border border-green-200 rounded p-4 mb-4">
            <p className="text-green-800 font-semibold">Interactive Demo</p>
            <p className="text-green-600 text-sm">Click on choices to see the interaction flow.</p>
          </div>
          <Story />
        </div>
      );
    },
  ],
};