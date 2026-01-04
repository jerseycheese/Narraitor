import { JournalEntry } from '@/types/journal.types';

export const journalSessionId = 'session-storybook';
export const journalWorldId = 'world-storybook';
export const journalCharacterId = 'char-storybook';

export const mockEntries: JournalEntry[] = [
  {
    id: 'entry-1',
    sessionId: journalSessionId,
    worldId: journalWorldId,
    characterId: journalCharacterId,
    type: 'session_start',
    title: '',
    content: 'The adventure begins as the party gathers in the tavern.',
    significance: 'minor',
    isRead: true,
    relatedEntities: [],
    metadata: {
      tags: ['session'],
      automaticEntry: true,
    },
    createdAt: '2024-01-01T09:00:00Z',
    updatedAt: '2024-01-01T09:00:00Z',
  },
  {
    id: 'entry-2',
    sessionId: journalSessionId,
    worldId: journalWorldId,
    characterId: journalCharacterId,
    type: 'discovery',
    title: 'Hidden Passage',
    content: 'Discovered a concealed entrance behind the waterfall.',
    detailedContent:
      'Behind the waterfall lies an ancient doorway etched with runes. The air feels colder, and the sound of dripping water echoes in the dark.',
    significance: 'major',
    isRead: false,
    relatedEntities: [
      { type: 'location', id: 'waterfall', name: 'Crystal Waterfall' },
      { type: 'location', id: 'passage', name: 'Hidden Passage' },
    ],
    metadata: {
      tags: ['exploration', 'secret', 'mountain'],
      automaticEntry: true,
    },
    createdAt: '2024-01-01T11:30:00Z',
    updatedAt: '2024-01-01T11:30:00Z',
  },
  {
    id: 'entry-3',
    sessionId: journalSessionId,
    worldId: journalWorldId,
    characterId: journalCharacterId,
    type: 'decision',
    title: 'Help the Stranger',
    content: 'Chose to help the stranger with a suspicious request.',
    detailedContent:
      'A cloaked figure asked for directions to the library. Despite misgivings, the party offered guidance and gained a mysterious ally.',
    significance: 'critical',
    isRead: false,
    relatedEntities: [
      { type: 'character', id: 'stranger', name: 'Cloaked Stranger' },
    ],
    metadata: {
      tags: ['decision', 'stranger'],
      automaticEntry: true,
      decisionId: 'decision-help-stranger',
    },
    createdAt: '2024-01-01T13:15:00Z',
    updatedAt: '2024-01-01T13:15:00Z',
  },
  {
    id: 'entry-4',
    sessionId: journalSessionId,
    worldId: journalWorldId,
    characterId: journalCharacterId,
    type: 'session_end',
    title: '',
    content: 'The session ends with the party setting camp under a starry sky.',
    significance: 'minor',
    isRead: true,
    relatedEntities: [],
    metadata: {
      tags: ['session'],
      automaticEntry: true,
      sessionDuration: 5400000,
    },
    createdAt: '2024-01-01T15:00:00Z',
    updatedAt: '2024-01-01T15:00:00Z',
  },
];
