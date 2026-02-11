import {
  getStableChoicesMaxHeight,
  getStableNarrativeMaxHeight,
} from '../layoutStability';

describe('layoutStability', () => {
  it('returns undefined until the session has narrative content', () => {
    expect(getStableNarrativeMaxHeight(0)).toBeUndefined();
    expect(getStableNarrativeMaxHeight(1)).toBe('500px');
  });

  it('keeps narrative height stable once gameplay is active', () => {
    expect(getStableNarrativeMaxHeight(2)).toBe('500px');
  });

  it('keeps choices height stable once gameplay is active', () => {
    expect(getStableChoicesMaxHeight(0)).toBeUndefined();
    expect(getStableChoicesMaxHeight(1)).toBe('500px');
    expect(getStableChoicesMaxHeight(2)).toBe('500px');
  });
});
