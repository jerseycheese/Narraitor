import { exportJournalToMarkdown, exportJournalToText } from '../journalExport';
import { JournalEntry } from '@/types/journal.types';

describe('journalExport', () => {
  const mockEntries: JournalEntry[] = [
    {
      id: 'entry-1',
      sessionId: 'session-1',
      worldId: 'world-1',
      characterId: 'char-1',
      type: 'character_event',
      title: 'Meeting with Elder',
      content: 'Had a meaningful conversation with Elder Thorne about the ancient prophecy.',
      significance: 'major',
      isRead: false,
      relatedEntities: [],
      metadata: {
        tags: ['prophecy', 'elder'],
        automaticEntry: true
      },
      createdAt: '2023-01-01T12:00:00Z'
    },
    {
      id: 'entry-2',
      sessionId: 'session-1',
      worldId: 'world-1',
      characterId: 'char-1',
      type: 'discovery',
      title: 'Ancient Artifact',
      content: 'Discovered a mysterious artifact in the ancient ruins.',
      significance: 'critical',
      isRead: false,
      relatedEntities: [],
      metadata: {
        tags: ['artifact', 'ruins'],
        automaticEntry: true
      },
      createdAt: '2023-01-02T12:00:00Z'
    }
  ];

  describe('exportJournalToMarkdown', () => {
    it('exports entries to markdown format', () => {
      const result = exportJournalToMarkdown(mockEntries, 'My Adventure');
      
      expect(result).toContain('# My Adventure');
      expect(result).toContain('## Meeting with Elder');
      expect(result).toContain('Had a meaningful conversation with Elder Thorne');
      expect(result).toContain('## Ancient Artifact');
      expect(result).toContain('Discovered a mysterious artifact');
    });

    it('includes timestamps in markdown export', () => {
      const result = exportJournalToMarkdown(mockEntries, 'My Adventure');
      
      expect(result).toContain('*January 1, 2023*');
      expect(result).toContain('*January 2, 2023*');
    });

    it('includes significance levels in markdown export', () => {
      const result = exportJournalToMarkdown(mockEntries, 'My Adventure');
      
      expect(result).toContain('**Major**');
      expect(result).toContain('**Critical**');
    });
  });

  describe('exportJournalToText', () => {
    it('exports entries to plain text format', () => {
      const result = exportJournalToText(mockEntries, 'My Adventure');
      
      expect(result).toContain('MY ADVENTURE');
      expect(result).toContain('Meeting with Elder');
      expect(result).toContain('Had a meaningful conversation with Elder Thorne');
      expect(result).toContain('Ancient Artifact');
      expect(result).toContain('Discovered a mysterious artifact');
    });

    it('includes timestamps in text export', () => {
      const result = exportJournalToText(mockEntries, 'My Adventure');
      
      expect(result).toContain('January 1, 2023');
      expect(result).toContain('January 2, 2023');
    });

    it('includes significance levels in text export', () => {
      const result = exportJournalToText(mockEntries, 'My Adventure');
      
      expect(result).toContain('[Major]');
      expect(result).toContain('[Critical]');
    });
  });

  describe('edge cases', () => {
    it('handles empty entries array', () => {
      const markdownResult = exportJournalToMarkdown([], 'Empty Story');
      const textResult = exportJournalToText([], 'Empty Story');
      
      expect(markdownResult).toContain('# Empty Story');
      expect(textResult).toContain('EMPTY STORY');
    });

    it('handles entries without titles', () => {
      const entriesWithoutTitles = mockEntries.map(entry => ({ ...entry, title: '' }));
      
      const markdownResult = exportJournalToMarkdown(entriesWithoutTitles, 'Test Story');
      const textResult = exportJournalToText(entriesWithoutTitles, 'Test Story');
      
      expect(markdownResult).not.toContain('## undefined');
      expect(textResult).not.toContain('undefined');
    });
  });
});