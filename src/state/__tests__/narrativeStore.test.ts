import { useNarrativeStore } from '../index';

describe('narrativeStore', () => {
  it('initializes with default state', () => {
    const state = useNarrativeStore.getState();
    expect(state).toBeDefined();
  });
});
