import { renderHook, act } from '@testing-library/react';
import { useCharacterCreationAutoSave } from '../useCharacterCreationAutoSave';

describe.skip('useCharacterCreationAutoSave', () => {
  const mockWorldId = 'world-123';
  const mockData = {
    currentStep: 1,
    worldId: mockWorldId,
    characterData: {
      name: 'Test Character',
      description: 'A test description',
      portraitPlaceholder: '',
      attributes: [],
      skills: [],
      background: {
        history: '',
        personality: '',
        goals: [],
        motivation: '',
      },
    },
    validation: {},
    pointPools: {
      attributes: { total: 20, spent: 0, remaining: 20 },
      skills: { total: 15, spent: 0, remaining: 15 },
    },
  };

  beforeEach(() => {
    sessionStorage.clear();
  });

  it('saves data to sessionStorage on handleFieldBlur', () => {
    const { result } = renderHook(() => useCharacterCreationAutoSave(mockWorldId));
    
    act(() => {
      result.current.setData(mockData);
    });
    
    act(() => {
      result.current.handleFieldBlur();
    });
    
    const savedData = sessionStorage.getItem(`character-creation-${mockWorldId}`);
    expect(savedData).toBeTruthy();
    expect(JSON.parse(savedData!)).toEqual(mockData);
  });

  it('restores data from sessionStorage on mount', () => {
    sessionStorage.setItem(
      `character-creation-${mockWorldId}`,
      JSON.stringify(mockData)
    );
    
    const { result } = renderHook(() => useCharacterCreationAutoSave(mockWorldId));
    
    expect(result.current.data).toEqual(mockData);
  });

  it('clears sessionStorage on clearAutoSave', () => {
    sessionStorage.setItem(
      `character-creation-${mockWorldId}`,
      JSON.stringify(mockData)
    );
    
    const { result } = renderHook(() => useCharacterCreationAutoSave(mockWorldId));
    
    act(() => {
      result.current.clearAutoSave();
    });
    
    const savedData = sessionStorage.getItem(`character-creation-${mockWorldId}`);
    expect(savedData).toBeNull();
  });

  it('handles invalid JSON gracefully when restoring', () => {
    sessionStorage.setItem(
      `character-creation-${mockWorldId}`,
      'invalid json'
    );
    
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    
    const { result } = renderHook(() => useCharacterCreationAutoSave(mockWorldId));
    
    expect(result.current.data).toBeUndefined();
    expect(consoleError).toHaveBeenCalledWith(
      'Failed to restore character creation data',
      expect.any(Error)
    );
    
    consoleError.mockRestore();
  });

  it('does not save if data is undefined', () => {
    const { result } = renderHook(() => useCharacterCreationAutoSave(mockWorldId));
    
    act(() => {
      result.current.handleFieldBlur();
    });
    
    const savedData = sessionStorage.getItem(`character-creation-${mockWorldId}`);
    expect(savedData).toBeNull();
  });

  it('updates save key when worldId changes', () => {
    const { result, rerender } = renderHook(
      ({ worldId }) => useCharacterCreationAutoSave(worldId),
      { initialProps: { worldId: mockWorldId } }
    );
    
    act(() => {
      result.current.setData(mockData);
    });
    
    act(() => {
      result.current.handleFieldBlur();
    });
    
    expect(sessionStorage.getItem(`character-creation-${mockWorldId}`)).toBeTruthy();
    
    // Change worldId
    const newWorldId = 'world-456';
    rerender({ worldId: newWorldId });
    
    // Should restore from new key (which doesn't exist)
    expect(result.current.data).toBeUndefined();
    
    // Save to new key
    const newData = { ...mockData, worldId: newWorldId };
    act(() => {
      result.current.setData(newData);
    });
    
    act(() => {
      result.current.handleFieldBlur();
    });
    
    expect(sessionStorage.getItem(`character-creation-${newWorldId}`)).toBeTruthy();
    expect(sessionStorage.getItem(`character-creation-${mockWorldId}`)).toBeTruthy(); // Old data still exists
  });
});
