import { worldStore } from '../index';

describe('worldStore', () => {
  it('initializes with default state', () => {
    const state = worldStore.getState();
    expect(state).toBeDefined();
  });
});
