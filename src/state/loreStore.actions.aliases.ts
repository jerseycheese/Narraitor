import type { EntityID } from '../types/common.types';
import {
  addAliasImpl,
  removeAliasImpl,
  setAliasesImpl,
  findEntityByAnyNameImpl,
  type AliasManagementContext,
} from './loreStore.aliases';
import type { SetState, GetState } from './loreStore.actions.types';

export const createLoreAliasActions = (_set: SetState, get: GetState) => ({
  addAlias: (id: EntityID, alias: string) => {
    const context: AliasManagementContext = {
      getFact: get().getById,
      updateFact: get().update,
      getFacts: get().getFacts,
    };
    addAliasImpl(id, alias, context);
  },

  removeAlias: (id: EntityID, alias: string) => {
    const context: AliasManagementContext = {
      getFact: get().getById,
      updateFact: get().update,
      getFacts: get().getFacts,
    };
    removeAliasImpl(id, alias, context);
  },

  setAliases: (id: EntityID, aliases: string[]) => {
    const context: AliasManagementContext = {
      getFact: get().getById,
      updateFact: get().update,
      getFacts: get().getFacts,
    };
    setAliasesImpl(id, aliases, context);
  },

  findEntityByAnyName: (name: string, worldId: EntityID) => {
    const context: AliasManagementContext = {
      getFact: get().getById,
      updateFact: get().update,
      getFacts: get().getFacts,
    };
    return findEntityByAnyNameImpl(name, worldId, context);
  },
});
