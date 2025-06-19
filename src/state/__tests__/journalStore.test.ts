import { useJournalStore } from '../index';

describe('journalStore', () => {
  it('initializes with default state', () => {
    const state = useJournalStore.getState();
    expect(state).toBeDefined();
  });
});
