import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InventoryList } from '../InventoryList';
import { useInventoryStore } from '@/state/inventoryStore';
import type { InventoryStore } from '@/state/inventoryStore';
import type { InventoryItem } from '@/types/inventory.types';

jest.mock('@/state/inventoryStore', () => ({
  useInventoryStore: jest.fn(),
}));

const mockUseInventoryStore = useInventoryStore as jest.MockedFunction<typeof useInventoryStore>;

interface MockDropDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onClose: () => void;
  item: InventoryItem;
}

// Mock DropConfirmationDialog to avoid testing its internal logic here
jest.mock('../DropConfirmationDialog', () => ({
  DropConfirmationDialog: ({ isOpen, onConfirm, onClose, item }: MockDropDialogProps) => (
    isOpen ? (
      <div role="dialog" aria-label="Drop Item">
        <p>Drop {item?.name}?</p>
        <button onClick={onConfirm}>Confirm Drop</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    ) : null
  )
}));

const baseTimestamp = '2025-01-15T12:00:00Z';


const createMockInventoryStore = (
  overrides: Partial<InventoryStore> = {}
): InventoryStore => {
  const items = overrides.items ?? {};
  const characterInventories = overrides.characterInventories ?? {};
  const getCharacterItems =
    overrides.getCharacterItems ??
    jest.fn((id: string) =>
      (characterInventories[id] ?? [])
        .map((itemId) => items[itemId])
        .filter((item): item is InventoryItem => Boolean(item))
    );

  return {
    items,
    entities: overrides.entities ?? items,
    characterInventories,
    currentEntityId: null,
    error: null,
    loading: false,
    generatingImageFor: new Set(),
    imageGenerationErrors: new Map(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    setCurrent: jest.fn(),
    getById: jest.fn(),
    getAll: jest.fn(),
    reset: jest.fn(),
    setError: jest.fn(),
    clearError: jest.fn(),
    setLoading: jest.fn(),
    createItem: jest.fn(),
    updateItem: jest.fn(),
    deleteItem: jest.fn(),
    addItem: jest.fn(),
    removeItem: jest.fn(),
    updateItemQuantity: jest.fn(),
    getCharacterItems,
    clearCharacterInventory: jest.fn(),
    useItem: jest.fn(),
    toggleEquipItem: jest.fn(() => ({ success: true, equipped: true })),
    setGeneratingImage: jest.fn(),
    setImageGenerationError: jest.fn(),
    ...overrides,
  };
};

const createItem = (overrides: Partial<InventoryItem>): InventoryItem => {
  const quantity = overrides.quantity ?? 1;
  const categoryId = overrides.categoryId ?? 'equipment';

  return {
    id: overrides.id ?? 'item-1',
    name: overrides.name ?? 'Item',
    description: overrides.description ?? 'Description',
    categoryId,
    quantity,
    stackable: overrides.stackable ?? true,
    maxStack: overrides.maxStack,
    acquisitionHistory:
      overrides.acquisitionHistory ??
      [
        {
          acquiredAt: baseTimestamp,
          method: 'manual',
          quantity,
        },
      ],
    categorization:
      overrides.categorization ??
      {
        categoryId,
        source: 'manual',
        classifiedAt: baseTimestamp,
        confidence: 0.9,
      },
    createdAt: overrides.createdAt ?? baseTimestamp,
    updatedAt: overrides.updatedAt ?? baseTimestamp,
    equipped: overrides.equipped,
    ...(overrides.image ? { image: overrides.image } : {}),
  };
};

describe('InventoryList', () => {
  const characterId = 'char-1';
  const inventoryList = () => (
    <InventoryList
      characterId={characterId}
      worldId="world-1"
      sessionId="session-1"
    />
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('groups items by category and renders headings', () => {
    const mockItems = [
      createItem({
        id: 'item-1',
        name: 'Steel Sword',
        description: 'Reliable blade',
        categoryId: 'equipment',
        stackable: false,
      }),
      createItem({
        id: 'item-2',
        name: 'Health Potion',
        description: 'Restores vitality',
        categoryId: 'consumables',
        quantity: 3,
      }),
    ];

    const mockItemsById = mockItems.reduce((acc, item) => {
      acc[item.id] = item;
      return acc;
    }, {} as Record<string, typeof mockItems[0]>);
    const mockCharacterInventories = { [characterId]: mockItems.map((item) => item.id) };
    const mockStore = createMockInventoryStore({
      items: mockItemsById,
      characterInventories: mockCharacterInventories,
      removeItem: jest.fn(),
    });
    mockUseInventoryStore.mockImplementation((selector) =>
      selector ? selector(mockStore) : mockStore
    );

    render(inventoryList());

    expect(screen.getByRole('heading', { name: 'Equipment' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Consumables' })).toBeInTheDocument();
    expect(screen.getByText('Steel Sword')).toBeInTheDocument();
    expect(screen.getByText('Health Potion')).toBeInTheDocument();
  });

  test('shows stackable quantity badge', () => {
    const mockItems = [
      createItem({
        id: 'item-3',
        name: 'Arrow Bundle',
        description: 'Bundle of arrows',
        categoryId: 'equipment',
        quantity: 12,
        stackable: true,
        maxStack: 50,
      }),
    ];

    const mockItemsById = mockItems.reduce((acc, item) => {
      acc[item.id] = item;
      return acc;
    }, {} as Record<string, typeof mockItems[0]>);
    const mockCharacterInventories = { [characterId]: mockItems.map((item) => item.id) };
    const mockStore = createMockInventoryStore({
      items: mockItemsById,
      characterInventories: mockCharacterInventories,
      removeItem: jest.fn(),
    });
    mockUseInventoryStore.mockImplementation((selector) =>
      selector ? selector(mockStore) : mockStore
    );

    render(inventoryList());

    expect(screen.getByText(/×12/)).toBeInTheDocument();
  });

  test('renders empty state when inventory is empty', () => {
    const mockItemsById = {};
    const mockCharacterInventories = { [characterId]: [] };
    const mockStore = createMockInventoryStore({
      items: mockItemsById,
      characterInventories: mockCharacterInventories,
      removeItem: jest.fn(),
    });
    mockUseInventoryStore.mockImplementation((selector) =>
      selector ? selector(mockStore) : mockStore
    );

    render(inventoryList());

    expect(screen.getByText(/no items in inventory/i)).toBeInTheDocument();
  });

  test('updates when inventory items change', () => {
    const newItem = createItem({
      id: 'item-4',
      name: 'Arcane Tome',
      description: 'Contains forbidden spells',
      categoryId: 'documents',
      stackable: false,
    });

    // First render: empty inventory
    let mockItemsById: Record<string, InventoryItem> = {};
    let mockCharacterInventories: Record<string, string[]> = { [characterId]: [] };
    let mockStore = createMockInventoryStore({
      items: mockItemsById,
      characterInventories: mockCharacterInventories,
      removeItem: jest.fn(),
    });

    mockUseInventoryStore.mockImplementation((selector) =>
      selector ? selector(mockStore) : mockStore
    );

    const { rerender } = render(inventoryList());
    expect(screen.getByText(/no items in inventory/i)).toBeInTheDocument();

    // Second render: item added to inventory
    mockItemsById = { [newItem.id]: newItem };
    mockCharacterInventories = { [characterId]: [newItem.id] };
    mockStore = createMockInventoryStore({
      items: mockItemsById,
      characterInventories: mockCharacterInventories,
      removeItem: jest.fn(),
    });

    rerender(inventoryList());

    expect(screen.getByText('Arcane Tome')).toBeInTheDocument();
  });

  test('renders the item image when one has been generated', () => {
    const mockItems = [
      createItem({
        id: 'item-img',
        name: 'Enchanted Ring',
        categoryId: 'valuables',
        image: {
          type: 'ai-generated',
          url: 'https://example.com/ring.png',
        },
      }),
    ];

    const mockItemsById = { 'item-img': mockItems[0] };
    const mockCharacterInventories = { [characterId]: ['item-img'] };
    const mockStore = createMockInventoryStore({
      items: mockItemsById,
      characterInventories: mockCharacterInventories,
    });
    mockUseInventoryStore.mockImplementation((selector) =>
      selector ? selector(mockStore) : mockStore
    );

    render(inventoryList());

    const image = screen.getByAltText('Enchanted Ring') as HTMLImageElement;
    expect(image).toBeInTheDocument();
    expect(image.src).toBe('https://example.com/ring.png');
  });

  test('surfaces an error affordance when image generation failed', () => {
    const mockItems = [
      createItem({ id: 'item-err', name: 'Broken Compass', categoryId: 'equipment' }),
    ];

    const mockItemsById = { 'item-err': mockItems[0] };
    const mockCharacterInventories = { [characterId]: ['item-err'] };
    const mockStore = createMockInventoryStore({
      items: mockItemsById,
      characterInventories: mockCharacterInventories,
      imageGenerationErrors: new Map([['item-err', 'Image generation failed: 500']]),
    });
    mockUseInventoryStore.mockImplementation((selector) =>
      selector ? selector(mockStore) : mockStore
    );

    render(inventoryList());

    expect(
      screen.getByLabelText('Image unavailable for Broken Compass')
    ).toBeInTheDocument();
  });

  test('shows the image-unavailable affordance for an image object with a null URL', () => {
    const mockItems = [
      createItem({
        id: 'item-null-url',
        name: 'Faded Locket',
        categoryId: 'personal',
        image: { type: 'placeholder', url: null },
      }),
    ];

    const mockItemsById = { 'item-null-url': mockItems[0] };
    const mockCharacterInventories = { [characterId]: ['item-null-url'] };
    const mockStore = createMockInventoryStore({
      items: mockItemsById,
      characterInventories: mockCharacterInventories,
    });
    mockUseInventoryStore.mockImplementation((selector) =>
      selector ? selector(mockStore) : mockStore
    );

    render(inventoryList());

    expect(
      screen.getByLabelText('Image unavailable for Faded Locket')
    ).toBeInTheDocument();
  });

  test('shows a loading affordance while an image is generating', () => {
    const mockItems = [
      createItem({ id: 'item-gen', name: 'Summoned Blade', categoryId: 'equipment' }),
    ];

    const mockItemsById = { 'item-gen': mockItems[0] };
    const mockCharacterInventories = { [characterId]: ['item-gen'] };
    const mockStore = createMockInventoryStore({
      items: mockItemsById,
      characterInventories: mockCharacterInventories,
      generatingImageFor: new Set(['item-gen']),
    });
    mockUseInventoryStore.mockImplementation((selector) =>
      selector ? selector(mockStore) : mockStore
    );

    render(inventoryList());

    expect(
      screen.getByLabelText('Generating image for Summoned Blade')
    ).toBeInTheDocument();
  });

  test('opens confirmation dialog on drop click', async () => {
    const user = userEvent.setup();
    const mockRemoveItem = jest.fn();
    const mockClearError = jest.fn();
    
    const mockItems = [
      createItem({ id: 'item-1', name: 'Test Item', quantity: 1 })
    ];
    
    const mockStore = createMockInventoryStore({
        items: { 'item-1': mockItems[0] },
        characterInventories: { [characterId]: ['item-1'] },
        removeItem: mockRemoveItem,
        clearError: mockClearError,
        error: null,
    });

    mockUseInventoryStore.mockImplementation((selector) => 
        selector ? selector(mockStore) : mockStore
    );
    // Mock getState needed for the hook
    (mockUseInventoryStore as unknown as { getState: () => InventoryStore }).getState = () => mockStore;

    render(inventoryList());

    // Find drop button
    const dropButton = screen.getByLabelText('Drop Test Item');
    await user.click(dropButton);

    // Dialog should be open
    expect(screen.getByRole('dialog', { name: 'Drop Item' })).toBeInTheDocument();
    
    // Confirm
    await user.click(screen.getByText('Confirm Drop'));
    
    // Should call removeItem
    expect(mockRemoveItem).toHaveBeenCalledWith(characterId, 'item-1', 1);
  });

  test('shows the equipped indicator for equipped items', () => {
    const equippedItem = createItem({
      id: 'item-eq',
      name: 'Steel Sword',
      categoryId: 'equipment',
      stackable: false,
      equipped: true,
    });

    const mockStore = createMockInventoryStore({
      items: { [equippedItem.id]: equippedItem },
      characterInventories: { [characterId]: [equippedItem.id] },
    });
    mockUseInventoryStore.mockImplementation((selector) =>
      selector ? selector(mockStore) : mockStore
    );

    const { container } = render(inventoryList());

    expect(screen.getByText('Equipped')).toBeInTheDocument();
    expect(container.querySelector('.manuscript-inventory-item.is-equipped')).toBeInTheDocument();
  });

  test('toggles equip state for equippable items', async () => {
    const user = userEvent.setup();
    const item = createItem({
      id: 'item-eq',
      name: 'Steel Sword',
      categoryId: 'equipment',
      stackable: false,
      equipped: false,
    });
    const toggleEquipItem = jest.fn(() => ({ success: true, equipped: true }));

    const mockStore = createMockInventoryStore({
      items: { [item.id]: item },
      characterInventories: { [characterId]: [item.id] },
      toggleEquipItem,
    });
    mockUseInventoryStore.mockImplementation((selector) =>
      selector ? selector(mockStore) : mockStore
    );

    render(inventoryList());

    await user.click(screen.getByRole('button', { name: 'Equip Steel Sword' }));

    expect(toggleEquipItem).toHaveBeenCalledWith(characterId, 'item-eq');
  });

  test('hides the equip control for non-equippable items', () => {
    const potion = createItem({
      id: 'item-potion',
      name: 'Health Potion',
      categoryId: 'consumables',
      quantity: 3,
    });

    const mockStore = createMockInventoryStore({
      items: { [potion.id]: potion },
      characterInventories: { [characterId]: [potion.id] },
    });
    mockUseInventoryStore.mockImplementation((selector) =>
      selector ? selector(mockStore) : mockStore
    );

    render(inventoryList());

    expect(screen.queryByRole('button', { name: /Equip Health Potion/i })).not.toBeInTheDocument();
  });

  test('surfaces a block message when the store rejects an equip', async () => {
    const user = userEvent.setup();
    const item = createItem({
      id: 'item-personal',
      name: 'Lucky Charm',
      categoryId: 'personal',
      stackable: false,
      equipped: false,
    });
    const toggleEquipItem = jest.fn(() => ({
      success: false,
      equipped: false,
      error: { type: 'validation', title: 'Cannot Equip Item', message: 'That cannot be equipped.' },
    }));

    const mockStore = createMockInventoryStore({
      items: { [item.id]: item },
      characterInventories: { [characterId]: [item.id] },
      toggleEquipItem,
    });
    mockUseInventoryStore.mockImplementation((selector) =>
      selector ? selector(mockStore) : mockStore
    );

    render(inventoryList());

    await user.click(screen.getByRole('button', { name: 'Equip Lucky Charm' }));

    expect(await screen.findByText('That cannot be equipped.')).toBeInTheDocument();
  });
});
