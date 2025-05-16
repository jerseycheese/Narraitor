import { 
  templates,
  westernTemplate,
  sitcomTemplate,
  fantasyTemplate
} from '../worldTemplates';

describe('World Templates', () => {
  // Test template data structure integrity
  test('all templates have required fields', () => {
    const allTemplates = [westernTemplate, sitcomTemplate, fantasyTemplate];
    
    allTemplates.forEach(template => {
      expect(template).toHaveProperty('id');
      expect(template).toHaveProperty('name');
      expect(template).toHaveProperty('description');
      expect(template).toHaveProperty('genre');
      expect(template).toHaveProperty('attributes');
      expect(template).toHaveProperty('skills');
      expect(template).toHaveProperty('theme');
    });
  });

  // Test attribute structure
  test('template attributes have required fields', () => {
    const allTemplates = [westernTemplate, sitcomTemplate, fantasyTemplate];
    
    allTemplates.forEach(template => {
      template.attributes.forEach(attr => {
        expect(attr).toHaveProperty('name');
        expect(attr).toHaveProperty('description');
        expect(attr).toHaveProperty('minValue');
        expect(attr).toHaveProperty('maxValue');
        expect(attr).toHaveProperty('defaultValue');
      });
    });
  });

  // Test skills structure
  test('template skills have required fields', () => {
    const allTemplates = [westernTemplate, sitcomTemplate, fantasyTemplate];
    
    allTemplates.forEach(template => {
      template.skills.forEach(skill => {
        expect(skill).toHaveProperty('name');
        expect(skill).toHaveProperty('description');
        expect(skill).toHaveProperty('relatedAttributes');
        expect(skill).toHaveProperty('minValue');
        expect(skill).toHaveProperty('maxValue');
        expect(skill).toHaveProperty('defaultValue');
      });
    });
  });

  // Test attribute limits
  test('templates respect attribute limits', () => {
    const allTemplates = [westernTemplate, sitcomTemplate, fantasyTemplate];
    
    allTemplates.forEach(template => {
      expect(template.attributes.length).toBeLessThanOrEqual(6); // MVP limit of 6 attributes
    });
  });

  // Test skill limits
  test('templates respect skill limits', () => {
    const allTemplates = [westernTemplate, sitcomTemplate, fantasyTemplate];
    
    allTemplates.forEach(template => {
      expect(template.skills.length).toBeLessThanOrEqual(12); // MVP limit of 12 skills
    });
  });

  // Test templates array
  test('templates array contains all templates', () => {
    expect(templates).toHaveLength(3);
    expect(templates).toContain(westernTemplate);
    expect(templates).toContain(sitcomTemplate);
    expect(templates).toContain(fantasyTemplate);
  });

  // Test template ID lookup
  test('templates can be found by ID', () => {
    const western = templates.find(t => t.id === 'western');
    expect(western).toBeDefined();
    expect(western?.name).toBe('Western');
    
    const sitcom = templates.find(t => t.id === 'sitcom');
    expect(sitcom).toBeDefined();
    expect(sitcom?.name).toBe('Sitcom');
    
    const fantasy = templates.find(t => t.id === 'fantasy');
    expect(fantasy).toBeDefined();
    expect(fantasy?.name).toBe('Fantasy');
  });
});