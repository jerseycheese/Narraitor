import { inventoryStore } from '../index';

describe('inventoryStore', () => {
  it('initializes with default state', () => {
    const state = inventoryStore.getState();
    expect(state).toBeDefined();
  });
});
