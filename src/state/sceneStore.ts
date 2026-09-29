import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { EntityID } from '@/types/common.types';
import type { CompletedSceneBeat, SceneState } from '@/types/scene.types';
import { createIndexedDBStorage } from './persistence';

interface SceneStore {
  scenes: Record<EntityID, SceneState>;
  setLocation: (sessionId: EntityID, location: string | null) => void;
  setPresentNpcIds: (sessionId: EntityID, npcIds: EntityID[]) => void;
  recordBeat: (sessionId: EntityID, beat: CompletedSceneBeat) => void;
  clearScene: (sessionId: EntityID) => void;
}

const emptyScene = (): SceneState => ({
  location: null,
  presentNpcIds: [],
  completedBeats: [],
});

export const useSceneStore = create<SceneStore>()(
  persist(
    (set) => ({
      scenes: {},
      setLocation: (sessionId, location) => set((state) => ({
        scenes: {
          ...state.scenes,
          [sessionId]: { ...(state.scenes[sessionId] ?? emptyScene()), location },
        },
      })),
      setPresentNpcIds: (sessionId, npcIds) => set((state) => ({
        scenes: {
          ...state.scenes,
          [sessionId]: { ...(state.scenes[sessionId] ?? emptyScene()), presentNpcIds: [...npcIds] },
        },
      })),
      recordBeat: (sessionId, beat) => set((state) => {
        const scene = state.scenes[sessionId] ?? emptyScene();
        return {
          scenes: {
            ...state.scenes,
            [sessionId]: { ...scene, completedBeats: [...scene.completedBeats, { ...beat }] },
          },
        };
      }),
      clearScene: (sessionId) => set((state) => {
        const scenes = { ...state.scenes };
        delete scenes[sessionId];
        return { scenes };
      }),
    }),
    {
      name: 'narraitor-scene-store',
      storage: createIndexedDBStorage(),
      partialize: (state) => ({ scenes: state.scenes }),
    }
  )
);

/** Waits for persisted scene facts before a resolver or decision reads them. */
export async function waitForSceneStoreHydration(): Promise<void> {
  if (!useSceneStore.persist.hasHydrated()) {
    await useSceneStore.persist.rehydrate();
  }
}
