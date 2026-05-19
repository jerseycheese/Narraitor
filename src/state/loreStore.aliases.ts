import type { EntityID } from '../types/common.types';
import type { LoreFact } from '../types/lore.types';
import { normalizeText, NORM_NAME } from '../lib/utils/textNormalization';
import { logger } from '@/lib/utils/logger';
import type { LoreStore } from './loreStore';

type SetState = (
  partial: Partial<LoreStore> | ((state: LoreStore) => Partial<LoreStore>)
) => void;
type GetState = () => LoreStore;

const isAliasable = (category: LoreFact['category']) =>
  category === 'characters' || category === 'locations';

export const createLoreAliasActions = (_set: SetState, get: GetState) => ({
  addAlias: (id: EntityID, alias: string) => {
    const fact = get().getById(id);
    if (!fact) return;

    if (!isAliasable(fact.category)) {
      logger.warn('[LoreStore] Aliases only supported for characters/locations', {
        category: fact.category,
        factId: id,
      });
      return;
    }

    const trimmedAlias = alias.trim();
    if (!trimmedAlias) return;

    const currentAliases = fact.aliases || [];
    if (currentAliases.includes(trimmedAlias)) return;

    get().update(id, { aliases: [...currentAliases, trimmedAlias] });
  },

  removeAlias: (id: EntityID, alias: string) => {
    const fact = get().getById(id);
    if (!fact) return;

    const updatedAliases = (fact.aliases || []).filter((a) => a !== alias);
    get().update(id, { aliases: updatedAliases });
  },

  setAliases: (id: EntityID, aliases: string[]) => {
    const fact = get().getById(id);
    if (!fact) return;

    if (!isAliasable(fact.category)) {
      logger.warn('[LoreStore] Aliases only supported for characters/locations', {
        category: fact.category,
        factId: id,
      });
      return;
    }

    const cleanedAliases = aliases
      .map((a) => a.trim())
      .filter((a) => a.length > 0)
      .filter((alias, index, self) => self.indexOf(alias) === index);

    get().update(id, { aliases: cleanedAliases });
  },

  findEntityByAnyName: (name: string, worldId: EntityID): LoreFact | null => {
    const facts = get().getFacts({ worldId });
    const normalizedName = normalizeText(name, NORM_NAME).toLowerCase();

    return (
      facts.find((fact) => {
        const normalizedValue = normalizeText(fact.value, NORM_NAME).toLowerCase();
        const normalizedAliases =
          fact.aliases?.map((a) => normalizeText(a, NORM_NAME).toLowerCase()) || [];
        return (
          normalizedValue === normalizedName ||
          normalizedAliases.includes(normalizedName)
        );
      }) || null
    );
  },
});
