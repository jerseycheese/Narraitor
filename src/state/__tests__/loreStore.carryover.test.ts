import { useLoreStore } from '../loreStore';
import { isFeatureEnabled } from '@/lib/featureFlags';

jest.mock('@/lib/featureFlags');
const mockIsFeatureEnabled = isFeatureEnabled as jest.MockedFunction<
  typeof isFeatureEnabled
>;

const WORLD = 'world-1';
const addPrivate = (key: string, value: string) =>
  useLoreStore.getState().addFact(key, value, 'rules', 'narrative', WORLD, 'session-1');

describe('LoreStore - chapter carryover', () => {
  beforeEach(() => {
    useLoreStore.getState().reset();
    mockIsFeatureEnabled.mockReturnValue(true);
  });

  test('promotes the top used facts so a new session sees them; the rest stay private', () => {
    const top = addPrivate('door', 'The cellar door is barred');
    const middle = addPrivate('time', 'It is dusk');
    const bottom = addPrivate('cup', 'The cup is tin');
    const store = useLoreStore.getState();
    store.recordLoreUsage({ worldId: WORLD, sessionId: 'session-1', factIds: [top, top, middle] });

    const promoted = store.promoteChapterLore(WORLD, 'session-1', 2);

    expect(promoted).toEqual([top, middle]);
    const nextSession = useLoreStore.getState().getLoreContext(WORLD, 'session-2');
    expect(nextSession.factCount).toBe(2);
    expect(useLoreStore.getState().getById(bottom)?.visibility).toBe('session-private');
  });

  test('does nothing when CHAPTERS is off', () => {
    mockIsFeatureEnabled.mockReturnValue(false);
    addPrivate('door', 'The cellar door is barred');

    expect(useLoreStore.getState().promoteChapterLore(WORLD, 'session-1')).toEqual([]);
    expect(useLoreStore.getState().getLoreContext(WORLD, 'session-2').factCount).toBe(0);
  });
});
