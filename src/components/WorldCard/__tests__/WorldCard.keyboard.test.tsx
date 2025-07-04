import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WorldCard from '../WorldCard';
import { createMockWorld } from '@/lib/test-utils/testDataFactory';

describe('WorldCard Keyboard Navigation Tests', () => {
  const mockWorld = createMockWorld({
    name: 'Fantasy Realm',
    description: 'A magical world of adventure',
    genre: 'fantasy',
  });

  const mockOnSelect = jest.fn();
  const mockOnDelete = jest.fn();
  const mockSetCurrentWorld = jest.fn();
  const mockRouterPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Tab Navigation', () => {
    test('FAIL: should allow Tab navigation through all interactive elements in correct order', async () => {
      const user = userEvent.setup();
      render(
        <WorldCard
          world={mockWorld}
          onSelect={mockOnSelect}
          onDelete={mockOnDelete}
          _storeActions={{ setCurrentWorld: mockSetCurrentWorld }}
          _router={{ push: mockRouterPush }}
        />
      );

      // This test will fail because keyboard navigation is not implemented
      // Expected tab order: Card -> World Name Link -> Character Count Link -> Make Active Button -> Create Character -> Play -> View -> Edit -> Delete
      
      // Tab to card container
      await user.tab();
      const card = screen.getByTestId('world-card');
      expect(card).toHaveFocus();

      // Tab to world name link
      await user.tab();
      const worldNameLink = screen.getByRole('link', { name: mockWorld.name });
      expect(worldNameLink).toHaveFocus();

      // Tab to character count link
      await user.tab();
      const characterCountLink = screen.getByRole('button', { name: /0 characters/i });
      expect(characterCountLink).toHaveFocus();

      // Tab to Make Active button (if not active)
      await user.tab();
      const makeActiveButton = screen.getByRole('button', { name: /make active/i });
      expect(makeActiveButton).toHaveFocus();

      // Tab to Create Character button
      await user.tab();
      const createCharacterButton = screen.getByRole('button', { name: /create character/i });
      expect(createCharacterButton).toHaveFocus();

      // Tab to Play button
      await user.tab();
      const playButton = screen.getByTestId('world-card-actions-play-button');
      expect(playButton).toHaveFocus();

      // Tab to View button
      await user.tab();
      const viewButton = screen.getByRole('button', { name: /view/i });
      expect(viewButton).toHaveFocus();

      // Tab to Edit button
      await user.tab();
      const editButton = screen.getByTestId('world-card-actions-edit-button');
      expect(editButton).toHaveFocus();

      // Tab to Delete button
      await user.tab();
      const deleteButton = screen.getByRole('button', { name: /delete/i });
      expect(deleteButton).toHaveFocus();
    });

    test('FAIL: should allow Shift+Tab navigation in reverse order', async () => {
      const user = userEvent.setup();
      render(
        <WorldCard
          world={mockWorld}
          onSelect={mockOnSelect}
          onDelete={mockOnDelete}
          _storeActions={{ setCurrentWorld: mockSetCurrentWorld }}
          _router={{ push: mockRouterPush }}
        />
      );

      // This test will fail because reverse tab navigation is not implemented
      // Start at delete button and work backwards
      const deleteButton = screen.getByRole('button', { name: /delete/i });
      deleteButton.focus();

      // Shift+Tab to Edit button
      await user.tab({ shift: true });
      const editButton = screen.getByTestId('world-card-actions-edit-button');
      expect(editButton).toHaveFocus();

      // Shift+Tab to View button
      await user.tab({ shift: true });
      const viewButton = screen.getByRole('button', { name: /view/i });
      expect(viewButton).toHaveFocus();

      // Shift+Tab to Play button
      await user.tab({ shift: true });
      const playButton = screen.getByTestId('world-card-actions-play-button');
      expect(playButton).toHaveFocus();

      // Continue backwards through all elements
      await user.tab({ shift: true });
      const createCharacterButton = screen.getByRole('button', { name: /create character/i });
      expect(createCharacterButton).toHaveFocus();

      await user.tab({ shift: true });
      const makeActiveButton = screen.getByRole('button', { name: /make active/i });
      expect(makeActiveButton).toHaveFocus();

      await user.tab({ shift: true });
      const characterCountLink = screen.getByRole('button', { name: /0 characters/i });
      expect(characterCountLink).toHaveFocus();

      await user.tab({ shift: true });
      const worldNameLink = screen.getByRole('link', { name: mockWorld.name });
      expect(worldNameLink).toHaveFocus();

      await user.tab({ shift: true });
      const card = screen.getByTestId('world-card');
      expect(card).toHaveFocus();
    });
  });

  describe('Keyboard Shortcuts', () => {
    test('FAIL: should handle Enter key to select world when card is focused', async () => {
      const user = userEvent.setup();
      render(
        <WorldCard
          world={mockWorld}
          onSelect={mockOnSelect}
          onDelete={mockOnDelete}
          _storeActions={{ setCurrentWorld: mockSetCurrentWorld }}
          _router={{ push: mockRouterPush }}
        />
      );

      // This test will fail because Enter key handling is not implemented
      // Focus on card
      const card = screen.getByTestId('world-card');
      card.focus();

      // Press Enter key
      await user.keyboard('{Enter}');

      // Verify world selection
      expect(mockOnSelect).toHaveBeenCalledWith(mockWorld.id);
    });

    test('FAIL: should handle Space key to activate buttons', async () => {
      const user = userEvent.setup();
      render(
        <WorldCard
          world={mockWorld}
          onSelect={mockOnSelect}
          onDelete={mockOnDelete}
          _storeActions={{ setCurrentWorld: mockSetCurrentWorld }}
          _router={{ push: mockRouterPush }}
        />
      );

      // This test will fail because Space key handling is not implemented
      // Focus on Play button
      const playButton = screen.getByTestId('world-card-actions-play-button');
      playButton.focus();

      // Press Space key
      await user.keyboard(' ');

      // Verify play action
      expect(mockSetCurrentWorld).toHaveBeenCalledWith(mockWorld.id);
      expect(mockRouterPush).toHaveBeenCalledWith(`/characters?worldId=${mockWorld.id}`);
    });

    test('FAIL: should handle Escape key when card is focused', async () => {
      const user = userEvent.setup();
      render(
        <WorldCard
          world={mockWorld}
          onSelect={mockOnSelect}
          onDelete={mockOnDelete}
          _storeActions={{ setCurrentWorld: mockSetCurrentWorld }}
          _router={{ push: mockRouterPush }}
        />
      );

      // This test will fail because Escape key handling is not implemented
      // Focus on card
      const card = screen.getByTestId('world-card');
      card.focus();

      // Press Escape key
      await user.keyboard('{Escape}');

      // Focus should be removed from card (blur)
      expect(card).not.toHaveFocus();
    });

    test('FAIL: should handle Arrow keys for action navigation', async () => {
      const user = userEvent.setup();
      render(
        <WorldCard
          world={mockWorld}
          onSelect={mockOnSelect}
          onDelete={mockOnDelete}
          _storeActions={{ setCurrentWorld: mockSetCurrentWorld }}
          _router={{ push: mockRouterPush }}
        />
      );

      // This test will fail because arrow key navigation is not implemented
      // Focus on first action button
      const createCharacterButton = screen.getByRole('button', { name: /create character/i });
      createCharacterButton.focus();

      // Press Right arrow
      await user.keyboard('{ArrowRight}');

      // Focus should move to next action button
      const playButton = screen.getByTestId('world-card-actions-play-button');
      expect(playButton).toHaveFocus();

      // Press Down arrow
      await user.keyboard('{ArrowDown}');

      // Focus should move to next row of actions
      const viewButton = screen.getByRole('button', { name: /view/i });
      expect(viewButton).toHaveFocus();

      // Press Left arrow
      await user.keyboard('{ArrowLeft}');

      // Focus should move to previous action in same row
      const editButton = screen.getByTestId('world-card-actions-edit-button');
      expect(editButton).toHaveFocus();

      // Press Up arrow
      await user.keyboard('{ArrowUp}');

      // Focus should move back to previous row
      expect(playButton).toHaveFocus();
    });
  });

  describe('Focus Management', () => {
    test('FAIL: should have visible focus indicators on all focusable elements', async () => {
      const user = userEvent.setup();
      render(
        <WorldCard
          world={mockWorld}
          onSelect={mockOnSelect}
          onDelete={mockOnDelete}
          _storeActions={{ setCurrentWorld: mockSetCurrentWorld }}
          _router={{ push: mockRouterPush }}
        />
      );

      // This test will fail because focus indicators are not implemented
      const focusableElements = [
        screen.getByTestId('world-card'),
        screen.getByRole('link', { name: mockWorld.name }),
        screen.getByRole('button', { name: /0 characters/i }),
        screen.getByRole('button', { name: /make active/i }),
        screen.getByRole('button', { name: /create character/i }),
        screen.getByTestId('world-card-actions-play-button'),
        screen.getByRole('button', { name: /view/i }),
        screen.getByTestId('world-card-actions-edit-button'),
        screen.getByRole('button', { name: /delete/i }),
      ];

      for (const element of focusableElements) {
        element.focus();
        
        // Verify element has focus
        expect(element).toHaveFocus();
        
        // Verify focus indicator is visible
        const computedStyle = window.getComputedStyle(element);
        expect(computedStyle.outline).not.toBe('none');
        expect(computedStyle.outlineWidth).not.toBe('0px');
      }
    });

    test('FAIL: should maintain focus when actions are performed', async () => {
      const user = userEvent.setup();
      render(
        <WorldCard
          world={mockWorld}
          onSelect={mockOnSelect}
          onDelete={mockOnDelete}
          _storeActions={{ setCurrentWorld: mockSetCurrentWorld }}
          _router={{ push: mockRouterPush }}
        />
      );

      // This test will fail because focus management is not implemented
      // Focus on Make Active button
      const makeActiveButton = screen.getByRole('button', { name: /make active/i });
      makeActiveButton.focus();

      // Activate button
      await user.keyboard('{Enter}');

      // Focus should remain on the button or move to a logical next element
      expect(makeActiveButton).toHaveFocus();
    });

    test('FAIL: should skip to next focusable element when button becomes disabled', async () => {
      const user = userEvent.setup();
      
      // Render with active world to test different state
      render(
        <WorldCard
          world={mockWorld}
          isActive={true}
          onSelect={mockOnSelect}
          onDelete={mockOnDelete}
          _storeActions={{ setCurrentWorld: mockSetCurrentWorld }}
          _router={{ push: mockRouterPush }}
        />
      );

      // This test will fail because focus management for disabled elements is not implemented
      // When world is active, Make Active button should not be present
      expect(screen.queryByRole('button', { name: /make active/i })).not.toBeInTheDocument();

      // Tab order should skip the missing button
      await user.tab();
      const card = screen.getByTestId('world-card');
      expect(card).toHaveFocus();

      await user.tab();
      const worldNameLink = screen.getByRole('link', { name: mockWorld.name });
      expect(worldNameLink).toHaveFocus();

      await user.tab();
      const characterCountLink = screen.getByRole('button', { name: /0 characters/i });
      expect(characterCountLink).toHaveFocus();

      await user.tab();
      // Should skip Make Active button and go directly to Create Character
      const createCharacterButton = screen.getByRole('button', { name: /create character/i });
      expect(createCharacterButton).toHaveFocus();
    });
  });

  describe('Screen Reader Support', () => {
    test('FAIL: should have proper ARIA attributes for card actions', () => {
      render(
        <WorldCard
          world={mockWorld}
          onSelect={mockOnSelect}
          onDelete={mockOnDelete}
          _storeActions={{ setCurrentWorld: mockSetCurrentWorld }}
          _router={{ push: mockRouterPush }}
        />
      );

      // This test will fail because ARIA attributes are not implemented
      const card = screen.getByTestId('world-card');
      expect(card).toHaveAttribute('role', 'article');
      expect(card).toHaveAttribute('aria-label', `World: ${mockWorld.name}`);

      const playButton = screen.getByTestId('world-card-actions-play-button');
      expect(playButton).toHaveAttribute('aria-label', `Play in ${mockWorld.name}`);

      const editButton = screen.getByTestId('world-card-actions-edit-button');
      expect(editButton).toHaveAttribute('aria-label', `Edit ${mockWorld.name}`);

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      expect(deleteButton).toHaveAttribute('aria-label', `Delete ${mockWorld.name}`);
    });

    test('FAIL: should announce card state changes for screen readers', () => {
      const { rerender } = render(
        <WorldCard
          world={mockWorld}
          isActive={false}
          onSelect={mockOnSelect}
          onDelete={mockOnDelete}
          _storeActions={{ setCurrentWorld: mockSetCurrentWorld }}
          _router={{ push: mockRouterPush }}
        />
      );

      // This test will fail because ARIA state management is not implemented
      const card = screen.getByTestId('world-card');
      expect(card).toHaveAttribute('aria-pressed', 'false');

      // Rerender as active
      rerender(
        <WorldCard
          world={mockWorld}
          isActive={true}
          onSelect={mockOnSelect}
          onDelete={mockOnDelete}
          _storeActions={{ setCurrentWorld: mockSetCurrentWorld }}
          _router={{ push: mockRouterPush }}
        />
      );

      expect(card).toHaveAttribute('aria-pressed', 'true');
      expect(card).toHaveAttribute('aria-label', `World: ${mockWorld.name} (Currently Active)`);
    });

    test('FAIL: should provide keyboard usage hints for screen readers', () => {
      render(
        <WorldCard
          world={mockWorld}
          onSelect={mockOnSelect}
          onDelete={mockOnDelete}
          _storeActions={{ setCurrentWorld: mockSetCurrentWorld }}
          _router={{ push: mockRouterPush }}
        />
      );

      // This test will fail because keyboard usage hints are not implemented
      const card = screen.getByTestId('world-card');
      expect(card).toHaveAttribute('aria-describedby', 'world-card-keyboard-instructions');

      const instructionsElement = screen.getByTestId('world-card-keyboard-instructions');
      expect(instructionsElement).toHaveTextContent(
        'Press Enter to select world, Tab to navigate actions, Arrow keys to navigate between action buttons'
      );
      expect(instructionsElement).toHaveClass('sr-only');
    });
  });

  describe('Action Button Keyboard Interactions', () => {
    test('FAIL: should handle keyboard shortcuts for common actions', async () => {
      const user = userEvent.setup();
      render(
        <WorldCard
          world={mockWorld}
          onSelect={mockOnSelect}
          onDelete={mockOnDelete}
          _storeActions={{ setCurrentWorld: mockSetCurrentWorld }}
          _router={{ push: mockRouterPush }}
        />
      );

      // This test will fail because action shortcuts are not implemented
      // Focus on card
      const card = screen.getByTestId('world-card');
      card.focus();

      // Press 'p' for Play
      await user.keyboard('p');
      expect(mockSetCurrentWorld).toHaveBeenCalledWith(mockWorld.id);
      expect(mockRouterPush).toHaveBeenCalledWith(`/characters?worldId=${mockWorld.id}`);

      jest.clearAllMocks();

      // Press 'e' for Edit
      await user.keyboard('e');
      expect(mockRouterPush).toHaveBeenCalledWith(`/world/${mockWorld.id}/edit`);

      jest.clearAllMocks();

      // Press 'v' for View
      await user.keyboard('v');
      expect(mockRouterPush).toHaveBeenCalledWith(`/world/${mockWorld.id}`);

      jest.clearAllMocks();

      // Press 'c' for Create Character
      await user.keyboard('c');
      expect(mockSetCurrentWorld).toHaveBeenCalledWith(mockWorld.id);
      expect(mockRouterPush).toHaveBeenCalledWith('/characters/create');
    });

    test('FAIL: should prevent default keyboard actions when card is focused', async () => {
      const user = userEvent.setup();
      render(
        <WorldCard
          world={mockWorld}
          onSelect={mockOnSelect}
          onDelete={mockOnDelete}
          _storeActions={{ setCurrentWorld: mockSetCurrentWorld }}
          _router={{ push: mockRouterPush }}
        />
      );

      // This test will fail because keyboard event handling is not implemented
      const card = screen.getByTestId('world-card');
      card.focus();

      // Add event listener to check if preventDefault is called
      const keyDownEvent = new KeyboardEvent('keydown', { key: 'p' });
      const preventDefaultSpy = jest.spyOn(keyDownEvent, 'preventDefault');
      
      fireEvent.keyDown(card, keyDownEvent);
      
      // Verify preventDefault was called to prevent default browser behavior
      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });
});