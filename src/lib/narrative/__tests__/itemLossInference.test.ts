import { inferItemsLostFromNarrative } from '../itemLossInference';
import { createMockInventoryItem } from '@/lib/test-utils';

describe('inferItemsLostFromNarrative', () => {
  it('returns empty when no loss verbs are present', () => {
    const inventory = [createMockInventoryItem({ name: 'Rusted Knife' })];
    const result = inferItemsLostFromNarrative(
      'You polish the rusted knife and check its edge.',
      inventory
    );

    expect(result).toEqual([]);
  });

  it('infers dropped items from narrative content', () => {
    const inventory = [createMockInventoryItem({ name: 'Conduit Tap' })];
    const result = inferItemsLostFromNarrative(
      'The Conduit Tap clatters away as you drop it into the wreckage.',
      inventory
    );

    expect(result).toEqual([
      { name: 'Conduit Tap', quantity: 1, lossReason: 'dropped' },
    ]);
  });

  it('infers consumed items when verbs indicate usage', () => {
    const inventory = [createMockInventoryItem({ name: 'Health Potion', stackable: true, quantity: 3 })];
    const result = inferItemsLostFromNarrative(
      'You drink the health potion and steady your breathing.',
      inventory
    );

    expect(result).toEqual([
      { name: 'Health Potion', quantity: 1, lossReason: 'consumed' },
    ]);
  });
});
