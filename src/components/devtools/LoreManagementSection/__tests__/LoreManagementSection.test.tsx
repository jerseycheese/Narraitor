/**
 * Tests for LoreManagementSection component
 * Issue #182: Store world facts for developer tools and debugging
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoreManagementSection } from '../LoreManagementSection';
import { useLoreStore } from '../../../../state/loreStore';
import { useWorldStore } from '../../../../state/worldStore';

// Mock stores
jest.mock('../../../../state/loreStore');
jest.mock('../../../../state/worldStore');

describe('LoreManagementSection', () => {
  const mockAddFact = jest.fn();
  const mockUpdateFact = jest.fn();
  const mockDeleteFact = jest.fn();
  const mockGetFacts = jest.fn();
  const mockValidateFactUniqueness = jest.fn();
  const mockSearchFacts = jest.fn();
  const mockExportFacts = jest.fn();
  const mockImportFacts = jest.fn();

  const mockWorlds = {
    'world-1': {
      id: 'world-1',
      name: 'Test World',
      description: 'A test world',
      theme: 'Fantasy'
    },
    'world-2': {
      id: 'world-2',
      name: 'Another World',
      description: 'Another test world',
      theme: 'Sci-Fi'
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock window.confirm to prevent jsdom errors
    Object.defineProperty(window, 'confirm', {
      writable: true,
      value: jest.fn(() => true)
    });
    
    (useLoreStore as unknown as jest.Mock).mockReturnValue({
      addFact: mockAddFact,
      updateFact: mockUpdateFact,
      deleteFact: mockDeleteFact,
      getFacts: mockGetFacts,
      validateFactUniqueness: mockValidateFactUniqueness,
      searchFacts: mockSearchFacts,
      exportFacts: mockExportFacts,
      importFacts: mockImportFacts,
      facts: {}
    });

    (useWorldStore as unknown as jest.Mock).mockReturnValue({
      worlds: mockWorlds
    });

    mockGetFacts.mockReturnValue([]);
    mockValidateFactUniqueness.mockReturnValue(true);
    mockSearchFacts.mockReturnValue([]);
  });

  describe('World Selection', () => {
    test('should display world selector with available worlds', () => {
      render(<LoreManagementSection />);
      
      const selector = screen.getByLabelText(/select world/i);
      expect(selector).toBeInTheDocument();
      
      // Check if worlds are in the dropdown
      fireEvent.click(selector);
      expect(screen.getByText('Test World')).toBeInTheDocument();
      expect(screen.getByText('Another World')).toBeInTheDocument();
    });

    test('should load facts when world is selected', () => {
      render(<LoreManagementSection />);
      
      const selector = screen.getByLabelText(/select world/i);
      fireEvent.change(selector, { target: { value: 'world-1' } });
      
      expect(mockGetFacts).toHaveBeenCalledWith({ worldId: 'world-1' });
    });
  });

  describe('Fact Creation', () => {
    test('should display fact creation form', async () => {
      const user = userEvent.setup();
      render(<LoreManagementSection />);
      
      // Select a world first
      const selector = screen.getByLabelText(/select world/i);
      fireEvent.change(selector, { target: { value: 'world-1' } });
      
      // Navigate to Create tab
      const createTab = screen.getByRole('tab', { name: /create/i });
      await user.click(createTab);
      
      // Check form elements (these are from FactEditor component)
      expect(screen.getByLabelText(/fact key/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/fact value/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    });

    test('should validate fact before adding', async () => {
      const user = userEvent.setup();
      render(<LoreManagementSection />);
      
      // Select world and navigate to Create tab
      const selector = screen.getByLabelText(/select world/i);
      fireEvent.change(selector, { target: { value: 'world-1' } });
      
      const createTab = screen.getByRole('tab', { name: /create/i });
      await user.click(createTab);
      
      // Try to submit empty form
      const submitButton = screen.getByRole('button', { name: /save/i });
      await user.click(submitButton);
      
      // Should show validation errors
      expect(screen.getByText(/key is required/i)).toBeInTheDocument();
      expect(screen.getByText(/value is required/i)).toBeInTheDocument();
    });

    test('should add fact with valid data', async () => {
      const user = userEvent.setup();
      render(<LoreManagementSection />);
      
      // Select world and navigate to Create tab
      const selector = screen.getByLabelText(/select world/i);
      fireEvent.change(selector, { target: { value: 'world-1' } });
      
      const createTab = screen.getByRole('tab', { name: /create/i });
      await user.click(createTab);
      
      // Fill form
      await user.type(screen.getByLabelText(/fact key/i), 'hero_name');
      await user.type(screen.getByLabelText(/fact value/i), 'Test Hero');
      fireEvent.change(screen.getByLabelText(/category/i), { target: { value: 'characters' } });
      
      // Submit
      await user.click(screen.getByRole('button', { name: /save/i }));
      
      expect(mockAddFact).toHaveBeenCalledWith(
        'hero_name',
        'Test Hero',
        'characters',
        'manual',
        'world-1',
        undefined,
        expect.any(Object)
      );
    });

    test('should check for duplicates before adding', async () => {
      const user = userEvent.setup();
      mockValidateFactUniqueness.mockReturnValue(false); // Indicates duplicate
      
      render(<LoreManagementSection />);
      
      // Select world and navigate to Create tab
      fireEvent.change(screen.getByLabelText(/select world/i), { target: { value: 'world-1' } });
      
      const createTab = screen.getByRole('tab', { name: /create/i });
      await user.click(createTab);
      
      // Fill form
      await user.type(screen.getByLabelText(/fact key/i), 'duplicate_key');
      await user.type(screen.getByLabelText(/fact value/i), 'Duplicate Value');
      
      // Should show duplicate warning
      await waitFor(() => {
        expect(screen.getByText(/duplicate fact detected/i)).toBeInTheDocument();
      });
    });
  });

  describe('Fact Display', () => {
    test('should display existing facts', () => {
      const mockFacts = [
        {
          id: 'fact-1',
          key: 'hero_name',
          value: 'Lyra',
          category: 'characters',
          source: 'manual',
          worldId: 'world-1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'fact-2',
          key: 'city_name',
          value: 'Starfall',
          category: 'locations',
          source: 'narrative',
          worldId: 'world-1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      
      mockGetFacts.mockReturnValue(mockFacts);
      render(<LoreManagementSection />);
      
      // Select world
      fireEvent.change(screen.getByLabelText(/select world/i), { target: { value: 'world-1' } });
      
      // Check facts are displayed
      expect(screen.getByText('hero_name')).toBeInTheDocument();
      expect(screen.getByText('Lyra')).toBeInTheDocument();
      expect(screen.getByText('city_name')).toBeInTheDocument();
      expect(screen.getByText('Starfall')).toBeInTheDocument();
    });

    test('should group facts by category', () => {
      const mockFacts = [
        {
          id: 'fact-1',
          key: 'hero',
          value: 'Hero',
          category: 'characters',
          source: 'manual',
          worldId: 'world-1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'fact-2',
          key: 'villain',
          value: 'Villain',
          category: 'characters',
          source: 'manual',
          worldId: 'world-1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      
      mockGetFacts.mockReturnValue(mockFacts);
      render(<LoreManagementSection />);
      
      fireEvent.change(screen.getByLabelText(/select world/i), { target: { value: 'world-1' } });
      
      // Should have category header
      expect(screen.getByText('Characters')).toBeInTheDocument();
    });
  });

  describe('Fact Editing', () => {
    test('should allow editing existing facts', async () => {
      const user = userEvent.setup();
      const mockFact = {
        id: 'fact-1',
        key: 'hero_name',
        value: 'Original Hero',
        category: 'characters',
        source: 'manual',
        worldId: 'world-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      mockGetFacts.mockReturnValue([mockFact]);
      render(<LoreManagementSection />);
      
      fireEvent.change(screen.getByLabelText(/select world/i), { target: { value: 'world-1' } });
      
      // Click edit button
      const editButton = screen.getByRole('button', { name: /edit/i });
      await user.click(editButton);
      
      // Edit form should appear with current values
      const valueInput = screen.getByDisplayValue('Original Hero');
      await user.clear(valueInput);
      await user.type(valueInput, 'Updated Hero');
      
      // Save changes
      await user.click(screen.getByRole('button', { name: /save/i }));
      
      expect(mockUpdateFact).toHaveBeenCalledWith('fact-1', {
        value: 'Updated Hero'
      });
    });
  });

  describe('Fact Deletion', () => {
    test('should allow deleting facts with confirmation', async () => {
      const user = userEvent.setup();
      const mockConfirm = jest.fn().mockReturnValue(true);
      window.confirm = mockConfirm;
      
      const mockFact = {
        id: 'fact-1',
        key: 'hero_name',
        value: 'Hero to Delete',
        category: 'characters',
        source: 'manual',
        worldId: 'world-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      mockGetFacts.mockReturnValue([mockFact]);
      render(<LoreManagementSection />);
      
      fireEvent.change(screen.getByLabelText(/select world/i), { target: { value: 'world-1' } });
      
      // Click delete button
      const deleteButton = screen.getByRole('button', { name: /delete/i });
      await user.click(deleteButton);
      
      // Confirmation dialog should have been called
      expect(mockConfirm).toHaveBeenCalledWith('Are you sure you want to delete this fact?');
      expect(mockDeleteFact).toHaveBeenCalledWith('fact-1');
    });
  });

  describe('Search Functionality', () => {
    test('should search facts by query', async () => {
      const user = userEvent.setup();
      render(<LoreManagementSection />);
      
      fireEvent.change(screen.getByLabelText(/select world/i), { target: { value: 'world-1' } });
      
      // Navigate to Search tab
      const searchTab = screen.getByRole('tab', { name: /search/i });
      await user.click(searchTab);
      
      // Enter search query
      const searchInput = screen.getByPlaceholderText(/search facts/i);
      await user.type(searchInput, 'hero');
      
      // Debounced search should be called
      await waitFor(() => {
        expect(mockSearchFacts).toHaveBeenCalledWith('hero', { worldId: 'world-1' });
      });
    });

    test('should filter search by category', () => {
      render(<LoreManagementSection />);
      
      fireEvent.change(screen.getByLabelText(/select world/i), { target: { value: 'world-1' } });
      
      // Select category filter
      const categoryFilter = screen.getByLabelText(/filter by category/i);
      fireEvent.change(categoryFilter, { target: { value: 'characters' } });
      
      expect(mockGetFacts).toHaveBeenCalledWith({
        worldId: 'world-1',
        category: 'characters'
      });
    });
  });

  describe('Import/Export', () => {
    test('should export facts as JSON', async () => {
      const user = userEvent.setup();
      mockExportFacts.mockReturnValue('{"facts":[]}');
      
      render(<LoreManagementSection />);
      
      fireEvent.change(screen.getByLabelText(/select world/i), { target: { value: 'world-1' } });
      
      // Navigate to Import/Export tab
      const importExportTab = screen.getByRole('tab', { name: /import\/export/i });
      await user.click(importExportTab);
      
      // Click export button
      const exportButton = screen.getByRole('button', { name: /export/i });
      await user.click(exportButton);
      
      expect(mockExportFacts).toHaveBeenCalledWith('world-1');
      
      // Should show success message
      expect(screen.getByText(/exported successfully/i)).toBeInTheDocument();
    });

    test('should import facts from JSON', async () => {
      const user = userEvent.setup();
      render(<LoreManagementSection />);
      
      fireEvent.change(screen.getByLabelText(/select world/i), { target: { value: 'world-1' } });
      
      // Navigate to Import/Export tab
      const importExportTab = screen.getByRole('tab', { name: /import\/export/i });
      await user.click(importExportTab);
      
      // Click import button to show import UI
      const importButton = screen.getByRole('button', { name: /import/i });
      await user.click(importButton);
      
      // Paste JSON data
      const importTextarea = screen.getByPlaceholderText(/paste json/i);
      const importData = '{"worldId":"world-1","facts":[]}';
      await user.type(importTextarea, importData);
      
      // Confirm import
      await user.click(screen.getByRole('button', { name: /confirm import/i }));
      
      expect(mockImportFacts).toHaveBeenCalledWith('world-1', importData);
    });
  });
});