import { useSceneStore } from '../sceneStore';

jest.mock('../persistence', () => {
  const entries = new Map<string, unknown>();
  return {
    createIndexedDBStorage: () => ({
      getItem: async (name: string) => entries.get(name) ?? null,
      setItem: async (name: string, value: unknown) => { entries.set(name, value); },
      removeItem: async (name: string) => { entries.delete(name); },
    }),
  };
});

describe('sceneStore', () => {
  beforeEach(() => {
    useSceneStore.setState({ scenes: {} });
  });

  it('keeps scene facts isolated by session and persists them across rehydration', async () => {
    const store = useSceneStore.getState();
    store.setLocation('session-1', 'Kitchen');
    store.setPresentNpcIds('session-1', ['npc-1']);
    store.recordBeat('session-1', { id: 'arrival', text: 'The bus arrived', turnIndex: 11 });
    store.setLocation('session-2', 'Council room');

    const storage = useSceneStore.persist.getOptions().storage!;
    const persisted = await storage.getItem('narraitor-scene-store');
    expect(persisted?.state).toEqual({
      scenes: {
        'session-1': {
          location: 'Kitchen',
          presentNpcIds: ['npc-1'],
          completedBeats: [{ id: 'arrival', text: 'The bus arrived', turnIndex: 11 }],
        },
        'session-2': { location: 'Council room', presentNpcIds: [], completedBeats: [] },
      },
    });

    useSceneStore.setState({ scenes: {} });
    await storage.setItem('narraitor-scene-store', persisted!);
    await useSceneStore.persist.rehydrate();
    expect(useSceneStore.getState().scenes).toEqual((persisted!.state as { scenes: unknown }).scenes);

    useSceneStore.getState().clearScene('session-1');
    expect(useSceneStore.getState().scenes['session-1']).toBeUndefined();
    expect(useSceneStore.getState().scenes['session-2']?.location).toBe('Council room');
  });
});
