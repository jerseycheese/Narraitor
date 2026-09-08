import { renderHook, act } from '@testing-library/react';
import { useWorldCreationAutoSave, DRAFT_STORAGE_KEY } from '../useWorldCreationAutoSave';

describe('useWorldCreationAutoSave', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('initializes with default state when no saved draft exists', () => {
    const { result } = renderHook(() => useWorldCreationAutoSave());

    // Advance initial restoration timers
    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(result.current.hasRecoveryData).toBe(false);
    expect(result.current.recoveryPreview).toBeUndefined();
    expect(result.current.hasCurrentData).toBe(false);
    expect(result.current.saveStatus).toBe('idle');
  });

  it('restores draft data and generates preview on mount if localStorage has saved draft', () => {
    const mockDraft = {
      currentStep: 2,
      worldData: {
        name: 'Aethelgard',
        genre: 'Fantasy',
        description: 'A grand realm of ancient magic and soaring dragons.',
        attributes: [
          { name: 'Might', value: 5 },
          { name: 'Wits', value: 6 },
        ],
        skills: [{ name: 'Arcana', value: 3 }],
      },
      lastSaved: '2026-09-07T20:00:00.000Z',
    };

    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(mockDraft));

    const { result } = renderHook(() => useWorldCreationAutoSave());

    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(result.current.hasRecoveryData).toBe(true);
    expect(result.current.recoveryPreview).toEqual({
      name: 'Aethelgard',
      genre: 'Fantasy',
      description: 'A grand realm of ancient magic and soaring dragons.',
      currentStep: 2,
      lastSaved: '2026-09-07T20:00:00.000Z',
      hasAttributes: true,
      attributeCount: 2,
      hasSkills: true,
      skillCount: 1,
    });
    expect(result.current.data?.worldData.name).toBe('Aethelgard');
  });

  it('debounces writing data to localStorage (300ms)', () => {
    const { result } = renderHook(() => useWorldCreationAutoSave());

    act(() => {
      jest.advanceTimersByTime(100);
    });

    const update1 = {
      currentStep: 0,
      worldData: { name: 'Draft World 1' },
    };

    act(() => {
      result.current.setData(update1);
    });

    // Save status is saving before 300ms
    expect(result.current.saveStatus).toBe('saving');
    expect(localStorage.getItem(DRAFT_STORAGE_KEY)).toBeNull();

    // Advance 200ms (not yet 300ms)
    act(() => {
      jest.advanceTimersByTime(200);
    });
    expect(localStorage.getItem(DRAFT_STORAGE_KEY)).toBeNull();

    // Advance remaining 100ms
    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(result.current.saveStatus).toBe('saved');
    const stored = JSON.parse(localStorage.getItem(DRAFT_STORAGE_KEY) || '{}');
    expect(stored.worldData.name).toBe('Draft World 1');
  });

  it('clears draft from localStorage and resets state on clearAutoSave', () => {
    const mockDraft = {
      currentStep: 1,
      worldData: { name: 'World to Clear' },
      lastSaved: '2026-09-07T20:00:00.000Z',
    };
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(mockDraft));

    const { result } = renderHook(() => useWorldCreationAutoSave());

    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(result.current.hasRecoveryData).toBe(true);

    act(() => {
      result.current.clearAutoSave();
    });

    expect(localStorage.getItem(DRAFT_STORAGE_KEY)).toBeNull();
    expect(result.current.hasRecoveryData).toBe(false);
    expect(result.current.recoveryPreview).toBeUndefined();
    expect(result.current.data).toBeUndefined();
    expect(result.current.saveStatus).toBe('idle');
  });

  it('handles corrupted localStorage JSON gracefully', () => {
    localStorage.setItem(DRAFT_STORAGE_KEY, 'invalid-json-data');

    const { result } = renderHook(() => useWorldCreationAutoSave());

    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(result.current.hasRecoveryData).toBe(false);
    expect(result.current.recoveryPreview).toBeUndefined();
  });
});
