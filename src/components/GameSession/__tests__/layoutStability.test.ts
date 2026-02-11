import { getStableNarrativeMaxHeight } from '../layoutStability';

describe('layoutStability', () => {
  it('returns undefined until the session has multiple segments', () => {
    expect(getStableNarrativeMaxHeight(0, false)).toBeUndefined();
    expect(getStableNarrativeMaxHeight(1, false)).toBe('500px');
    expect(getStableNarrativeMaxHeight(1, true)).toBe('500px');
  });

  it('keeps narrative height stable when suggested actions are expanded', () => {
    expect(getStableNarrativeMaxHeight(2, false)).toBe('500px');
    expect(getStableNarrativeMaxHeight(2, true)).toBe('500px');
  });
});
