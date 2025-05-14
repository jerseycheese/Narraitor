import { testUtils } from '../../../../src/utils/testUtils';
import { WorldStore } from '../../../../src/state/worldStore';

// Mock the worldStore module
jest.mock('../../../../src/state/worldStore', () => ({
  worldStore: {
    getState: jest.fn(),
  },
}));

// Import the mocked worldStore
import { worldStore } from '../../../../src/state/worldStore';

describe('Test Utilities', () => {
  let mockStore: WorldStore;

  beforeEach(() => {
    mockStore = {
      worlds: {},
      currentWorldId: null,
      error: null,
      loading: false,
      createWorld: jest.fn(),
      updateWorld: jest.fn(),
      deleteWorld: jest.fn(),
      setCurrentWorld: jest.fn(),
      fetchWorlds: jest.fn(),
      addAttribute: jest.fn(),
      updateAttribute: jest.fn(),
      removeAttribute: jest.fn(),
      addSkill: jest.fn(),
      updateSkill: jest.fn(),
      removeSkill: jest.fn(),
      updateSettings: jest.fn(),
      reset: jest.fn(),
      setError: jest.fn(),
      clearError: jest.fn(),
      setLoading: jest.fn(),
    };

    (worldStore.getState as jest.Mock).mockReturnValue(mockStore);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('addTestWorlds', () => {
    it('should add test worlds to the store', async () => {
      await testUtils.addTestWorlds();

      expect(mockStore.createWorld).toHaveBeenCalledTimes(2);

      const firstCall = (mockStore.createWorld as jest.Mock).mock.calls[0][0];
      expect(firstCall).toMatchObject({
        name: 'Test Medieval Kingdom',
        theme: 'fantasy',
        httpGenerator: 'anthropic',
      });

      const secondCall = (mockStore.createWorld as jest.Mock).mock.calls[1][0];
      expect(secondCall).toMatchObject({
        name: 'Test Space Colony',
        theme: 'scifi',
        httpGenerator: 'google',
      });
    });
  });

  describe('clearWorlds', () => {
    it('should delete all worlds from the store', async () => {
      // Mock the worlds in the mock store for this test
      mockStore.worlds = {
        '1': { id: '1', name: 'World 1', theme: 'fantasy', createdAt: '', updatedAt: '', attributes: [], skills: [], settings: { maxAttributes: 10, maxSkills: 10, attributePointPool: 100, skillPointPool: 100 } },
        '2': { id: '2', name: 'World 2', theme: 'scifi', createdAt: '', updatedAt: '', attributes: [], skills: [], settings: { maxAttributes: 10, maxSkills: 10, attributePointPool: 100, skillPointPool: 100 } },
      };

      await testUtils.clearWorlds();

      expect(mockStore.deleteWorld).toHaveBeenCalledTimes(2);
      expect(mockStore.deleteWorld).toHaveBeenCalledWith('1');
      expect(mockStore.deleteWorld).toHaveBeenCalledWith('2');
    });

    it('should handle empty worlds array', async () => {
      mockStore.worlds = {}; // Ensure worlds is an empty object

      await testUtils.clearWorlds();

      expect(mockStore.deleteWorld).not.toHaveBeenCalled();
    });
  });

  describe('setLoadingState', () => {
    it('should set the loading state to true', async () => {
      await testUtils.setLoadingState(true);

      expect(mockStore.setLoading).toHaveBeenCalledWith(true);
    });

    it('should set the loading state to false', async () => {
      await testUtils.setLoadingState(false);

      expect(mockStore.setLoading).toHaveBeenCalledWith(false);
    });
  });

  describe('setErrorState', () => {
    it('should set the error state', async () => {
      await testUtils.setErrorState('Test error message');

      expect(mockStore.setError).toHaveBeenCalledWith('Test error message');
    });

    it('should clear the error state', async () => {
      await testUtils.setErrorState(null);

      expect(mockStore.setError).toHaveBeenCalledWith(null);
    });
  });
});
