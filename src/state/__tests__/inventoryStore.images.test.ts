// src/state/__tests__/inventoryStore.images.test.ts

import {
  useInventoryStore,
  type InventoryItemCreatePayload,
  type InventoryItemAddPayload,
} from '../inventoryStore';
import { ErrorType } from '@/lib/utils/errorUtils';
import type {
  InventoryItemCategorization,
  InventoryAcquisitionRecord,
} from '@/types/inventory.types';
import type { GeneratedImage } from '@/types/common.types';
import { setupTestTimers, cleanupTestTimers } from '@/lib/test-utils/testTimers';

const buildCategorization = (): InventoryItemCategorization => ({
  categoryId: 'consumables',
  source: 'manual',
  classifiedAt: '2025-01-15T12:00:00Z',
  confidence: 0.95,
});

const buildAcquisition = (): InventoryAcquisitionRecord => ({
  acquiredAt: '2025-01-15T12:00:00Z',
  method: 'manual',
  quantity: 1,
});

const buildValidImage = (): GeneratedImage => ({
  type: 'ai-generated',
  url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  generatedAt: '2025-01-15T12:00:00Z',
  prompt: 'A health potion in fantasy style',
});

const buildCreatePayload = (
  overrides: Partial<InventoryItemCreatePayload> = {}
): InventoryItemCreatePayload => ({
  name: 'Health Potion',
  description: 'Restores 50 HP',
  stackable: true,
  maxStack: 10,
  quantity: 1,
  categorization: buildCategorization(),
  acquisition: buildAcquisition(),
  ...overrides,
});

const buildAddPayload = (
  overrides: Partial<InventoryItemAddPayload> = {}
): InventoryItemAddPayload => ({
  name: 'Mana Potion',
  description: 'Restores 30 MP',
  stackable: true,
  maxStack: 10,
  quantity: 1,
  categorization: buildCategorization(), // Required for addItem
  acquisition: buildAcquisition(),
  ...overrides,
});

