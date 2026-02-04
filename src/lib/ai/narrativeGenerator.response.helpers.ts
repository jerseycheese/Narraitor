import { useWorldStore } from '@/state/worldStore';
import { safeTrim } from '@/lib/utils';
import type { ItemLossReason } from '@/types/narrative.types';

export const normalizeId = (id?: string | null): string | undefined => {
  if (!id || typeof id !== 'string') {
    return undefined;
  }

  const trimmed = safeTrim(id);
  return trimmed.length > 0 ? trimmed : undefined;
};

export const normalizeCharacterIds = (ids?: unknown): string[] => {
  if (!Array.isArray(ids)) {
    return [];
  }

  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const value of ids) {
    if (typeof value !== 'string') {
      continue;
    }

    const normalizedId = normalizeId(value);
    if (!normalizedId) {
      continue;
    }

    const canonical = normalizedId.toLowerCase();
    if (seen.has(canonical)) {
      continue;
    }

    seen.add(canonical);
    normalized.push(normalizedId);
  }

  return normalized;
};

export const getWorldGenre = (): string | null => {
  try {
    const { worlds, currentWorldId } = useWorldStore.getState();
    const world = worlds[currentWorldId || ''];
    return world?.genre?.toLowerCase() || null;
  } catch {
    return null;
  }
};

export const validateMood = (
  mood?: string
):
  | 'neutral'
  | 'tense'
  | 'mysterious'
  | 'relaxed'
  | 'action'
  | 'emotional'
  | undefined => {
  const validMoods = [
    'neutral',
    'tense',
    'mysterious',
    'relaxed',
    'action',
    'emotional',
  ];
  return validMoods.includes(mood || '')
    ? (mood as
        | 'neutral'
        | 'tense'
        | 'mysterious'
        | 'relaxed'
        | 'action'
        | 'emotional')
    : undefined;
};

export const validateLossReason = (
  reason?: string
): ItemLossReason | undefined => {
  const validReasons: ItemLossReason[] = [
    'consumed',
    'delivered',
    'stolen',
    'dropped',
    'destroyed',
    'sold',
    'gifted',
    'sacrificed',
    'unknown',
  ];

  return validReasons.includes(reason as ItemLossReason)
    ? (reason as ItemLossReason)
    : undefined;
};

export const getMoodForGenre = (
  genre?: string | null
): 'neutral' | 'tense' | 'mysterious' | 'relaxed' | 'action' | 'emotional' => {
  if (!genre) return 'neutral';

  switch (genre.toLowerCase()) {
    case 'horror':
      return 'tense';
    case 'fantasy':
      return 'mysterious';
    case 'sci-fi':
    case 'science fiction':
      return 'mysterious';
    case 'western':
      return 'tense';
    case 'cyberpunk':
      return 'tense';
    case 'post-apocalyptic':
      return 'tense';
    case 'steampunk':
      return 'mysterious';
    default:
      return 'neutral';
  }
};

export const getLocationForGenre = (genre?: string | null): string => {
  if (!genre) return 'Starting Location';

  switch (genre.toLowerCase()) {
    case 'fantasy':
      return 'Enchanted Forest';
    case 'sci-fi':
    case 'science fiction':
      return 'Space Station';
    case 'western':
      return 'Frontier Town';
    case 'horror':
      return 'Abandoned Mansion';
    case 'cyberpunk':
      return 'Neon City';
    case 'post-apocalyptic':
      return 'Ruins';
    case 'steampunk':
      return 'Victorian Metropolis';
    default:
      return 'Starting Location';
  }
};
