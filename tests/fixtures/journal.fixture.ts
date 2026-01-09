import type { JournalEntry } from '@/types/journal.types';

/**
 * Test fixture data for Journal Entries
 * Used in visual regression tests and integration tests
 */

export const SAMPLE_JOURNAL_ENTRIES: JournalEntry[] = [
  {
    id: 'entry-cyberpunk-session-start',
    sessionId: 'session-cyberpunk-ghost',
    worldId: 'world-cyberpunk-2077',
    characterId: 'char-cyberpunk-hacker',
    type: 'session_start',
    title: 'Session Start',
    content: 'Nova slips into the neon grid, preparing for the Arasaka breach.',
    significance: 'minor',
    isRead: true,
    relatedEntities: [],
    metadata: {
      tags: ['session'],
      automaticEntry: true,
      sessionStartTime: '2024-01-01T02:00:00.000Z',
      sessionContext: {
        worldName: 'Neo-Tokyo',
        characterName: 'Nova "Ghost" Chen',
        sessionNumber: 1,
      },
    },
    createdAt: '2024-01-01T02:00:30.000Z',
    updatedAt: '2024-01-01T02:00:30.000Z',
  },
  {
    id: 'entry-cyberpunk-decision',
    sessionId: 'session-cyberpunk-ghost',
    worldId: 'world-cyberpunk-2077',
    characterId: 'char-cyberpunk-hacker',
    type: 'decision',
    title: 'Decision',
    content: 'Chose the ventilation route to avoid the main lobby scanners.',
    detailedContent:
      'Nova reroutes power to the ventilation shafts, trusting stealth over speed. The detour buys time and keeps Arasaka\'s lobby scanners blind.',
    significance: 'major',
    isRead: false,
    relatedEntities: [
      {
        type: 'location',
        id: 'location-arasaka-tower',
        name: 'Arasaka Tower',
      },
    ],
    metadata: {
      tags: ['decision', 'stealth'],
      automaticEntry: false,
      decisionId: 'decision-cyberpunk-route',
      decisionPrompt: 'How do you want to reach the 47th floor?',
      choiceText: 'Crawl through the ventilation system - stealthy but difficult',
    },
    createdAt: '2024-01-01T02:02:10.000Z',
    updatedAt: '2024-01-01T02:02:10.000Z',
  },
  {
    id: 'entry-cyberpunk-discovery',
    sessionId: 'session-cyberpunk-ghost',
    worldId: 'world-cyberpunk-2077',
    characterId: 'char-cyberpunk-hacker',
    type: 'discovery',
    title: 'Discovery',
    content: 'Found a hidden relay broadcasting Arasaka executive calls.',
    detailedContent:
      'A concealed relay node pulses beneath the floor panel, routing encrypted executive calls. The signal pattern suggests a private line to the board.',
    significance: 'major',
    isRead: false,
    relatedEntities: [
      {
        type: 'item',
        id: 'item-relay-node',
        name: 'Signal Relay Node',
      },
    ],
    metadata: {
      tags: ['intel', 'arasaka'],
      automaticEntry: false,
    },
    createdAt: '2024-01-01T02:03:20.000Z',
    updatedAt: '2024-01-01T02:03:20.000Z',
  },
  {
    id: 'entry-cyberpunk-world-event',
    sessionId: 'session-cyberpunk-ghost',
    worldId: 'world-cyberpunk-2077',
    characterId: 'char-cyberpunk-hacker',
    type: 'world_event',
    title: 'World Event',
    content: 'Security drones sweep the corridor as alarms spike.',
    detailedContent:
      'Alarms crackle to life as a wave of security drones sweeps the executive corridor. The neon haze outside flickers with emergency broadcasts.',
    significance: 'critical',
    isRead: true,
    relatedEntities: [
      {
        type: 'event',
        id: 'event-alarm-surge',
        name: 'Alarm Surge',
      },
    ],
    metadata: {
      tags: ['security', 'alarms'],
      automaticEntry: true,
      narrativeSegmentId: 'segment-cyberpunk-4',
    },
    createdAt: '2024-01-01T02:04:10.000Z',
    updatedAt: '2024-01-01T02:04:10.000Z',
  },
];
