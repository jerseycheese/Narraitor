import { renderHook, act } from '@testing-library/react';
import { useDraftAutoSave } from '../useDraftAutoSave';

interface TestDraft {
  name: string;
  lastSaved?: string;
}

const STORAGE_KEY = 'test-draft';

function isValidTestDraft(value: unknown): value is TestDraft {
  return !!value && typeof value === 'object' && typeof (value as TestDraft).name === 'string';
}

function renderDraftAutoSave() {
  return renderHook(() =>
    useDraftAutoSave<TestDraft, { name: string }>({
      storageKey: STORAGE_KEY,
      analyzeRecovery: (data) => ({ name: data.name }),
      hasCurrentData: (data) => !!data?.name,
      isValidDraft: isValidTestDraft,
    })
  );
}

describe('useDraftAutoSave', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('initializes with no recovery data when nothing is saved', () => {
    const { result } = renderDraftAutoSave();

    expect(result.current.hasRecoveryData).toBe(false);
    expect(result.current.recoveryPreview).toBeUndefined();
    expect(result.current.isLoaded).toBe(true);
  });

  it('saves and restores a draft round trip', () => {
    const { result } = renderDraftAutoSave();

    act(() => {
      result.current.setData({ name: 'Draft One' });
    });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(result.current.saveStatus).toBe('saved');
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    expect(stored.name).toBe('Draft One');

    // A fresh mount should restore what was saved
    const { result: restored } = renderDraftAutoSave();

    expect(restored.current.hasRecoveryData).toBe(true);
    expect(restored.current.recoveryPreview).toEqual({ name: 'Draft One' });
    expect(restored.current.data?.name).toBe('Draft One');
  });

  it('discards a corrupt draft (malformed JSON) instead of surfacing it', () => {
    localStorage.setItem(STORAGE_KEY, 'not-valid-json');

    const { result } = renderDraftAutoSave();

    expect(result.current.hasRecoveryData).toBe(false);
    expect(result.current.recoveryPreview).toBeUndefined();
    expect(result.current.data).toBeUndefined();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('discards a corrupt draft (wrong shape) instead of surfacing it', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ unrelated: true }));

    const { result } = renderDraftAutoSave();

    expect(result.current.hasRecoveryData).toBe(false);
    expect(result.current.recoveryPreview).toBeUndefined();
    expect(result.current.data).toBeUndefined();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('clears the draft from storage and resets state on clearAutoSave', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ name: 'To Clear' }));

    const { result } = renderDraftAutoSave();
    expect(result.current.hasRecoveryData).toBe(true);

    act(() => {
      result.current.clearAutoSave();
    });

    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(result.current.hasRecoveryData).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(result.current.saveStatus).toBe('idle');
  });
});
