import { render, screen, fireEvent } from '@testing-library/react';
import PlayPage from '../page';

const pushMock = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: (...args: unknown[]) => pushMock(...args) }),
  useParams: () => ({ id: 'world-1' }),
  useSearchParams: () => new URLSearchParams(),
  notFound: jest.fn(),
}));

jest.mock('@/components/GameSession/GameSession', () => {
  return function DummyGameSession({
    worldId,
    onBack,
    onStartNew,
  }: {
    worldId: string;
    onBack?: () => void;
    onStartNew?: () => void;
  }) {
    return (
      <div>
        <div data-testid="mock-game-session">Game Session for {worldId}</div>
        <button type="button" data-testid="mock-back-btn" onClick={onBack}>
          Mock Back
        </button>
        <button type="button" data-testid="mock-start-new-btn" onClick={onStartNew}>
          Mock Start New
        </button>
      </div>
    );
  };
});

const sessionState = { id: 'session-1' };
const segmentsBySession: Record<string, string[]> = {};

jest.mock('@/state/sessionStore', () => ({
  useSessionStore: (selector: (state: typeof sessionState) => unknown) => selector(sessionState),
}));

jest.mock('@/state/narrativeStore', () => ({
  useNarrativeStore: () => ({
    getSessionSegments: (sessionId: string) => segmentsBySession[sessionId] ?? [],
  }),
}));

describe('PlayPage exit confirmation (#268)', () => {
  beforeEach(() => {
    pushMock.mockClear();
    sessionState.id = 'session-1';
    for (const key of Object.keys(segmentsBySession)) delete segmentsBySession[key];
  });

  // GameSession (which renders the mock back button) loads via next/dynamic,
  // so await its appearance before interacting.
  test('routes directly back when there is no narrative progress to abandon', async () => {
    render(<PlayPage />);

    fireEvent.click(await screen.findByTestId('mock-back-btn'));

    expect(pushMock).toHaveBeenCalledWith('/worlds/world-1');
    expect(screen.queryByText('Leave the Story?')).not.toBeInTheDocument();
  });

  test('prompts for confirmation when there is narrative progress', async () => {
    segmentsBySession['session-1'] = ['seg-a', 'seg-b'];
    render(<PlayPage />);

    fireEvent.click(await screen.findByTestId('mock-back-btn'));

    expect(pushMock).not.toHaveBeenCalled();
    expect(screen.getByText('Leave the Story?')).toBeInTheDocument();
  });

  test('confirming the exit dialog navigates back to the world page', async () => {
    segmentsBySession['session-1'] = ['seg-a'];
    render(<PlayPage />);

    fireEvent.click(await screen.findByTestId('mock-back-btn'));
    fireEvent.click(screen.getByRole('button', { name: /leave story/i }));

    expect(pushMock).toHaveBeenCalledWith('/worlds/world-1');
  });

  test('cancelling the exit dialog keeps the player on the page', async () => {
    segmentsBySession['session-1'] = ['seg-a'];
    render(<PlayPage />);

    fireEvent.click(await screen.findByTestId('mock-back-btn'));
    fireEvent.click(screen.getByRole('button', { name: /keep playing/i }));

    expect(pushMock).not.toHaveBeenCalled();
    expect(screen.queryByText('Leave the Story?')).not.toBeInTheDocument();
  });
});
