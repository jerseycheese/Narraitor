import { sessionStore } from '../index';

describe('sessionStore', () => {
  it('initializes with default state', () => {
    const state = sessionStore.getState();
    expect(state).toBeDefined();
  });
});
