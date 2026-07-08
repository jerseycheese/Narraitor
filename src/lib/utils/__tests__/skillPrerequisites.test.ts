import {
  getUnmetPrerequisites,
  formatUnmetPrerequisites,
} from '@/lib/utils/skillPrerequisites';
import { WorldAttribute } from '@/types/world.types';

const attributes: WorldAttribute[] = [
  {
    id: 'attr-str',
    worldId: 'world-1',
    name: 'Strength',
    description: 'Physical power',
    baseValue: 1,
    minValue: 1,
    maxValue: 10,
  },
  {
    id: 'attr-int',
    worldId: 'world-1',
    name: 'Intelligence',
    description: 'Mental ability',
    baseValue: 1,
    minValue: 1,
    maxValue: 10,
  },
];

describe('skillPrerequisites', () => {

  describe('getUnmetPrerequisites', () => {
    it('returns only the failing prerequisites with names and values', () => {
      const unmet = getUnmetPrerequisites(
        [
          { attributeId: 'attr-str', minValue: 5 },
          { attributeId: 'attr-int', minValue: 2 },
        ],
        [
          { attributeId: 'attr-str', value: 3 },
          { attributeId: 'attr-int', value: 4 },
        ],
        attributes
      );

      expect(unmet).toEqual([
        {
          attributeId: 'attr-str',
          attributeName: 'Strength',
          requiredValue: 5,
          currentValue: 3,
        },
      ]);
    });

    it('ignores prerequisites with non-positive minValue', () => {
      expect(
        getUnmetPrerequisites(
          [{ attributeId: 'attr-str', minValue: 0 }],
          [],
          attributes
        )
      ).toEqual([]);
    });

    it('ignores prerequisites that reference an attribute missing from the world', () => {
      const unmet = getUnmetPrerequisites(
        [{ attributeId: 'attr-deleted', minValue: 2 }],
        [],
        attributes
      );
      expect(unmet).toEqual([]);
    });

    it('falls back to a placeholder name when no world attributes are provided', () => {
      const unmet = getUnmetPrerequisites(
        [{ attributeId: 'attr-str', minValue: 2 }],
        []
      );
      expect(unmet[0].attributeName).toBe('Unknown attribute');
    });
  });

  describe('formatUnmetPrerequisites', () => {
    it('produces a readable requirement string', () => {
      const text = formatUnmetPrerequisites([
        {
          attributeId: 'attr-str',
          attributeName: 'Strength',
          requiredValue: 5,
          currentValue: 3,
        },
      ]);
      expect(text).toBe('Requires Strength 5 (you have 3)');
    });

    it('returns an empty string when nothing is unmet', () => {
      expect(formatUnmetPrerequisites([])).toBe('');
    });
  });
});
