import {
  useUIPreferencesStore,
  DEFAULT_NARRATIVE_TEXT_SIZE,
} from '../uiPreferencesStore';

describe('uiPreferencesStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useUIPreferencesStore.setState({
      narrativeTextSize: DEFAULT_NARRATIVE_TEXT_SIZE,
    });
  });

  it('defaults narrative text size to medium', () => {
    expect(useUIPreferencesStore.getState().narrativeTextSize).toBe('medium');
  });

  it('updates the narrative text size', () => {
    useUIPreferencesStore.getState().setNarrativeTextSize('large');
    expect(useUIPreferencesStore.getState().narrativeTextSize).toBe('large');
  });

  it('persists the narrative text size to localStorage', () => {
    useUIPreferencesStore.getState().setNarrativeTextSize('small');
    const persisted = localStorage.getItem('narraitor-ui-preferences-store');
    expect(persisted).toContain('small');
  });
});
