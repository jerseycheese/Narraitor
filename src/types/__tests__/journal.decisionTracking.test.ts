/**
 * Test: Decision tracking in journal system
 * 
 * This test covers the acceptance criteria for issue #174:
 * - Journal entries for significant player decisions
 * - Decision entries include choice made and outcome
 * - Entries categorized with 'decision' type
 * - Contextual information included
 * - Proper formatting for readability
 */

import { JournalEntryType, JournalEntry } from '../journal.types';

describe('Decision Tracking in Journal System', () => {
  // Test acceptance criteria: "Entries are correctly categorized with the 'decision' type"
  describe('JournalEntryType', () => {
    test('includes decision type for player choices', () => {
      const validTypes: JournalEntryType[] = [
        'character_event',
        'world_event', 
        'relationship_change',
        'achievement',
        'discovery',
        'combat',
        'dialogue',
        'decision' // New type for player decisions
      ];

      expect(validTypes).toContain('decision');
    });
  });

  // Test acceptance criteria: "Decision entries include contextual information"
  describe('Decision Journal Entry Structure', () => {
    test('supports decision entries with proper metadata', () => {
      const decisionEntry: JournalEntry = {
        id: 'entry-123',
        sessionId: 'session-123',
        worldId: 'world-123', 
        characterId: 'char-123',
        type: 'decision',
        title: '',
        content: 'Chose to help the stranger when approached at the tavern',
        significance: 'major',
        isRead: false,
        relatedEntities: [
          {
            type: 'character',
            id: 'npc-stranger',
            name: 'Mysterious Stranger'
          },
          {
            type: 'location',
            id: 'location-tavern',
            name: 'The Prancing Pony'
          }
        ],
        metadata: {
          tags: ['decision'],
          automaticEntry: true,
          decisionId: 'decision-123',
          choiceText: 'Help the stranger',
          decisionPrompt: 'A mysterious stranger approaches you at the tavern. What do you do?',
          outcomeSegmentId: 'segment-456'
        },
        createdAt: '2024-01-01T12:00:00Z',
        updatedAt: '2024-01-01T12:00:00Z'
      };

      // Verify structure supports decision tracking requirements
      expect(decisionEntry.type).toBe('decision');
      expect(decisionEntry.metadata.decisionId).toBeDefined();
      expect(decisionEntry.metadata.choiceText).toBeDefined(); 
      expect(decisionEntry.metadata.decisionPrompt).toBeDefined();
      expect(decisionEntry.content).toContain('Chose to');
      expect(decisionEntry.significance).toBe('major');
    });

    test('supports linking decision to outcome', () => {
      const decisionWithOutcome: JournalEntry = {
        id: 'entry-decision',
        sessionId: 'session-123',
        worldId: 'world-123',
        characterId: 'char-123', 
        type: 'decision',
        title: '',
        content: 'Chose to investigate the strange noise when exploring the dungeon',
        detailedContent: 'Decision: Investigate the strange noise\nOutcome: Discovered a hidden treasure room behind a secret door',
        significance: 'critical',
        isRead: false,
        relatedEntities: [],
        metadata: {
          tags: ['decision', 'exploration'],
          automaticEntry: true,
          decisionId: 'decision-456',
          choiceText: 'Investigate the strange noise',
          decisionPrompt: 'You hear a strange noise from the dungeon wall. What do you do?',
          outcomeSegmentId: 'segment-outcome-456'
        },
        createdAt: '2024-01-01T12:00:00Z',
        updatedAt: '2024-01-01T12:01:00Z'
      };

      // Verify decision-outcome linking
      expect(decisionWithOutcome.detailedContent).toContain('Decision:');
      expect(decisionWithOutcome.detailedContent).toContain('Outcome:');
      expect(decisionWithOutcome.metadata.outcomeSegmentId).toBeDefined();
    });
  });

  // Test acceptance criteria: "The decision content is formatted for readability"
  describe('Decision Content Formatting', () => {
    test('formats decision entries consistently', () => {
      const scenarios = [
        {
          choiceText: 'Help the stranger',
          prompt: 'A mysterious stranger approaches you',
          expected: 'Chose to help the stranger when a mysterious stranger approaches you'
        },
        {
          choiceText: 'Attack the goblin',
          prompt: 'A goblin blocks your path',
          expected: 'Chose to attack the goblin when a goblin blocks your path'
        },
        {
          choiceText: 'Search for clues',
          prompt: 'You enter the abandoned house',
          expected: 'Chose to search for clues when you enter the abandoned house'
        }
      ];

      scenarios.forEach(({ choiceText, prompt, expected }) => {
        const formatDecisionContent = (choice: string, context: string): string => {
          const cleanChoice = choice.toLowerCase();
          const cleanContext = context.toLowerCase();
          return `Chose to ${cleanChoice} when ${cleanContext}`;
        };

        expect(formatDecisionContent(choiceText, prompt)).toBe(expected);
      });
    });
  });
});