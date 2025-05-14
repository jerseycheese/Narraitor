import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import WorldListScreenHarness from '../page';

// Mock the WorldListScreen component
jest.mock('../../../../src/components/WorldListScreen/WorldListScreen', () => ({
  WorldListScreen: () => <div>Mocked WorldListScreen Component</div>
}));

// Mock the test utils import
jest.mock('../testUtils', () => ({}));

describe('WorldListScreenHarness', () => {
  it('should render the harness container with proper structure', () => {
    render(<WorldListScreenHarness />);
    
    // Check for harness title
    expect(screen.getByText('World List Screen Test Harness')).toBeInTheDocument();
    
    // Check for stage description
    expect(screen.getByText('Testing Stage 2: Component with live store')).toBeInTheDocument();
    
    // Check for test utilities documentation
    expect(screen.getByText(/Test utilities available in browser console:/)).toBeInTheDocument();
    
    // Check for the WorldListScreen component
    expect(screen.getByText('Mocked WorldListScreen Component')).toBeInTheDocument();
  });

  it('should display all test utility commands', () => {
    render(<WorldListScreenHarness />);
    
    // Check for each utility command
    expect(screen.getByText(/worldListTestUtils\.addTestWorlds\(\)/)).toBeInTheDocument();
    expect(screen.getByText(/worldListTestUtils\.clearWorlds\(\)/)).toBeInTheDocument();
    expect(screen.getByText(/worldListTestUtils\.setLoadingState\(true\/false\)/)).toBeInTheDocument();
    expect(screen.getByText(/worldListTestUtils\.setErrorState\('error message'\)/)).toBeInTheDocument();
  });

  it('should have the harness-container class', () => {
    const { container } = render(<WorldListScreenHarness />);
    
    const harnessContainer = container.querySelector('.harness-container');
    expect(harnessContainer).toBeInTheDocument();
    expect(harnessContainer).toHaveClass('p-8');
  });

  it('should render the test utilities info box', () => {
    render(<WorldListScreenHarness />);
    
    const infoBox = screen.getByText(/Test utilities available in browser console:/).closest('div');
    expect(infoBox).toHaveClass('mb-4', 'p-4', 'bg-gray-100', 'rounded');
  });
});
