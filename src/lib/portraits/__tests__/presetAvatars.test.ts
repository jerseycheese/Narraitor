import {
  PRESET_AVATARS,
  PRESET_AVATAR_CATEGORIES,
  searchPresetAvatars,
} from '../presetAvatars';

describe('presetAvatars', () => {
  it('offers at least 20 avatars across at least three categories', () => {
    expect(PRESET_AVATARS.length).toBeGreaterThanOrEqual(20);

    const usedCategories = new Set(PRESET_AVATARS.map((avatar) => avatar.category));
    expect(usedCategories.size).toBeGreaterThanOrEqual(3);
  });

  it('gives every avatar a unique id and an inline SVG data URI', () => {
    const ids = PRESET_AVATARS.map((avatar) => avatar.id);
    expect(new Set(ids).size).toBe(ids.length);

    PRESET_AVATARS.forEach((avatar) => {
      expect(avatar.url.startsWith('data:image/svg+xml')).toBe(true);
      expect(avatar.name.length).toBeGreaterThan(0);
    });
  });

  it('only uses categories that are declared in the category list', () => {
    const declared = new Set(PRESET_AVATAR_CATEGORIES.map((category) => category.id));
    PRESET_AVATARS.forEach((avatar) => {
      expect(declared.has(avatar.category)).toBe(true);
    });
  });

  it('filters by category', () => {
    const fantasy = searchPresetAvatars('', 'fantasy');
    expect(fantasy.length).toBeGreaterThan(0);
    expect(fantasy.every((avatar) => avatar.category === 'fantasy')).toBe(true);
  });

  it('matches a search term against name and keywords, ignoring case', () => {
    const first = PRESET_AVATARS[0];
    const byName = searchPresetAvatars(first.name.toUpperCase(), 'all');
    expect(byName).toContainEqual(first);

    expect(searchPresetAvatars('zzzznotathing', 'all')).toHaveLength(0);
  });
});
