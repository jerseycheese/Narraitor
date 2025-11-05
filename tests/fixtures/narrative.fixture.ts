import type { NarrativeSegment, Decision } from '@/types/narrative.types';

/**
 * Test fixture data for Narrative Segments and Decisions
 * Used in visual regression tests and integration tests
 */

export const SAMPLE_NARRATIVE_SEGMENTS: NarrativeSegment[] = [
  // Comprehensive cyberpunk segments for visual testing
  {
    id: 'segment-cyberpunk-1',
    worldId: 'world-cyberpunk-2077',
    sessionId: 'session-cyberpunk-ghost',
    content:
      'Rain pelts the neon-soaked streets of Neo-Tokyo as you crouch behind a hover-car, fingers dancing across your portable deck. The *Arasaka building* looms ahead, its security algorithms pulsing like a **digital heartbeat**.',
    type: 'scene' as const,
    characterIds: ['char-cyberpunk-hacker'],
    metadata: {
      mood: 'tense',
      location: 'Starting Location',
      tags: ['intro'],
    },
    timestamp: new Date('2024-01-01T02:00:00.000Z'),
    createdAt: '2024-01-01T02:00:00.000Z',
    updatedAt: '2024-01-01T02:00:00.000Z',
  },
  {
    id: 'segment-cyberpunk-2',
    worldId: 'world-cyberpunk-2077',
    sessionId: 'session-cyberpunk-ghost',
    content:
      '"Nice deck," a voice says from the shadows. "*Arasaka custom job, looks like.*" The fixer steps into the dim light, **chrome eyes gleaming**.',
    type: 'dialogue' as const,
    characterIds: ['char-cyberpunk-hacker'],
    metadata: {
      mood: 'mysterious',
      location: 'Neo-Tokyo alley',
      tags: [],
    },
    timestamp: new Date('2024-01-01T02:01:00.000Z'),
    createdAt: '2024-01-01T02:01:00.000Z',
    updatedAt: '2024-01-01T02:01:00.000Z',
  },
  {
    id: 'segment-cyberpunk-3',
    worldId: 'world-cyberpunk-2077',
    sessionId: 'session-cyberpunk-ghost',
    content:
      'You slip through the service entrance, your hacking tools making quick work of the electronic lock. Inside, the building hums with corporate efficiency. Security drones patrol the upper floors in predictable patterns.',
    type: 'action' as const,
    characterIds: ['char-cyberpunk-hacker'],
    metadata: {
      mood: 'action',
      location: 'Arasaka building interior',
      tags: [],
    },
    timestamp: new Date('2024-01-01T02:02:00.000Z'),
    createdAt: '2024-01-01T02:02:00.000Z',
    updatedAt: '2024-01-01T02:02:00.000Z',
  },
  {
    id: 'segment-cyberpunk-4',
    worldId: 'world-cyberpunk-2077',
    sessionId: 'session-cyberpunk-ghost',
    content:
      'Hours pass. The city breathes outside, unaware of the digital heist unfolding in the shadows.',
    type: 'transition' as const,
    characterIds: ['char-cyberpunk-hacker'],
    metadata: {
      mood: 'neutral',
      location: 'Arasaka building',
      tags: [],
    },
    timestamp: new Date('2024-01-01T02:03:00.000Z'),
    createdAt: '2024-01-01T02:03:00.000Z',
    updatedAt: '2024-01-01T02:03:00.000Z',
  },
  {
    id: 'segment-cyberpunk-5',
    worldId: 'world-cyberpunk-2077',
    sessionId: 'session-cyberpunk-ghost',
    content:
      'Elevator shafts and stairwells offer different advantages. The elevator requires a keycard hack but offers direct access. The emergency stairs avoid most sensors but mean a long climb. Your cybernetic legs can handle it, but time is running short.',
    type: 'action' as const,
    characterIds: ['char-cyberpunk-hacker'],
    metadata: {
      mood: 'action',
      location: 'Arasaka building lobby',
      tags: [],
    },
    timestamp: new Date('2024-01-01T02:02:30.000Z'),
    createdAt: '2024-01-01T02:02:30.000Z',
    updatedAt: '2024-01-01T02:02:30.000Z',
  },
  {
    id: 'segment-cyberpunk-6',
    worldId: 'world-cyberpunk-2077',
    sessionId: 'session-cyberpunk-ghost',
    content:
      'Floor 47. The doors slide open to reveal a pristine corridor lined with offices. Security cameras track your every movement, but your scrambler keeps you invisible for now. The executive suite is at the end of the hall.',
    type: 'scene' as const,
    characterIds: ['char-cyberpunk-hacker'],
    metadata: {
      mood: 'tense',
      location: 'Arasaka floor 47',
      tags: [],
    },
    timestamp: new Date('2024-01-01T02:04:00.000Z'),
    createdAt: '2024-01-01T02:04:00.000Z',
    updatedAt: '2024-01-01T02:04:00.000Z',
  },
  {
    id: 'segment-fantasy-1',
    worldId: 'world-fantasy-realm',
    sessionId: 'session-fantasy-mage',
    content:
      'The ancient tower of Silverwind Academy rises before you, its crystal spires catching the first light of dawn. Master Thalorin\'s urgent message echoes in your mind: "The Dragon Codex has been stolen from the forbidden library. Without it, the realm\'s magical balance will collapse within days."',
    type: 'scene' as const,
    characterIds: ['char-fantasy-mage'],
    metadata: {
      mood: 'tense',
      location: 'Silverwind Academy',
      tags: [],
    },
    timestamp: new Date('2024-01-02T02:00:00.000Z'),
    createdAt: '2024-01-02T02:00:00.000Z',
    updatedAt: '2024-01-02T02:00:00.000Z',
  },
];

