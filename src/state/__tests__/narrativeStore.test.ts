import { narrativeStore } from '../index';

describe('narrativeStore', () => {
  it('initializes with default state', () => {
    const state = narrativeStore.getState();
    expect(state).toBeDefined();
  });
});
