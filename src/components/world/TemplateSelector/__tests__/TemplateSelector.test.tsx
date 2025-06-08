import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TemplateSelector from '../TemplateSelector';
import { templates } from '../../../../lib/templates/worldTemplates';

// Mock the worldStore
jest.mock('../../../../state/worldStore', () => {
  const createWorldMock = jest.fn().mockReturnValue('mock-world-id');
  
  // Create a mock store function that can be called with a selector
  const mockStore = jest.fn((selector) => {
    // When called with a selector, apply the selector to our mock state
    if (typeof selector === 'function') {
      return selector({
        worlds: {},
        createWorld: createWorldMock,
        error: null,
        loading: false,
        setCurrentWorld: jest.fn(),
        fetchWorlds: jest.fn().mockResolvedValue(undefined)
      });
    }
    // Otherwise return the mock store
    return mockStore;
  });
  
  // Add setState method to the store
  mockStore.setState = jest.fn();
  mockStore.getState = jest.fn(() => ({ 
    worlds: {},
    createWorld: createWorldMock,
    error: null,
    loading: false
  }));
  mockStore.subscribe = jest.fn(() => jest.fn());
  
  return {
    worldStore: mockStore
  };
});

describe('TemplateSelector', () => {
  // Test rendering of templates
  test('renders all templates', () => {
    const onSelect = jest.fn();
    
    render(<TemplateSelector onSelect={onSelect} />);
    
    // Check if all templates are rendered
    templates.forEach(template => {
      expect(screen.getByTestId(`template-card-${template.id}`)).toBeInTheDocument();
      expect(screen.getByTestId(`template-name-${template.id}`)).toHaveTextContent(template.name);
      expect(screen.getByTestId(`template-description-${template.id}`)).toHaveTextContent(template.description);
    });
  });

  // Test selection of template
  test('calls onSelect when a template is selected', () => {
    const onSelect = jest.fn();
    
    render(<TemplateSelector onSelect={onSelect} />);
    
    // Click on Western template
    fireEvent.click(screen.getByTestId('template-card-western'));
    
    // Check if onSelect was called with correct ID
    expect(onSelect).toHaveBeenCalledWith('western');
    
    // Click on Sitcom template
    fireEvent.click(screen.getByTestId('template-card-sitcom'));
    
    // Check if onSelect was called with correct ID
    expect(onSelect).toHaveBeenCalledWith('sitcom');
    
    // Click on Fantasy template
    fireEvent.click(screen.getByTestId('template-card-fantasy'));
    
    // Check if onSelect was called with correct ID
    expect(onSelect).toHaveBeenCalledWith('fantasy');
  });

  // Test with preselected template
  test('renders with preselected template', () => {
    const onSelect = jest.fn();
    
    render(<TemplateSelector onSelect={onSelect} selectedTemplateId="western" />);
    
    // Check if Western template is selected (has selected-template class)
    expect(screen.getByTestId('template-card-western').className).toContain('selected-template');
    
    // Check if preview is shown for selected template
    expect(screen.getByTestId('template-preview-western')).toBeInTheDocument();
    
    // Check if other templates are not selected
    const sitcomTemplate = screen.getByTestId('template-card-sitcom');
    const fantasyTemplate = screen.getByTestId('template-card-fantasy');
    
    // Make sure the other templates don't have the selected-template class
    expect(sitcomTemplate.className).not.toContain('selected-template');
    expect(fantasyTemplate.className).not.toContain('selected-template');
  });
  
  // Test that preview is shown for selected template
  test('shows preview for selected template', () => {
    const onSelect = jest.fn();
    
    render(
      <TemplateSelector 
        onSelect={onSelect} 
        selectedTemplateId="western" 
      />
    );
    
    // Check that preview is shown for the selected template
    expect(screen.getByTestId('template-preview-western')).toBeInTheDocument();
  });
});
