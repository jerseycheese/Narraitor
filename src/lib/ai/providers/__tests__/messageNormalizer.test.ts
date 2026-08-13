import { normalizeMessages, type ChatMessage } from '../middleware/messageNormalizer';

const SYSTEM_AND_USER: ChatMessage[] = [
  { role: 'system', content: 'Write to a PG-13 rating.' },
  { role: 'user', content: 'Continue the story.' },
];

describe('normalizeMessages', () => {
  describe('models with a system role', () => {
    const capabilities = { systemRole: true, alternatingTurns: false };

    it('leaves a system turn alone', () => {
      expect(normalizeMessages(SYSTEM_AND_USER, capabilities)).toEqual(SYSTEM_AND_USER);
    });

    it('drops empty messages, which some providers reject outright', () => {
      const withBlank: ChatMessage[] = [{ role: 'system', content: '   ' }, ...SYSTEM_AND_USER];

      expect(normalizeMessages(withBlank, capabilities)).toEqual(SYSTEM_AND_USER);
    });
  });

  describe('models with no system role', () => {
    const capabilities = { systemRole: false, alternatingTurns: false };

    it('folds the system text into the first user turn', () => {
      expect(normalizeMessages(SYSTEM_AND_USER, capabilities)).toEqual([
        { role: 'user', content: 'Write to a PG-13 rating.\n\nContinue the story.' },
      ]);
    });

    it('only touches the first user turn', () => {
      const conversation: ChatMessage[] = [
        ...SYSTEM_AND_USER,
        { role: 'assistant', content: 'A door opens.' },
        { role: 'user', content: 'Go through it.' },
      ];

      const normalized = normalizeMessages(conversation, capabilities);

      expect(normalized).toHaveLength(3);
      expect(normalized[0].content).toContain('Write to a PG-13 rating.');
      expect(normalized[2]).toEqual({ role: 'user', content: 'Go through it.' });
    });

    it('promotes system-only input to a user turn rather than sending nothing', () => {
      const systemOnly: ChatMessage[] = [{ role: 'system', content: 'Be brief.' }];

      expect(normalizeMessages(systemOnly, capabilities)).toEqual([
        { role: 'user', content: 'Be brief.' },
      ]);
    });
  });

  describe('models that require alternating turns', () => {
    const capabilities = { systemRole: true, alternatingTurns: true };

    it('joins consecutive same-role turns', () => {
      const consecutive: ChatMessage[] = [
        { role: 'user', content: 'First.' },
        { role: 'user', content: 'Second.' },
        { role: 'assistant', content: 'Reply.' },
      ];

      expect(normalizeMessages(consecutive, capabilities)).toEqual([
        { role: 'user', content: 'First.\n\nSecond.' },
        { role: 'assistant', content: 'Reply.' },
      ]);
    });

    it('coalesces after system injection, so folding cannot create a duplicate role', () => {
      const messages: ChatMessage[] = [
        { role: 'system', content: 'Be brief.' },
        { role: 'user', content: 'First.' },
        { role: 'user', content: 'Second.' },
      ];

      expect(normalizeMessages(messages, { systemRole: false, alternatingTurns: true })).toEqual([
        { role: 'user', content: 'Be brief.\n\nFirst.\n\nSecond.' },
      ]);
    });
  });
});
