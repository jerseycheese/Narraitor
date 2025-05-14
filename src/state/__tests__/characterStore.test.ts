import { characterStore } from '../index';

describe('characterStore', () => {
  it('initializes with default state', () => {
    const state = characterStore.getState();
    expect(state).toBeDefined();
  });
});
