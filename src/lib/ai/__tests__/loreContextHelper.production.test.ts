import { getLoreContextForPrompt, checkAndRecordLoreMentions } from '../loreContextHelper';
import { useLoreStore } from '@/state/loreStore';

const originalNodeEnv = process.env.NODE_ENV;
const setNodeEnv = (value: string | undefined) => {
  (process.env as Record<string, string | undefined>).NODE_ENV = value;
};

describe('loreContextHelper usage recording in production', () => {
  beforeEach(() => {
    useLoreStore.getState().reset();
    setNodeEnv('production');
  });

  afterEach(() => {
    setNodeEnv(originalNodeEnv);
  });

  test('records usage counts for facts put in the prompt', () => {
    const factId = useLoreStore
      .getState()
      .addFact('door', 'The cellar door is barred', 'rules', 'narrative', 'world-1', 'session-1');

    getLoreContextForPrompt('world-1', 'session-1', { recordUsage: true, source: 'choices' });

    expect(useLoreStore.getState().loreUsage[factId]?.usageCount).toBe(1);
  });

  test('records mention counts from the response text', () => {
    const factId = useLoreStore
      .getState()
      .addFact('door', 'cellar door', 'rules', 'narrative', 'world-1', 'session-1');

    checkAndRecordLoreMentions('world-1', 'session-1', 'You open the cellar door.', 'choices');

    expect(useLoreStore.getState().loreUsage[factId]?.mentionCount).toBe(1);
  });
});
