// src/components/devtools/MockControlsSection/__tests__/MockControlsSection.test.tsx

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockControlsSection } from '../MockControlsSection';
import { useMockConfigurationStore } from '@/state/mockConfigurationStore';

// Mock the store hooks
jest.mock('@/state/mockConfigurationStore', () => ({
  useMockConfiguration: jest.fn(),
  useMockControls: jest.fn(),
  useMockConfigurationStore: jest.fn()
}));

import { useMockConfiguration, useMockControls } from '@/state/mockConfigurationStore';

const mockUseMockConfiguration = useMockConfiguration as jest.MockedFunction<typeof useMockConfiguration>;
const mockUseMockControls = useMockControls as jest.MockedFunction<typeof useMockControls>;

describe('MockControlsSection', () => {
  const mockControls = {
    enableMock: jest.fn(),
    setActiveScenario: jest.fn(),
    updateGlobalDelay: jest.fn(),
    toggleDelayVariation: jest.fn(),
    addScenario: jest.fn(),
    updateScenario: jest.fn(),
    deleteScenario: jest.fn(),
    resetToDefaults: jest.fn(),
    getActiveScenario: jest.fn(),
    isEnabled: jest.fn(),
    exportConfiguration: jest.fn(),
    importConfiguration: jest.fn()
  };

  const defaultConfiguration = {
    enabled: false,
    activeScenario: 'success-normal',
    scenarios: [
      {
        id: 'success-normal',
        name: 'Normal Success',
        type: 'success' as const,
        delay: 2000,
        description: 'Normal successful response'
      }
    ],
    globalDelay: 1000,
    enableDelayVariation: true
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseMockConfiguration.mockReturnValue(defaultConfiguration);
    mockUseMockControls.mockReturnValue(mockControls);
  });

  it('should render enable button when mock is disabled', () => {
    render(<MockControlsSection />);
    
    expect(screen.getByRole('button', { name: /enable mock/i })).toBeInTheDocument();
  });

  it('should enable mock when enable button is clicked', async () => {
    const user = userEvent.setup();
    render(<MockControlsSection />);
    
    const enableButton = screen.getByRole('button', { name: /enable mock/i });
    await user.click(enableButton);
    
    expect(mockControls.enableMock).toHaveBeenCalledWith(true);
  });

  it('should show scenario controls when enabled', () => {
    mockUseMockConfiguration.mockReturnValue({ ...defaultConfiguration, enabled: true });

    render(<MockControlsSection />);
    
    expect(screen.getByText('Active Scenario')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /disable mock/i })).toBeInTheDocument();
  });
});