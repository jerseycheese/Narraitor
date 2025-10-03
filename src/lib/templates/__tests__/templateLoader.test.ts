import { applyWorldTemplate } from '../templateLoader';
import { templates } from '../worldTemplates';
import { useWorldStore } from '@/state/worldStore';

// Mock the generateUniqueId function
jest.mock('../../utils/generateId', () => ({
  generateUniqueId: jest.fn().mockImplementation((prefix) => {
    if (prefix === 'world') return 'world-123';
    if (prefix === 'attribute') return `attr-${Math.random().toString(36).substr(2, 9)}`;
    if (prefix === 'skill') return `skill-${Math.random().toString(36).substr(2, 9)}`;
    return `${prefix}-123`;
  }),
}));

// Mock store functions
const mockCreateWorld = jest.fn(() => 'world-123');
const mockUpdateWorld = jest.fn();

jest.mock('@/state/worldStore', () => ({
  useWorldStore: {
    getState: jest.fn(() => ({
      createWorld: mockCreateWorld,
      updateWorld: mockUpdateWorld,
      worlds: {}
    }))
  }
}));

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

    // Check that createWorld was called with base data
    expect(mockCreateWorld).toHaveBeenCalledWith({
      name: 'Test World Name',
      description: template.description,
      genre: template.genre,
      attributes: [],
      skills: [],
      settings: {
        maxAttributes: 6,
        maxSkills: 12,
        attributePointPool: 30,
        skillPointPool: 36
      }
    });

    // Check that updateWorld was called with attributes and skills
    expect(mockUpdateWorld).toHaveBeenCalledWith('world-123', {
      attributes: expect.arrayContaining([
        expect.objectContaining({
          worldId: 'world-123',
          name: expect.any(String),
          description: expect.any(String)
        })
      ]),
      skills: expect.arrayContaining([
        expect.objectContaining({
          worldId: 'world-123',
          name: expect.any(String),
          description: expect.any(String)
        })
      ])
    });
  });

  test('applyWorldTemplate uses template name when no world name provided', () => {
    // Get the first template for the test
    const template = templates[0];

    // Apply template without providing a name
    applyWorldTemplate(template);

    // Check that createWorld was called with template name
    expect(mockCreateWorld).toHaveBeenCalledWith(
      expect.objectContaining({
        name: template.name
      })
    );
  });

  test('applyWorldTemplate creates world with template attributes and skills', () => {
    // Get the template for the test
    const template = templates[0]; // Western template

    // Apply template
    applyWorldTemplate(template);

    // Check that updateWorld was called with correct number of attributes and skills
    const updateCall = mockUpdateWorld.mock.calls[0];
    expect(updateCall).toBeDefined();

    const [worldId, updates] = updateCall;
    expect(worldId).toBe('world-123');

    // Check attributes
    expect(updates.attributes).toHaveLength(template.attributes.length);
    expect(updates.attributes[0]).toEqual(
      expect.objectContaining({
        name: template.attributes[0].name,
        description: template.attributes[0].description,
        worldId: 'world-123'
      })
    );

    // Check skills
    expect(updates.skills).toHaveLength(template.skills.length);
    expect(updates.skills[0]).toEqual(
      expect.objectContaining({
        name: template.skills[0].name,
        description: template.skills[0].description,
        worldId: 'world-123',
        difficulty: 'medium'
      })
    );

    // Verify attributeIds is array or undefined
    expect(Array.isArray(updates.skills[0].attributeIds) ||
           typeof updates.skills[0].attributeIds === 'undefined').toBeTruthy();
  });

  test('applyWorldTemplate accepts a template ID string', () => {
    // Apply template using a string ID
    const templateId = 'western';
    const worldId = applyWorldTemplate(templateId);

    // Check if the ID matches
    expect(worldId).toBe('world-123');

    // Check that world has correct name and description based on the template
    const westernTemplate = templates.find(t => t.id === 'western');
    expect(mockCreateWorld).toHaveBeenCalledWith(
      expect.objectContaining({
        name: westernTemplate?.name,
        description: westernTemplate?.description
      })
    );
  });
  
  test('applyWorldTemplate throws error for invalid template ID', () => {
    // Apply template using an invalid string ID
    const invalidTemplateId = 'non-existent-template';

    // Should throw an error
    expect(() => {
      applyWorldTemplate(invalidTemplateId);
    }).toThrow(`Template with ID "${invalidTemplateId}" not found`);

    // Check that createWorld was not called
    expect(mockCreateWorld).not.toHaveBeenCalled();
  });
});
