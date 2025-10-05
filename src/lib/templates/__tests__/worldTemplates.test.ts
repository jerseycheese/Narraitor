import { 
  templates,
  westernTemplate,
  sitcomTemplate,
  fantasyTemplate
} from '../worldTemplates';

describe('World Templates', () => {
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