describe('inventoryStore - image field support', () => {
  beforeEach(() => {
    setupTestTimers();
    useInventoryStore.getState().reset();
  });

  afterEach(() => {
    jest.clearAllTimers();
    cleanupTestTimers();
  });

  describe('createItem with image field', () => {
    test('creates item with valid ai-generated image', () => {
      const image = buildValidImage();
      const payload = buildCreatePayload({ image });

      const itemId = useInventoryStore.getState().createItem(payload);

      expect(itemId).toBeTruthy();
      const createdItem = useInventoryStore.getState().items[itemId];
      expect(createdItem).toBeDefined();
      expect(createdItem.image).toEqual(image);
    });

    test('creates item with placeholder image type', () => {
      const image: GeneratedImage = {
        type: 'placeholder',
        url: null,
      };
      const payload = buildCreatePayload({ image });

      const itemId = useInventoryStore.getState().createItem(payload);

      expect(itemId).toBeTruthy();
      const createdItem = useInventoryStore.getState().items[itemId];
      expect(createdItem.image).toEqual(image);
    });

    test('creates item without image field (backward compatible)', () => {
      const payload = buildCreatePayload();

      const itemId = useInventoryStore.getState().createItem(payload);

      expect(itemId).toBeTruthy();
      const createdItem = useInventoryStore.getState().items[itemId];
      expect(createdItem).toBeDefined();
      expect(createdItem.image).toBeUndefined();
    });

    test('rejects item with invalid image type', () => {
      const image = {
        type: 'invalid-type',
        url: 'data:image/png;base64,abc',
      } as unknown as GeneratedImage;
      const payload = buildCreatePayload({ image });

      const itemId = useInventoryStore.getState().createItem(payload);
      const state = useInventoryStore.getState();

      expect(itemId).toBe('');
      expect(state.error).toMatchObject({
        title: 'Validation Error',
        message: 'Image type must be "ai-generated" or "placeholder"',
        type: ErrorType.VALIDATION,
      });
    });

    test('rejects item with non-string image URL', () => {
      const image = {
        type: 'ai-generated',
        url: 12345,
      } as unknown as GeneratedImage;
      const payload = buildCreatePayload({ image });

      const itemId = useInventoryStore.getState().createItem(payload);
      const state = useInventoryStore.getState();

      expect(itemId).toBe('');
      expect(state.error).toMatchObject({
        title: 'Validation Error',
        message: 'Image URL must be a string or null',
        type: ErrorType.VALIDATION,
      });
    });

    test('rejects item with null image object', () => {
      const payload = buildCreatePayload({ image: null as unknown as GeneratedImage });

      const itemId = useInventoryStore.getState().createItem(payload);
      const state = useInventoryStore.getState();

      expect(itemId).toBe('');
      expect(state.error).toMatchObject({
        title: 'Validation Error',
        message: 'Image must be a GeneratedImage object',
        type: ErrorType.VALIDATION,
      });
    });
  });

  describe('addItem with image field', () => {
    test('adds item with valid image', () => {
      const image = buildValidImage();
      const payload = buildAddPayload({ image });

      const itemId = useInventoryStore.getState().addItem('char-1', payload);

      expect(itemId).toBeTruthy();
      const addedItem = useInventoryStore.getState().items[itemId];
      expect(addedItem).toBeDefined();
      expect(addedItem.image).toEqual(image);

      const characterItems = useInventoryStore.getState().getCharacterItems('char-1');
      expect(characterItems).toHaveLength(1);
      expect(characterItems[0].image).toEqual(image);
    });

    test('adds item without image field (backward compatible)', () => {
      const payload = buildAddPayload();

      const itemId = useInventoryStore.getState().addItem('char-1', payload);

      expect(itemId).toBeTruthy();
      const addedItem = useInventoryStore.getState().items[itemId];
      expect(addedItem).toBeDefined();
      expect(addedItem.image).toBeUndefined();
    });
  });

  describe('updateItem with image field', () => {
    test('updates item to add image', () => {
      const payload = buildCreatePayload();
      const itemId = useInventoryStore.getState().createItem(payload);

      const image = buildValidImage();
      useInventoryStore.getState().updateItem(itemId, { image });

      const updatedItem = useInventoryStore.getState().items[itemId];
      expect(updatedItem.image).toEqual(image);
    });

    test('updates item to remove image', () => {
      const image = buildValidImage();
      const payload = buildCreatePayload({ image });
      const itemId = useInventoryStore.getState().createItem(payload);

      useInventoryStore.getState().updateItem(itemId, { image: undefined });

      const updatedItem = useInventoryStore.getState().items[itemId];
      expect(updatedItem.image).toBeUndefined();
    });
  });

  describe('generation status tracking', () => {
    test('tracks items with images being generated', () => {
      const itemId = 'item-1';

      expect(useInventoryStore.getState().generatingImageFor.has(itemId)).toBe(false);

      useInventoryStore.getState().setGeneratingImage(itemId, true);
      expect(useInventoryStore.getState().generatingImageFor.has(itemId)).toBe(true);

      useInventoryStore.getState().setGeneratingImage(itemId, false);
      expect(useInventoryStore.getState().generatingImageFor.has(itemId)).toBe(false);
    });

    test('tracks multiple items generating simultaneously', () => {
      const itemId1 = 'item-1';
      const itemId2 = 'item-2';

      useInventoryStore.getState().setGeneratingImage(itemId1, true);
      useInventoryStore.getState().setGeneratingImage(itemId2, true);

      expect(useInventoryStore.getState().generatingImageFor.has(itemId1)).toBe(true);
      expect(useInventoryStore.getState().generatingImageFor.has(itemId2)).toBe(true);

      useInventoryStore.getState().setGeneratingImage(itemId1, false);

      expect(useInventoryStore.getState().generatingImageFor.has(itemId1)).toBe(false);
      expect(useInventoryStore.getState().generatingImageFor.has(itemId2)).toBe(true);
    });

    test('tracks image generation errors', () => {
      const itemId = 'item-1';
      const errorMessage = 'API rate limit exceeded';

      expect(useInventoryStore.getState().imageGenerationErrors.has(itemId)).toBe(false);

      useInventoryStore.getState().setImageGenerationError(itemId, errorMessage);
      expect(useInventoryStore.getState().imageGenerationErrors.get(itemId)).toBe(errorMessage);

      useInventoryStore.getState().setImageGenerationError(itemId, null);
      expect(useInventoryStore.getState().imageGenerationErrors.has(itemId)).toBe(false);
    });

    test('clears all generation state on reset', () => {
      useInventoryStore.getState().setGeneratingImage('item-1', true);
      useInventoryStore.getState().setImageGenerationError('item-2', 'Some error');

      useInventoryStore.getState().reset();

      expect(useInventoryStore.getState().generatingImageFor.size).toBe(0);
      expect(useInventoryStore.getState().imageGenerationErrors.size).toBe(0);
    });
  });
});
