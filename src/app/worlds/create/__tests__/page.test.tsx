import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CreateWorldPage from '../page';

const mockPush = jest.fn();
let mockStepParam: string | null = null;
const mockWizardRender = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => ({
    get: jest.fn((key: string) => (key === 'step' ? mockStepParam : null)),
  }),
}));

interface MockWizardProps {
  onComplete: (worldId: string) => void;
  onCancel: () => void;
  initialStep: number;
}

jest.mock('@/components/WorldCreationWizard/WorldCreationWizard', () => {
  return function MockWorldCreationWizard(props: MockWizardProps) {
    mockWizardRender(props);
    return (
      <div data-testid="world-creation-wizard" data-initial-step={props.initialStep}>
        <button
          type="button"
          onClick={() => props.onComplete('world-456')}
          data-testid="complete-btn"
        >
          Complete
        </button>
        <button
          type="button"
          onClick={() => props.onCancel()}
          data-testid="cancel-btn"
        >
          Cancel
        </button>
      </div>
    );
  };
});

describe('CreateWorldPage', () => {
  let getItemSpy: jest.SpyInstance;
  let removeItemSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockStepParam = null;
    window.sessionStorage.clear();
    getItemSpy = jest.spyOn(Storage.prototype, 'getItem');
    removeItemSpy = jest.spyOn(Storage.prototype, 'removeItem');
  });

  afterEach(() => {
    getItemSpy.mockRestore();
    removeItemSpy.mockRestore();
    window.sessionStorage.clear();
  });

  it('renders WorldCreationWizard with default initialStep of 0', () => {
    render(<CreateWorldPage />);

    expect(screen.getByTestId('world-creation-wizard')).toBeInTheDocument();
    expect(mockWizardRender).toHaveBeenCalledWith(
      expect.objectContaining({
        initialStep: 0,
      })
    );
  });

  it('forwards initialStep from the step query parameter', () => {
    mockStepParam = '3';

    render(<CreateWorldPage />);

    expect(mockWizardRender).toHaveBeenCalledWith(
      expect.objectContaining({
        initialStep: 3,
      })
    );
  });

  it('keeps initialStep at 0 when step query parameter is invalid', () => {
    mockStepParam = 'not-a-number';

    render(<CreateWorldPage />);

    expect(mockWizardRender).toHaveBeenCalledWith(
      expect.objectContaining({
        initialStep: 0,
      })
    );
  });

  it('does not touch generated-world-data in session storage', () => {
    window.sessionStorage.setItem('generated-world-data', JSON.stringify({ name: 'Old Handoff' }));

    render(<CreateWorldPage />);

    // Ensure session storage key generated-world-data was neither read nor removed
    expect(getItemSpy).not.toHaveBeenCalledWith('generated-world-data');
    expect(removeItemSpy).not.toHaveBeenCalledWith('generated-world-data');
    expect(window.sessionStorage.getItem('generated-world-data')).toBe(
      JSON.stringify({ name: 'Old Handoff' })
    );
  });

  it('navigates to world details on completion', () => {
    render(<CreateWorldPage />);

    fireEvent.click(screen.getByTestId('complete-btn'));

    expect(mockPush).toHaveBeenCalledWith('/worlds/world-456');
  });

  it('navigates back to worlds list on cancel', () => {
    render(<CreateWorldPage />);

    fireEvent.click(screen.getByTestId('cancel-btn'));

    expect(mockPush).toHaveBeenCalledWith('/worlds');
  });
});
