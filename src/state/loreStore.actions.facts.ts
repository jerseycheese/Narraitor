import type { SetState, GetState } from './loreStore.actions.types';
import { createLoreFactCoreActions } from './loreStore.actions.facts.core';
import { createLoreFactValidationActions } from './loreStore.actions.facts.validation';
import { createLoreFactMaintenanceActions } from './loreStore.actions.facts.maintenance';
import { createLoreFactDeduplicationActions } from './loreStore.actions.facts.dedupe';

export const createLoreFactActions = (set: SetState, get: GetState) => ({
  ...createLoreFactCoreActions(set, get),
  ...createLoreFactValidationActions(set, get),
  ...createLoreFactMaintenanceActions(set, get),
  ...createLoreFactDeduplicationActions(set, get),
});
