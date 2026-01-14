import { renderHook, act } from '@testing-library/react';
import { useItemDropConfirmation } from './useItemDropConfirmation';
import { useInventoryStore } from '@/state/inventoryStore';

// Mock the inventory store
jest.mock('@/state/inventoryStore');

describe('useItemDropConfirmation', () => {
  const mockRemoveItem = jest.fn();
  const mockClearError = jest.fn();
  const mockGetState = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default store state
    (useInventoryStore as unknown as jest.Mock).mockImplementation((selector) => {
      const state = {
        error: null,
        clearError: mockClearError,
      };
      return selector ? selector(state) : state;
    });

    // Setup getState for direct access
    (useInventoryStore as unknown as { getState: jest.Mock }).getState = mockGetState.mockReturnValue({
      error: null,
      removeItem: mockRemoveItem,
      clearError: mockClearError,
    });
  });

  const mockItem = {
    id: 'item-1',
    name: 'Test Item',
    description: 'A test item',
    quantity: 5,
    stackable: true,
    categoryId: 'miscellaneous' as const,
    acquisitionHistory: [],
    categorization: {
        categoryId: 'miscellaneous' as const,
        classifiedAt: '2024-01-01T00:00:00Z',
        source: 'manual' as const,
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useItemDropConfirmation('char-1'));

    expect(result.current.isDialogOpen).toBe(false);
    expect(result.current.itemToDrop).toBeNull();
    expect(result.current.dropQuantity).toBe(1);
    expect(result.current.quantityError).toBeNull();
    expect(result.current.storeError).toBeNull();
  });

  it('should open dialog and initialize with item data', () => {
    const { result } = renderHook(() => useItemDropConfirmation('char-1'));

    act(() => {
      result.current.openDropDialog(mockItem);
    });

    expect(result.current.isDialogOpen).toBe(true);
    expect(result.current.itemToDrop).toEqual(mockItem);
    expect(result.current.dropQuantity).toBe(mockItem.quantity); // Defaults to max
    expect(result.current.quantityError).toBeNull();
    expect(result.current.storeError).toBeNull();
  });

  it('should validate drop quantity', () => {
    const { result } = renderHook(() => useItemDropConfirmation('char-1'));

    act(() => {
      result.current.openDropDialog(mockItem);
    });

    // Valid quantity
    act(() => {
      result.current.setDropQuantity(3);
    });
    expect(result.current.dropQuantity).toBe(3);
    expect(result.current.quantityError).toBeNull();

    // Invalid: Too low
    act(() => {
      result.current.setDropQuantity(0);
    });
    expect(result.current.quantityError).toBe('Quantity must be at least 1');

    // Invalid: Too high
    act(() => {
      result.current.setDropQuantity(10);
    });
    expect(result.current.quantityError).toBe('Cannot drop more than 5 items');
  });

  it('should confirm drop successfully', () => {
    const { result } = renderHook(() => useItemDropConfirmation('char-1'));

    act(() => {
      result.current.openDropDialog(mockItem);
    });

    act(() => {
      result.current.setDropQuantity(2);
    });

    act(() => {
      result.current.confirmDrop();
    });

    // Should call removeItem with correct args
    expect(mockRemoveItem).toHaveBeenCalledWith('char-1', 'item-1', 2);

    // Should close dialog
    expect(result.current.isDialogOpen).toBe(false);
    expect(result.current.itemToDrop).toBeNull();
  });

  it('should handle store errors during drop', () => {
    // Setup store to have an error AFTER removeItem is called
    const storeError = { title: 'Error', message: 'Something went wrong' };
    mockGetState.mockReturnValue({
      error: storeError,
      removeItem: mockRemoveItem,
      clearError: mockClearError,
    });
    
    // Also mock the hook selector to return the error immediately
    (useInventoryStore as unknown as jest.Mock).mockImplementation((selector) => {
        const state = {
            error: storeError,
            clearError: mockClearError,
        };
        return selector ? selector(state) : state;
    });


    const { result } = renderHook(() => useItemDropConfirmation('char-1'));

    act(() => {
      result.current.openDropDialog(mockItem);
    });

    // Reset mocks to ensure clear start
    mockRemoveItem.mockClear();

    // When confirmDrop is called, it checks getState().error
    act(() => {
      result.current.confirmDrop();
    });

    expect(mockRemoveItem).toHaveBeenCalledWith('char-1', 'item-1', 5);

    // Should NOT close dialog
    expect(result.current.isDialogOpen).toBe(true);
    // Should set store error in local state
    expect(result.current.storeError).toEqual(storeError);
  });

  it('should clear errors when closing dialog', () => {
    const { result } = renderHook(() => useItemDropConfirmation('char-1'));

    act(() => {
      result.current.openDropDialog(mockItem);
    });

    act(() => {
      result.current.closeDropDialog();
    });

    expect(result.current.isDialogOpen).toBe(false);
    expect(result.current.itemToDrop).toBeNull();
    expect(mockClearError).toHaveBeenCalled();
  });
});
