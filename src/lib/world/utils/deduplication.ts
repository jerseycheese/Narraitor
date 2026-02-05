import { EntityID, ISODateString } from '@/types/common.types';
import { CharacterThreadReference } from '@/types/world-state.types';
import { getTimestamp } from '@/lib/utils/timestamp';

export const compareTimestamps = (a: ISODateString, b: ISODateString): number =>
  a.localeCompare(b);

export const dedupeStrings = (values: Array<string | null | undefined>): string[] => {
  const result: string[] = [];
  const seen = new Set<string>();

  values.forEach((raw) => {
    if (!raw) {
      return;
    }
    const value = raw.trim();
    if (!value) {
      return;
    }
    const key = value.toLowerCase();
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    result.push(value);
  });

  return result;
};

export const dedupeEntityIds = (values: EntityID[]): EntityID[] => {
  const seen = new Set<EntityID>();
  const result: EntityID[] = [];

  values.forEach((id) => {
    if (!id || seen.has(id)) {
      return;
    }
    seen.add(id);
    result.push(id);
  });

  return result;
};

export const dedupeThreadReferences = (
  references: CharacterThreadReference[],
): CharacterThreadReference[] => {
  const map = new Map<string, CharacterThreadReference>();

  references.forEach((reference) => {
    if (!reference.characterId) {
      return;
    }

    const summary = reference.summary?.trim();
    if (!summary) {
      return;
    }

    const lastReferencedAt = reference.lastReferencedAt ?? getTimestamp();
    const key = `${reference.characterId}|${summary.toLowerCase()}`;
    const existing = map.get(key);

    if (!existing || compareTimestamps(lastReferencedAt, existing.lastReferencedAt) >= 0) {
      map.set(key, {
        ...reference,
        summary,
        lastReferencedAt,
      });
    }
  });

  return Array.from(map.values()).sort((a, b) => compareTimestamps(b.lastReferencedAt, a.lastReferencedAt));
};
