import { journalStore } from '../index';

describe('journalStore', () => {
  it('initializes with default state', () => {
    const state = journalStore.getState();
    expect(state).toBeDefined();
  });
});
