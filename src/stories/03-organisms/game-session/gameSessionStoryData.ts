/**
 * Shared mock data for game session Storybook stories.
 * Provides reusable objects and store-mocking decorators.
 */
import React, { useEffect } from 'react';
import type { SavedSessionInfo } from '@/types/game.types';
import type {
  StoryEnding,
  Decision,
  NarrativeSegment,
} from '@/types/narrative.types';
import type { World } from '@/types/world.types';
import { useWorldStore } from '@/state/worldStore';
import { useCharacterStore } from '@/state/characterStore';
import type { Character } from '@/state/characterStore';
import { useNarrativeStore } from '@/state/narrativeStore';

// ── Constants ────────────────────────────────────────────────────────

export const STORY_WORLD_ID = 'world-storybook';
export const STORY_SESSION_ID = 'session-storybook';
export const STORY_CHARACTER_ID = 'char-storybook';

// ── Mock World ───────────────────────────────────────────────────────

const mockWorld: World = {
  id: STORY_WORLD_ID,
  name: 'The Shattered Isles',
  description: 'A storm-ravaged archipelago where ancient magic stirs beneath volcanic rock.',
  genre: 'fantasy',
  attributes: [
    { id: 'attr-str', worldId: STORY_WORLD_ID, name: 'Strength', description: 'Physical power', baseValue: 10, minValue: 1, maxValue: 20 },
    { id: 'attr-int', worldId: STORY_WORLD_ID, name: 'Intelligence', description: 'Mental acuity', baseValue: 10, minValue: 1, maxValue: 20 },
    { id: 'attr-cha', worldId: STORY_WORLD_ID, name: 'Charisma', description: 'Force of personality', baseValue: 10, minValue: 1, maxValue: 20 },
  ],
  skills: [
    { id: 'skill-sword', worldId: STORY_WORLD_ID, name: 'Swordsmanship', description: 'Blade combat', attributeIds: ['attr-str'], difficulty: 'medium', baseValue: 0, minValue: 0, maxValue: 10 },
    { id: 'skill-lore', worldId: STORY_WORLD_ID, name: 'Arcane Lore', description: 'Knowledge of magic', attributeIds: ['attr-int'], difficulty: 'hard', baseValue: 0, minValue: 0, maxValue: 10 },
    { id: 'skill-persuade', worldId: STORY_WORLD_ID, name: 'Persuasion', description: 'Convincing others', attributeIds: ['attr-cha'], difficulty: 'easy', baseValue: 0, minValue: 0, maxValue: 10 },
  ],
  settings: {
    maxAttributes: 6,
    maxSkills: 8,
    attributePointPool: 30,
    skillPointPool: 10,
  },
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

// ── Mock Character ───────────────────────────────────────────────────

export const mockCharacter: Character = {
  id: STORY_CHARACTER_ID,
  name: 'Kael Stormwright',
  description: 'A wandering swordmage seeking the truth behind the Shattering.',
  worldId: STORY_WORLD_ID,
  level: 5,
  isPlayer: true,
  attributes: [
    { id: 'cattr-1', characterId: STORY_CHARACTER_ID, worldAttributeId: 'attr-str', name: 'Strength', baseValue: 10, modifiedValue: 14 },
    { id: 'cattr-2', characterId: STORY_CHARACTER_ID, worldAttributeId: 'attr-int', name: 'Intelligence', baseValue: 10, modifiedValue: 16 },
    { id: 'cattr-3', characterId: STORY_CHARACTER_ID, worldAttributeId: 'attr-cha', name: 'Charisma', baseValue: 10, modifiedValue: 12 },
  ],
  skills: [
    { id: 'cskill-1', characterId: STORY_CHARACTER_ID, worldSkillId: 'skill-sword', name: 'Swordsmanship', level: 4 },
    { id: 'cskill-2', characterId: STORY_CHARACTER_ID, worldSkillId: 'skill-lore', name: 'Arcane Lore', level: 3 },
    { id: 'cskill-3', characterId: STORY_CHARACTER_ID, worldSkillId: 'skill-persuade', name: 'Persuasion', level: 2 },
  ],
  background: {
    history: 'Born on the outermost isle during a lightning storm, Kael was raised by the keepers of the Old Archive.',
    personality: 'Curious and determined, with a dry sense of humour that surfaces at the worst times.',
    physicalDescription: 'Tall and lean with storm-grey eyes and a scar across the left temple.',
    goals: ['Uncover the cause of the Shattering', 'Master the lost storm magic'],
    fears: ['Losing control of arcane power', 'The sea'],
    relationships: [],
  },
  derivedStats: [
    { id: 'ds-hp', characterId: STORY_CHARACTER_ID, derivedStatId: 'ds-hp', name: 'Hit Points', currentValue: 38, maxValue: 45, lastCalculated: '2025-01-15T00:00:00Z' },
    { id: 'ds-mp', characterId: STORY_CHARACTER_ID, derivedStatId: 'ds-mp', name: 'Mana', currentValue: 22, maxValue: 30, lastCalculated: '2025-01-15T00:00:00Z' },
  ],
  status: {
    conditions: ['Arcane Focus'],
    location: 'Thornhaven Docks',
  },
  portrait: {
    type: 'placeholder',
    url: null,
  },
  inventory: {
    characterId: STORY_CHARACTER_ID,
    items: [],
    capacity: 20,
    categories: [],
    itemOrder: [],
  },
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-15T00:00:00Z',
};

// ── Mock Saved Session ───────────────────────────────────────────────

export const mockSavedSession: SavedSessionInfo = {
  id: STORY_SESSION_ID,
  worldId: STORY_WORLD_ID,
  characterId: STORY_CHARACTER_ID,
  lastPlayed: '2025-06-14T18:30:00Z',
  narrativeCount: 12,
};

// ── Mock Decision ────────────────────────────────────────────────────

export const mockDecision: Decision = {
  id: 'decision-1',
  prompt: 'The harbour-master blocks your path, arms folded. How do you proceed?',
  contextSummary: 'You need to reach the inner docks before the tide turns.',
  decisionWeight: 'major',
  options: [
    { id: 'opt-1', text: 'Draw your blade and demand passage' },
    { id: 'opt-2', text: 'Offer a bribe of 50 silver marks' },
    { id: 'opt-3', text: 'Attempt to talk your way through' },
  ],
};

// ── Mock Story Ending ────────────────────────────────────────────────

export const mockStoryEndingTriumphant: StoryEnding = {
  id: 'ending-1',
  sessionId: STORY_SESSION_ID,
  characterId: STORY_CHARACTER_ID,
  worldId: STORY_WORLD_ID,
  type: 'story-complete',
  tone: 'triumphant',
  epilogue:
    'The storm broke at last. Standing atop the Spire of Winds, Kael raised the restored shard skyward and felt the archipelago shudder as the ancient wards knit themselves whole. The Shattering was undone.',
  characterLegacy:
    'Kael Stormwright became known as the Mender of Isles. Scholars still debate whether it was skill or stubbornness that carried the day, but the keepers of the Old Archive simply say it was both.',
  worldImpact:
    'Trade routes reopened within a season. The outer isles, long cut off by magical storms, sent delegations to Thornhaven for the first time in a generation. The sea was calm again.',
  achievements: [
    'Storm Breaker: Restored the ancient wards',
    'Silver Tongue: Convinced the harbour-master without violence',
    'Lore Keeper: Decoded every archive fragment',
  ],
  playTime: 5400,
  timestamp: new Date('2025-06-14T19:00:00Z'),
  createdAt: '2025-06-14T19:00:00Z',
  updatedAt: '2025-06-14T19:00:00Z',
};

export const mockStoryEndingTragic: StoryEnding = {
  ...mockStoryEndingTriumphant,
  id: 'ending-tragic',
  tone: 'tragic',
  epilogue:
    'The shard cracked in Kael\'s hands. Storm magic poured through the fracture lines, and the Spire groaned as centuries of pressure found their release. The Isles held, but at a cost no-one had foreseen.',
  characterLegacy:
    'They found Kael\'s journal washed ashore three days later. The last entry simply read: "The storm remembers what we forget." The Archive keeps it under glass now.',
  worldImpact:
    'The outer isles were saved, but Thornhaven itself sank beneath the waves. A new capital rose on higher ground, and every year on the anniversary the citizens light lanterns and set them adrift.',
};

// ── Mock Narrative Segments ──────────────────────────────────────────

const mockNarrativeSegments: NarrativeSegment[] = [
  {
    id: 'seg-1',
    sessionId: STORY_SESSION_ID,
    worldId: STORY_WORLD_ID,
    content: 'You arrive at the storm-battered docks of Thornhaven as the last light fades. The harbour-master eyes you with suspicion.',
    type: 'scene',
    characterIds: [STORY_CHARACTER_ID],
    metadata: { tags: ['arrival', 'thornhaven'] },
    timestamp: new Date('2025-06-14T17:00:00Z'),
    createdAt: '2025-06-14T17:00:00Z',
    updatedAt: '2025-06-14T17:00:00Z',
  },
  {
    id: 'seg-2',
    sessionId: STORY_SESSION_ID,
    worldId: STORY_WORLD_ID,
    content: 'You talk your way past the harbour-master with a mention of the Old Archive. His expression shifts from suspicion to grudging respect.',
    type: 'dialogue',
    characterIds: [STORY_CHARACTER_ID],
    metadata: { tags: ['dialogue', 'persuasion'] },
    timestamp: new Date('2025-06-14T17:05:00Z'),
    createdAt: '2025-06-14T17:05:00Z',
    updatedAt: '2025-06-14T17:05:00Z',
  },
];

// ── Store-mocking Decorators ─────────────────────────────────────────

/**
 * Populates the world store with mockWorld for stories that need
 * world attribute/skill lookups (e.g. CharacterSnapshot, CharacterSummary).
 */
export const WithMockWorldStore = (Story: React.FC) => {
  useEffect(() => {
    useWorldStore.setState({
      worlds: { [STORY_WORLD_ID]: mockWorld },
      entities: { [STORY_WORLD_ID]: mockWorld },
    });
    return () => {
      useWorldStore.setState({ worlds: {}, entities: {} });
    };
  }, []);
  return React.createElement(Story);
};

/**
 * Sets up all stores needed by EndingScreen.
 * Accepts a StoryEnding to control the tone variant.
 */
export const withEndingScreenStores = (ending: StoryEnding) => {
  const Decorator = (Story: React.FC) => {
    useEffect(() => {
      useNarrativeStore.setState({
        currentEnding: ending,
        isGeneratingEnding: false,
        endingError: null,
        segments: Object.fromEntries(mockNarrativeSegments.map((s) => [s.id, s])),
        sessionSegments: {
          [STORY_SESSION_ID]: mockNarrativeSegments.map((s) => s.id),
        },
      });
      useCharacterStore.setState({
        characters: { [STORY_CHARACTER_ID]: mockCharacter as never },
        entities: { [STORY_CHARACTER_ID]: mockCharacter as never },
      });
      useWorldStore.setState({
        worlds: { [STORY_WORLD_ID]: mockWorld },
        entities: { [STORY_WORLD_ID]: mockWorld },
      });
      return () => {
        useNarrativeStore.setState({
          currentEnding: null,
          isGeneratingEnding: false,
          endingError: null,
          segments: {},
          sessionSegments: {},
        });
        useCharacterStore.setState({ characters: {}, entities: {} });
        useWorldStore.setState({ worlds: {}, entities: {} });
      };
    }, []);
    return React.createElement(Story);
  };
  return Decorator;
};
