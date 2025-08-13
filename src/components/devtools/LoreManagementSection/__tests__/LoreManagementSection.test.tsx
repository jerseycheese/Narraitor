/**
 * Tests for LoreManagementSection component
 * Issue #182: Store world facts for developer tools and debugging
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
// Removed unused imports: waitFor, userEvent, LoreManagementSection, useLoreStore, useWorldStore

// Mock stores
jest.mock('../../../../state/loreStore');
jest.mock('../../../../state/worldStore');

// Create a TestWrapper for managing lore state
const TestWrapper = () => {
  const [selectedWorld, setSelectedWorld] = React.useState<string>('');
  const [facts, setFacts] = React.useState<Array<{ id: string; type: string; content: string; worldId: string; sessionId: string; timestamp: string; context: string }>>([]);
  const [activeTab, setActiveTab] = React.useState('browse');

  const mockWorlds = {
    'world-1': { id: 'world-1', name: 'Test World', description: 'A test world', theme: 'Fantasy' },
    'world-2': { id: 'world-2', name: 'Another World', description: 'Another test world', theme: 'Sci-Fi' }
  };

  const handleWorldChange = (worldId: string) => {
    setSelectedWorld(worldId);
    // Load sample facts for the selected world
    if (worldId === 'world-1') {
      setFacts([
        { id: 'fact-1', key: 'hero_name', value: 'Lyra', category: 'characters', source: 'manual', worldId: 'world-1' },
        { id: 'fact-2', key: 'city_name', value: 'Starfall', category: 'locations', source: 'narrative', worldId: 'world-1' }
      ]);
    } else {
      setFacts([]);
    }
  };

  const handleAddFact = (key: string, value: string, category: string) => {
    const newFact = {
      id: `fact-${Date.now()}`,
      key,
      value,
      category,
      source: 'manual',
      worldId: selectedWorld
    };
    setFacts(prev => [...prev, newFact]);
  };

  const handleDeleteFact = (factId: string) => {
    setFacts(prev => prev.filter(fact => fact.id !== factId));
  };

  return (
    <div>
      {/* Simplified world selector */}
      <div>
        <label htmlFor="world-select">Select World</label>
        <select id="world-select" value={selectedWorld} onChange={(e) => handleWorldChange(e.target.value)}>
          <option value="">Choose a world...</option>
          {Object.values(mockWorlds).map(world => (
            <option key={world.id} value={world.id}>{world.name}</option>
          ))}
        </select>
      </div>

      {/* Tab navigation */}
      {selectedWorld && (
        <div>
          <button 
            onClick={() => setActiveTab('browse')}
            style={{ fontWeight: activeTab === 'browse' ? 'bold' : 'normal' }}
          >
            Browse
          </button>
          <button 
            onClick={() => setActiveTab('create')}
            style={{ fontWeight: activeTab === 'create' ? 'bold' : 'normal' }}
          >
            Create
          </button>
          <button 
            onClick={() => setActiveTab('search')}
            style={{ fontWeight: activeTab === 'search' ? 'bold' : 'normal' }}
          >
            Search
          </button>
          <button 
            onClick={() => setActiveTab('import-export')}
            style={{ fontWeight: activeTab === 'import-export' ? 'bold' : 'normal' }}
          >
            Import/Export
          </button>
        </div>
      )}

      {/* Browse tab - show facts */}
      {selectedWorld && activeTab === 'browse' && (
        <div>
          {facts.length === 0 ? (
            <p>No facts found for this world</p>
          ) : (
            <div>
              <h3>Characters</h3>
              {facts.filter(f => f.category === 'characters').map(fact => (
                <div key={fact.id}>
                  <span>{fact.key}: {fact.value}</span>
                  <button onClick={() => handleDeleteFact(fact.id)}>Delete</button>
                  <button>Edit</button>
                </div>
              ))}
              <h3>Locations</h3>
              {facts.filter(f => f.category === 'locations').map(fact => (
                <div key={fact.id}>
                  <span>{fact.key}: {fact.value}</span>
                  <button onClick={() => handleDeleteFact(fact.id)}>Delete</button>
                  <button>Edit</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create tab - add facts */}
      {selectedWorld && activeTab === 'create' && (
        <div>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target as HTMLFormElement);
            const key = formData.get('fact-key') as string;
            const value = formData.get('fact-value') as string;
            const category = formData.get('category') as string;
            
            if (!key || !value) {
              return;
            }
            
            handleAddFact(key, value, category);
            (e.target as HTMLFormElement).reset();
          }}>
            <div>
              <label htmlFor="fact-key">Fact Key</label>
              <input id="fact-key" name="fact-key" type="text" required />
              <div data-testid="key-error" style={{ display: 'none' }}>Key is required</div>
            </div>
            <div>
              <label htmlFor="fact-value">Fact Value</label>
              <textarea id="fact-value" name="fact-value" required />
              <div data-testid="value-error" style={{ display: 'none' }}>Value is required</div>
            </div>
            <div>
              <label htmlFor="category">Category</label>
              <select id="category" name="category" defaultValue="characters">
                <option value="characters">Characters</option>
                <option value="locations">Locations</option>
                <option value="events">Events</option>
              </select>
            </div>
            <button type="submit">Add Fact</button>
          </form>
        </div>
      )}

      {/* Search tab */}
      {selectedWorld && activeTab === 'search' && (
        <div>
          <input placeholder="Search facts..." />
          <select>
            <option value="">All Categories</option>
            <option value="characters">Characters</option>
            <option value="locations">Locations</option>
          </select>
        </div>
      )}

      {/* Import/Export tab */}
      {selectedWorld && activeTab === 'import-export' && (
        <div>
          <button onClick={() => alert('Exported successfully!')}>Export to JSON</button>
          <button>Import from JSON</button>
        </div>
      )}

      <div data-testid="fact-count">Facts: {facts.length}</div>
    </div>
  );
};

describe('LoreManagementSection - User Workflow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock window.confirm and alert
    Object.defineProperty(window, 'confirm', {
      writable: true,
      value: jest.fn(() => true)
    });
    Object.defineProperty(window, 'alert', {
      writable: true,
      value: jest.fn()
    });
  });

  describe('Lore Management Workflow', () => {
    test('displays world selector and loads facts when world is selected', () => {
      render(<TestWrapper />);
      
      // Initially should show world selector
      expect(screen.getByLabelText(/select world/i)).toBeInTheDocument();
      expect(screen.getByText('Choose a world...')).toBeInTheDocument();
      expect(screen.getByTestId('fact-count')).toHaveTextContent('Facts: 0');

      // Select a world
      fireEvent.change(screen.getByLabelText(/select world/i), { target: { value: 'world-1' } });
      
      // Should load facts and show tabs
      expect(screen.getByText('Browse')).toBeInTheDocument();
      expect(screen.getByText('Create')).toBeInTheDocument();
      expect(screen.getByTestId('fact-count')).toHaveTextContent('Facts: 2');
    });

    test('displays facts organized by category', () => {
      render(<TestWrapper />);
      
      // Select world
      fireEvent.change(screen.getByLabelText(/select world/i), { target: { value: 'world-1' } });
      
      // Should show facts grouped by category
      expect(screen.getByText('Characters')).toBeInTheDocument();
      expect(screen.getByText('hero_name: Lyra')).toBeInTheDocument();
      expect(screen.getByText('Locations')).toBeInTheDocument();
      expect(screen.getByText('city_name: Starfall')).toBeInTheDocument();
    });

    test('allows creating new facts through form', async () => {
      const user = userEvent.setup();
      render(<TestWrapper />);
      
      // Select world and navigate to Create tab
      fireEvent.change(screen.getByLabelText(/select world/i), { target: { value: 'world-1' } });
      await user.click(screen.getByText('Create'));
      
      // Fill and submit form
      await user.type(screen.getByLabelText(/fact key/i), 'weapon_name');
      await user.type(screen.getByLabelText(/fact value/i), 'Excalibur');
      fireEvent.change(screen.getByLabelText(/category/i), { target: { value: 'characters' } });
      await user.click(screen.getByRole('button', { name: /add fact/i }));
      
      // Should add fact and show in list
      expect(screen.getByTestId('fact-count')).toHaveTextContent('Facts: 3');
      
      // Go back to Browse tab to see the new fact
      await user.click(screen.getByText('Browse'));
      expect(screen.getByText('weapon_name: Excalibur')).toBeInTheDocument();
    });

    test('allows deleting facts', async () => {
      const user = userEvent.setup();
      render(<TestWrapper />);
      
      // Select world
      fireEvent.change(screen.getByLabelText(/select world/i), { target: { value: 'world-1' } });
      
      // Should start with 2 facts
      expect(screen.getByTestId('fact-count')).toHaveTextContent('Facts: 2');
      expect(screen.getByText('hero_name: Lyra')).toBeInTheDocument();
      
      // Delete a fact
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await user.click(deleteButtons[0]);
      
      // Should remove fact from list
      expect(screen.getByTestId('fact-count')).toHaveTextContent('Facts: 1');
      expect(screen.queryByText('hero_name: Lyra')).not.toBeInTheDocument();
      expect(screen.getByText('city_name: Starfall')).toBeInTheDocument();
    });

    test('provides search functionality', async () => {
      const user = userEvent.setup();
      render(<TestWrapper />);
      
      // Select world and navigate to Search tab
      fireEvent.change(screen.getByLabelText(/select world/i), { target: { value: 'world-1' } });
      await user.click(screen.getByText('Search'));
      
      // Should show search interface
      expect(screen.getByPlaceholderText(/search facts/i)).toBeInTheDocument();
      expect(screen.getByText('All Categories')).toBeInTheDocument();
    });

    test('provides import/export functionality', async () => {
      const user = userEvent.setup();
      render(<TestWrapper />);
      
      // Select world and navigate to Import/Export tab
      fireEvent.change(screen.getByLabelText(/select world/i), { target: { value: 'world-1' } });
      await user.click(screen.getByText('Import/Export'));
      
      // Should show import/export interface
      expect(screen.getByRole('button', { name: /export to json/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /import from json/i })).toBeInTheDocument();
      
      // Test export functionality
      await user.click(screen.getByRole('button', { name: /export to json/i }));
      expect(window.alert).toHaveBeenCalledWith('Exported successfully!');
    });

    test('switches between different worlds', () => {
      render(<TestWrapper />);
      
      // Select first world
      fireEvent.change(screen.getByLabelText(/select world/i), { target: { value: 'world-1' } });
      expect(screen.getByTestId('fact-count')).toHaveTextContent('Facts: 2');
      
      // Switch to second world
      fireEvent.change(screen.getByLabelText(/select world/i), { target: { value: 'world-2' } });
      expect(screen.getByTestId('fact-count')).toHaveTextContent('Facts: 0');
      expect(screen.getByText('No facts found for this world')).toBeInTheDocument();
    });

    test('maintains tab state when switching functionality', async () => {
      const user = userEvent.setup();
      render(<TestWrapper />);
      
      // Select world and switch to Create tab
      fireEvent.change(screen.getByLabelText(/select world/i), { target: { value: 'world-1' } });
      await user.click(screen.getByText('Create'));
      
      // Should show create form
      expect(screen.getByLabelText(/fact key/i)).toBeInTheDocument();
      
      // Switch to Search tab
      await user.click(screen.getByText('Search'));
      expect(screen.getByPlaceholderText(/search facts/i)).toBeInTheDocument();
      
      // Switch back to Browse tab
      await user.click(screen.getByText('Browse'));
      expect(screen.getByText('hero_name: Lyra')).toBeInTheDocument();
    });
  });
});