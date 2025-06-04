import { applyWorldTemplate } from '../templateLoader';
import { templates } from '../worldTemplates';
import { worldStore } from '../../../state/worldStore';

// Mock the generateUniqueId function
jest.mock('../../utils/generateId', () => ({
  generateUniqueId: jest.fn().mockImplementation((prefix) => {
    if (prefix === 'world') return 'world-123';
    if (prefix === 'attribute') return 'attr-123';
    if (prefix === 'skill') return 'skill-123';
    return `${prefix}-123`;
  }),
}));

// Mock the worldStore
jest.mock('../../../state/worldStore', () => {
  const mockSetState = jest.fn();
  
  return {
    worldStore: {
      setState: mockSetState,
      getState: jest.fn(() => ({ worlds: {} }))
    }
  };
});

describe('Template Loader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('applyWorldTemplate creates a world', () => {
    // Get the first template for the test
    const template = templates[0];
    
    // Apply template
    const worldId = applyWorldTemplate(template, 'Test World Name');
    
    // Check if the ID matches
    expect(worldId).toBe('world-123');
    
    // Check that setState was called
    expect(worldStore.setState).toHaveBeenCalled();
  });

  test('applyWorldTemplate uses template name when no world name provided', () => {
    // Get the first template for the test
    const template = templates[0];
    
    // Apply template without providing a name
    applyWorldTemplate(template);
    
    // Extract the updater function from the first setState call
    const setStateCall = worldStore.setState.mock.calls[0][0];
    
    // Call the updater function with an empty state
    const testState = { worlds: {} };
    const result = setStateCall(testState);
    
    // Check that the world name is set to the template name
    const world = result.worlds['world-123'];
    expect(world.name).toBe(template.name);
  });

  test('applyWorldTemplate creates world with template attributes and skills', () => {
    // Get the template for the test
    const template = templates[0]; // Western template
    
    // Apply template
    applyWorldTemplate(template);
    
    // Extract the updater function from the setState call
    const setStateCall = worldStore.setState.mock.calls[0][0];
    
    // Call the updater function with an empty state
    const testState = { worlds: {} };
    const result = setStateCall(testState);
    
    // Get the created world
    const world = result.worlds['world-123'];
    
    // Check that attributes were applied from the template
    expect(world.attributes.length).toBe(template.attributes.length);
    expect(world.attributes[0].name).toBe(template.attributes[0].name);
    expect(world.attributes[0].description).toBe(template.attributes[0].description);
    
    // Check that skills were applied from the template
    expect(world.skills.length).toBe(template.skills.length);
    expect(world.skills[0].name).toBe(template.skills[0].name);
    expect(world.skills[0].description).toBe(template.skills[0].description);
    
    // Check that skills have a difficulty property
    expect(world.skills[0].difficulty).toBe('medium');
    
    // The linkedAttributeId might be undefined initially since it depends on matching attribute names
    // Just verify it's the correct type (string or undefined)
    expect(typeof world.skills[0].linkedAttributeId === 'string' || 
           typeof world.skills[0].linkedAttributeId === 'undefined').toBeTruthy();
  });

  test('applyWorldTemplate accepts a template ID string', () => {
    // Apply template using a string ID
    const templateId = 'western';
    const worldId = applyWorldTemplate(templateId);
    
    // Check if the ID matches
    expect(worldId).toBe('world-123');
    
    // Extract the updater function from the setState call
    const setStateCall = worldStore.setState.mock.calls[0][0];
    
    // Call the updater function with an empty state
    const testState = { worlds: {} };
    const result = setStateCall(testState);
    
    // Get the created world
    const world = result.worlds['world-123'];
    
    // Check that world has correct name and description based on the template
    const westernTemplate = templates.find(t => t.id === 'western');
    expect(world.name).toBe(westernTemplate?.name);
    expect(world.description).toBe(westernTemplate?.description);
  });
  
  test('applyWorldTemplate throws error for invalid template ID', () => {
    // Apply template using an invalid string ID
    const invalidTemplateId = 'non-existent-template';
    
    // Should throw an error
    expect(() => {
      applyWorldTemplate(invalidTemplateId);
    }).toThrow(`Template with ID "${invalidTemplateId}" not found`);
    
    // Check that setState was not called
    expect(worldStore.setState).not.toHaveBeenCalled();
  });
});
