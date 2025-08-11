/**
 * Test: Journal store decision entry integration
 * 
 * Tests that the journal store can successfully create and manage decision entries
 * for issue #174: Save player choices and outcomes for story tracking
 */

import { useJournalStore } from '../journalStore';

// Initialize the store for testing
const getStore = () => useJournalStore.getState();

describe('journalStore - Decision Entries', () => {
  beforeEach(() => {
    // Reset store before each test
    getStore().reset();
  });

  test('creates decision journal entries with proper structure', () => {
    const { addEntry } = getStore();

    const entryId = addEntry('session-123', {
      worldId: 'world-123',
      characterId: 'char-123', 
      type: 'decision',
      title: '',
      content: 'Chose to help the stranger when you encounter a suspicious person at the tavern',
      significance: 'major',
      isRead: false,
      relatedEntities: [
        {
          type: 'character',
          id: 'npc-stranger',
          name: 'Suspicious Stranger'
        }
      ],
      metadata: {
        tags: ['decision'],
        automaticEntry: true,
        decisionId: 'decision-123',
        choiceText: 'Help the stranger', 
        decisionPrompt: 'You encounter a suspicious person at the tavern. What do you do?'
      },
      updatedAt: new Date().toISOString()
    });

    const entries = getStore().getSessionEntries('session-123');
    expect(entries).toHaveLength(1);

    const decisionEntry = entries[0];
    expect(decisionEntry.id).toBe(entryId);
    expect(decisionEntry.type).toBe('decision');
    expect(decisionEntry.significance).toBe('major');
    expect(decisionEntry.content).toBe('Chose to help the stranger when you encounter a suspicious person at the tavern');
    expect(decisionEntry.metadata.decisionId).toBe('decision-123');
    expect(decisionEntry.metadata.choiceText).toBe('Help the stranger');
    expect(decisionEntry.metadata.decisionPrompt).toBe('You encounter a suspicious person at the tavern. What do you do?');
  });

  test('supports decision entries with different significance levels', () => {
    const { addEntry } = getStore();

    // Minor decision
    addEntry('session-123', {
      worldId: 'world-123',
      characterId: 'char-123',
      type: 'decision',
      title: '',
      content: 'Chose to order ale when the bartender asks what you want to drink',
      significance: 'minor',
      isRead: false,
      relatedEntities: [],
      metadata: {
        tags: ['decision'],
        automaticEntry: true,
        decisionId: 'decision-minor',
        choiceText: 'Order ale',
        decisionPrompt: 'The bartender asks what you want to drink'
      },
      updatedAt: new Date().toISOString()
    });

    // Critical decision  
    addEntry('session-123', {
      worldId: 'world-123',
      characterId: 'char-123',
      type: 'decision', 
      title: '',
      content: 'Chose to fight the dragon when confronted with the ancient beast',
      significance: 'critical',
      isRead: false,
      relatedEntities: [],
      metadata: {
        tags: ['decision'],
        automaticEntry: true,
        decisionId: 'decision-critical',
        choiceText: 'Fight the dragon',
        decisionPrompt: 'You are confronted with an ancient dragon. What do you do?'
      },
      updatedAt: new Date().toISOString()
    });

    const entries = getStore().getSessionEntries('session-123');
    expect(entries).toHaveLength(2);
    
    const minorDecision = entries.find(e => e.significance === 'minor');
    const criticalDecision = entries.find(e => e.significance === 'critical');
    
    expect(minorDecision).toBeDefined();
    expect(criticalDecision).toBeDefined();
    expect(minorDecision!.metadata.decisionId).toBe('decision-minor');
    expect(criticalDecision!.metadata.decisionId).toBe('decision-critical');
  });

  test('filters decision entries by type', () => {
    const { addEntry, getEntriesByType } = getStore();

    // Add decision entry
    addEntry('session-123', {
      worldId: 'world-123',
      characterId: 'char-123',
      type: 'decision',
      title: '',
      content: 'Chose to investigate when you hear strange noises',
      significance: 'major',
      isRead: false, 
      relatedEntities: [],
      metadata: {
        tags: ['decision'],
        automaticEntry: true,
        decisionId: 'decision-investigate',
        choiceText: 'Investigate the noise',
        decisionPrompt: 'You hear strange noises from the basement'
      },
      updatedAt: new Date().toISOString()
    });

    // Add non-decision entry for comparison
    addEntry('session-123', {
      worldId: 'world-123',
      characterId: 'char-123',
      type: 'discovery',
      title: '',
      content: 'Found a hidden treasure chest behind the bookshelf',
      significance: 'major',
      isRead: false,
      relatedEntities: [],
      metadata: {
        tags: ['discovery'],
        automaticEntry: true
      },
      updatedAt: new Date().toISOString()
    });

    const decisionEntries = getEntriesByType('decision');
    const discoveryEntries = getEntriesByType('discovery');
    
    expect(decisionEntries).toHaveLength(1);
    expect(discoveryEntries).toHaveLength(1);
    expect(decisionEntries[0].type).toBe('decision');
    expect(decisionEntries[0].metadata.decisionId).toBe('decision-investigate');
  });

  test('manages multiple decision entries correctly', () => {
    const { addEntry, getSessionEntries } = getStore();

    // Add multiple decision entries
    addEntry('session-123', {
      worldId: 'world-123',
      characterId: 'char-123',
      type: 'decision',
      title: '',
      content: 'Chose to enter the tavern when approaching the building',
      significance: 'minor',
      isRead: false,
      relatedEntities: [],
      metadata: {
        tags: ['decision'],
        automaticEntry: true,
        decisionId: 'decision-1',
        choiceText: 'Enter the tavern',
        decisionPrompt: 'You approach a tavern. What do you do?'
      },
      updatedAt: new Date().toISOString()
    });
    
    addEntry('session-123', {
      worldId: 'world-123',
      characterId: 'char-123',
      type: 'decision',
      title: '',
      content: 'Chose to talk to the bartender when inside the tavern',
      significance: 'minor', 
      isRead: false,
      relatedEntities: [],
      metadata: {
        tags: ['decision'],
        automaticEntry: true,
        decisionId: 'decision-2',
        choiceText: 'Talk to the bartender',
        decisionPrompt: 'You are inside the tavern. What do you do next?'
      },
      updatedAt: new Date().toISOString()
    });

    const entries = getSessionEntries('session-123');
    expect(entries).toHaveLength(2);
    
    // Both entries should be decision type
    expect(entries.every(entry => entry.type === 'decision')).toBe(true);
    
    // Both should have decision metadata
    expect(entries.every(entry => entry.metadata.decisionId)).toBe(true);
    expect(entries.every(entry => entry.metadata.choiceText)).toBe(true);
    expect(entries.every(entry => entry.metadata.decisionPrompt)).toBe(true);
  });
});