import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import WorldCreationWizard from '../WorldCreationWizard';
import { mockCreateWorld, setupMocks } from './worldCreationWizard.test-helpers';
import { worldStore } from '@/state/worldStore';
import { World } from '@/types/world.types';

describe.skip('WorldCreationWizard Integration - Existing List', () => {
  let mockGetWorlds: jest.Mock;
  let mockUpdateWorld: jest.Mock;
  
  beforeEach(() => {
    setupMocks();
    
    // Create mocks for additional store methods
    mockGetWorlds = jest.fn(() => [{
      id: 'existing-world',
      name: 'Existing World',
    }]);
    mockUpdateWorld = jest.fn();
    
    // Extend the worldStore mock for this specific test
    const mockedWorldStore = worldStore as jest.MockedFunction<typeof worldStore>;
    mockedWorldStore.mockImplementation((selector) => {
      const existingWorld: World = {
        id: 'existing-world',
        name: 'Existing World',
        theme: 'Fantasy',
        description: 'An existing fantasy world',
        attributes: [],
        skills: [],
        settings: {
          maxAttributes: 10,
          maxSkills: 10,
          attributePointPool: 20,
          skillPointPool: 20
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const state = {
        createWorld: mockCreateWorld,
        getWorlds: mockGetWorlds,
        updateWorld: mockUpdateWorld,
        worlds: {
          'existing-world': existingWorld
        },
        currentWorldId: null,
        error: null,
        loading: false,
        deleteWorld: jest.fn(),
        setCurrentWorld: jest.fn(),
        fetchWorlds: jest.fn(() => Promise.resolve()),
        addAttribute: jest.fn(),
        updateAttribute: jest.fn(),
        removeAttribute: jest.fn(),
        addSkill: jest.fn(),
        updateSkill: jest.fn(),
        removeSkill: jest.fn(),
        updateSettings: jest.fn(),
        reset: jest.fn(),
        setError: jest.fn(),
        clearError: jest.fn(),
        setLoading: jest.fn(),
      };
      return selector(state);
    });
    
    mockCreateWorld.mockReturnValue('new-world-id');
  });

  test('integrates with existing world list', async () => {
    await act(async () => {
      render(<WorldCreationWizard />);
    });

    // Navigate past the template step first
    await act(async () => {
      // Navigate through template step
      await fireEvent.click(await screen.findByTestId('create-own-button'));
    });

    // Navigate to final step quickly
    await act(async () => {
      // Basic Info
      await fireEvent.change(await screen.findByTestId('world-name-input'), {
        target: { value: 'New Test World' },
      });
      await fireEvent.change(await screen.findByTestId('world-theme-input'), {
        target: { value: 'Fantasy' },
      });
      await fireEvent.click(await screen.findByRole('button', { name: 'Next' }));
    });

    // Description
    await screen.findByTestId('description-step');
    await act(async () => {
      await fireEvent.change(await screen.findByTestId('world-full-description'), {
        target: { value: 'This is a detailed description for the new world that will be added to the existing list.' },
      });
      await fireEvent.click(await screen.findByRole('button', { name: 'Next' }));
    });
    
    // Wait for AI processing
    await waitFor(() => screen.getByTestId('attribute-review-step'), { timeout: 5000 });

    // Skip attributes
    await act(async () => {
      await fireEvent.click(await screen.findByRole('button', { name: 'Next' }));
    });

    // Skip skills
    await waitFor(() => {
      return screen.getByTestId('skill-review-step');
    }, { timeout: 5000 });

    await act(async () => {
      await fireEvent.click(await screen.findByRole('button', { name: 'Next' }));
    });

    // Finalize
    await screen.findByTestId('finalize-step');
    await act(async () => {
      await fireEvent.click(await screen.findByRole('button', { name: 'Create World' }));
    });
    
    // Verify new world was created
    await waitFor(() => {
      expect(mockCreateWorld).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'New Test World',
          description: 'This is a detailed description for the new world that will be added to the existing list.',
        })
      );
    });
  });
});
