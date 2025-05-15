// Create mock functions
const mockGetItem = jest.fn().mockResolvedValue(null);
const mockSetItem = jest.fn().mockResolvedValue(undefined);
const mockRemoveItem = jest.fn().mockResolvedValue(undefined);
const mockInitialize = jest.fn().mockResolvedValue(undefined);

// Mock adapter instance
const mockAdapter = {
  initialize: mockInitialize,
  getItem: mockGetItem,
  setItem: mockSetItem,
  removeItem: mockRemoveItem
};

// Mock static create method
const mockCreate = jest.fn().mockResolvedValue(mockAdapter);

// Export necessary mock interfaces
const IndexedDBAdapter = jest.fn().mockImplementation(() => mockAdapter);
IndexedDBAdapter.create = mockCreate;

// Export for testing
IndexedDBAdapter.mockFunctions = {
  getItem: mockGetItem,
  setItem: mockSetItem,
  removeItem: mockRemoveItem,
  initialize: mockInitialize,
  create: mockCreate
};

console.log('[Mock] IndexedDBAdapter mock loaded');

module.exports = {
  IndexedDBAdapter
};
