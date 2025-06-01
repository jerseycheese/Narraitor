import { aiContextStore } from '../index';

describe('aiContextStore', () => {
  it('initializes with default state', () => {
    const state = aiContextStore.getState();
    expect(state).toBeDefined();
  });
});
