import type { LoreStore } from './loreStore';

export type SetState = (
  partial:
    | Partial<LoreStore>
    | ((state: LoreStore) => Partial<LoreStore>)
) => void;

export type GetState = () => LoreStore;
