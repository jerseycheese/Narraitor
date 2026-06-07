import React from 'react';
import { render, screen } from '@testing-library/react';
import { WorkshopContextualHeader } from '../WorkshopContextualHeader';

const mockWorldStore = {
  worlds: {} as Record<string, { id: string; name: string; genre: string }>,
  currentWorldId: null as string | null,
  setCurrentWorld: jest.fn(),
};

const mockSessionStore = {
  currentCharacterId: null,
  setCurrentCharacter: jest.fn(),
};

let mockPathname = '/characters';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), pathname: mockPathname }),
  usePathname: () => mockPathname,
}));

jest.mock('@/state/worldStore', () => ({
  useWorldStore: (selector: (s: typeof mockWorldStore) => unknown) =>
    selector ? selector(mockWorldStore) : mockWorldStore,
}));

jest.mock('@/state/sessionStore', () => ({
  useSessionStore: (selector: (s: typeof mockSessionStore) => unknown) =>
    selector ? selector(mockSessionStore) : mockSessionStore,
}));

jest.mock('@/state/characterStore', () => ({
  useCharacterStore: () => ({ characters: {} }),
}));

jest.mock('@/components/shared/NavigationLoadingProvider', () => ({
  useNavigationLoadingContext: () => ({ navigateWithLoading: jest.fn() }),
}));

jest.mock('@/components/TutorialProvider', () => ({
  useTutorial: () => ({
    startTour: jest.fn(),
    stopTour: jest.fn(),
    setCurrentWizardStep: jest.fn(),
    isTourActive: false,
    currentTour: null,
  }),
}));

jest.mock('../Breadcrumbs', () => ({
  Breadcrumbs: () => <div data-testid="breadcrumbs">Breadcrumbs</div>,
}));

jest.mock('../RecentPagesDropdown', () => ({
  RecentPagesDropdown: () => <div data-testid="recent-pages">Recent</div>,
}));

describe('WorkshopContextualHeader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWorldStore.worlds = {};
    mockWorldStore.currentWorldId = null;
    mockPathname = '/characters';
  });

  it('renders the mobile sidebar trigger and workshop title', () => {
    render(
      <WorkshopContextualHeader
        sidebarOpen={false}
        onToggleSidebar={jest.fn()}
      />
    );

    expect(
      screen.getByRole('button', { name: /open sidebar/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/workshop/i)).toBeInTheDocument();
  });

  it('shows "Create Your First World" CTA when there are no worlds', () => {
    render(
      <WorkshopContextualHeader
        sidebarOpen={false}
        onToggleSidebar={jest.fn()}
      />
    );

    expect(screen.getByText('Create Your First World')).toBeInTheDocument();
  });

  it('shows the Play CTA when an active world is selected', () => {
    mockWorldStore.worlds = {
      'w1': { id: 'w1', name: 'Cyberpunk', genre: 'cyberpunk' },
    };
    mockWorldStore.currentWorldId = 'w1';

    render(
      <WorkshopContextualHeader
        sidebarOpen={false}
        onToggleSidebar={jest.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /^Play$/i })).toBeInTheDocument();
  });

  it('suppresses the CTA on the worlds index, where the page owns those actions', () => {
    mockPathname = '/worlds';

    render(
      <WorkshopContextualHeader
        sidebarOpen={false}
        onToggleSidebar={jest.fn()}
      />
    );

    expect(
      screen.queryByText('Create Your First World')
    ).not.toBeInTheDocument();
  });

  it('renders breadcrumbs and recent pages on the desktop side of the header', () => {
    render(
      <WorkshopContextualHeader
        sidebarOpen={false}
        onToggleSidebar={jest.fn()}
      />
    );

    expect(screen.getByTestId('breadcrumbs')).toBeInTheDocument();
    expect(screen.getByTestId('recent-pages')).toBeInTheDocument();
  });
});
