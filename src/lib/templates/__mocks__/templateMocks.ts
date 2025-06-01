/**
 * Template Mocks
 * 
 * Mock data for testing template-related functionality.
 */
import { WorldTemplate } from '../worldTemplates';

/**
 * Simplified mock template for testing
 */
export const mockTemplate: WorldTemplate = {
  id: 'test-template',
  name: 'Test Template',
  description: 'A template for testing purposes',
  genre: 'Test',
  attributes: [
    {
      name: 'Attribute 1',
      description: 'First test attribute',
      minValue: 1,
      maxValue: 10,
      defaultValue: 5
    },
    {
      name: 'Attribute 2',
      description: 'Second test attribute',
      minValue: 1,
      maxValue: 10,
      defaultValue: 5
    }
  ],
  skills: [
    {
      name: 'Skill 1',
      description: 'First test skill',
      relatedAttributes: ['Attribute 1'],
      minValue: 1,
      maxValue: 10,
      defaultValue: 3
    },
    {
      name: 'Skill 2',
      description: 'Second test skill',
      relatedAttributes: ['Attribute 1', 'Attribute 2'],
      minValue: 1,
      maxValue: 10,
      defaultValue: 3
    }
  ],
  theme: {
    name: 'Test Theme',
    primaryColor: '#000000',
    secondaryColor: '#FFFFFF',
    accentColor: '#FF0000',
    fontFamily: 'sans-serif',
    backgroundStyle: 'none'
  }
};

/**
 * Array of mock templates for testing
 */
export const mockTemplates: WorldTemplate[] = [
  mockTemplate,
  {
    ...mockTemplate,
    id: 'test-template-2',
    name: 'Test Template 2'
  },
  {
    ...mockTemplate,
    id: 'test-template-3',
    name: 'Test Template 3'
  }
];

/**
 * Get all mock templates
 */
export function getMockTemplates(): WorldTemplate[] {
  return mockTemplates;
}

/**
 * Get a mock template by ID
 */
export function getMockTemplateById(id: string): WorldTemplate | undefined {
  return mockTemplates.find(template => template.id === id);
}