export const SAMPLE_DECISIONS: Decision[] = [
  {
    id: 'decision-cyberpunk-route',
    prompt: 'How do you want to reach the 47th floor?',
    options: [
      {
        id: 'option-elevator',
        text: 'Take the maintenance elevator - quieter but slower',
        alignment: 'neutral' as const,
        hint: 'Lower risk of detection but takes more time',
        requirements: [
          {
            type: 'skill' as const,
            targetId: 'skill-hacking',
            operator: 'gte',
            value: 10,
          },
        ],
      },
      {
        id: 'option-stairs',
        text: 'Use the emergency stairs - faster but riskier',
        alignment: 'chaotic' as const,
        hint: 'Quick route but higher chance of encountering security',
        requirements: [
          {
            type: 'skill' as const,
            targetId: 'skill-streetwise',
            operator: 'gte',
            value: 8,
          },
        ],
      },
      {
        id: 'option-ventilation',
        text: 'Crawl through the ventilation system - stealthy but difficult',
        alignment: 'lawful' as const,
        hint: 'Requires high tech skill but nearly undetectable',
        requirements: [
          {
            type: 'skill' as const,
            targetId: 'skill-hacking',
            operator: 'gte',
            value: 14,
          },
          {
            type: 'skill' as const,
            targetId: 'skill-streetwise',
            operator: 'gte',
            value: 10,
          },
        ],
      },
    ],
    selectedOptionId: 'option-ventilation',
    selectedAt: new Date('2024-01-01T02:02:00.000Z'),
    characterId: 'char-cyberpunk-hacker',
    contextSummary: 'Infiltrating Arasaka building to steal critical data',
    decisionWeight: 'major' as const,
    narrativeSegmentId: 'segment-cyberpunk-2',
  },
  {
    id: 'decision-fantasy-investigation',
    prompt:
      'Where do you begin your investigation into the stolen Dragon Codex?',
    options: [
      {
        id: 'option-library',
        text: 'Examine the crime scene in the forbidden library',
        alignment: 'lawful' as const,
        hint: 'Look for magical traces and clues left behind',
      },
      {
        id: 'option-witnesses',
        text: 'Question the academy students and staff',
        alignment: 'neutral' as const,
        hint: 'Someone might have seen something suspicious',
      },
      {
        id: 'option-divination',
        text: 'Use divination magic to trace the thief',
        alignment: 'chaotic' as const,
        hint: 'Risky but could provide immediate results',
      },
    ],
    characterId: 'char-fantasy-mage',
    contextSummary: 'Beginning investigation into stolen Dragon Codex',
    decisionWeight: 'critical' as const,
    narrativeSegmentId: 'segment-fantasy-1',
  },
];
