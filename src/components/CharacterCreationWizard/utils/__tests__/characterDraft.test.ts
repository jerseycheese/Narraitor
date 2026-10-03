import { renderHook, act } from '@testing-library/react';
import { useDraftAutoSave } from '@/hooks/useDraftAutoSave';
import {
  CharacterCreationDraft,
  CharacterDraftRecoveryPreview,
  getCharacterDraftStorageKey,
  isValidCharacterDraft,
  analyzeCharacterDraftRecovery,
  hasCharacterDraftData,
} from '../characterDraft';

const WORLD_ID = 'test-world-1';
const STORAGE_KEY = getCharacterDraftStorageKey(WORLD_ID);

function renderCharacterDraftAutoSave() {
  return renderHook(() =>
    useDraftAutoSave<CharacterCreationDraft, CharacterDraftRecoveryPreview>({
      storageKey: STORAGE_KEY,
      analyzeRecovery: analyzeCharacterDraftRecovery,
      hasCurrentData: hasCharacterDraftData,
      isValidDraft: isValidCharacterDraft,
    })
  );
}

describe('characterDraft auto-save and recovery', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('round-trips a valid draft through save and load with no casts', () => {
    const { result } = renderCharacterDraftAutoSave();

    const validDraft: CharacterCreationDraft = {
      worldId: WORLD_ID,
      currentStep: 1,
      characterData: {
        name: 'Peren Ashford',
        description: 'A courageous adventurer',
        attributes: [
          {
            attributeId: 'strength',
            name: 'Strength',
            value: 8,
            minValue: 1,
            maxValue: 10,
          },
        ],
        skills: [
          {
            skillId: 'athletics',
            name: 'Athletics',
            level: 3,
            minLevel: 0,
            maxLevel: 5,
            isSelected: true,
          },
        ],
        background: {
          history: 'Grew up in the forest',
          personality: 'Brave',
          goals: ['Explore ruins'],
          motivation: 'Discovery',
        },
      },
      validation: {
        0: { valid: true, errors: [], touched: true },
      },
    };

    act(() => {
      result.current.setData(validDraft);
    });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(result.current.saveStatus).toBe('saved');

    // Fresh hook mount restores the draft with its real type and no casts
    const { result: restored } = renderCharacterDraftAutoSave();

    expect(restored.current.hasRecoveryData).toBe(true);
    expect(restored.current.data?.worldId).toBe(WORLD_ID);
    expect(restored.current.data?.currentStep).toBe(1);
    expect(restored.current.data?.characterData.name).toBe('Peren Ashford');
    expect(restored.current.data?.characterData.description).toBe('A courageous adventurer');
    expect(restored.current.data?.characterData.attributes?.[0].value).toBe(8);
    expect(restored.current.data?.characterData.skills?.[0].isSelected).toBe(true);
    expect(restored.current.data?.characterData.background?.personality).toBe('Brave');
    expect(restored.current.data?.validation?.[0].valid).toBe(true);
  });

  it('safely discards a malformed stored draft', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ malformed: true }));

    const { result } = renderCharacterDraftAutoSave();

    expect(result.current.hasRecoveryData).toBe(false);
    expect(result.current.recoveryPreview).toBeUndefined();
    expect(result.current.data).toBeUndefined();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
