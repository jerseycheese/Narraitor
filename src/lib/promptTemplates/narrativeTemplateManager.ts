import { narrativeTemplates } from './templates/narrative';

// Create a simple manager for narrative templates
class NarrativeTemplateManager {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private templates: Map<string, (context: any) => string> = new Map();

  constructor() {
    this.loadNarrativeTemplates();
  }

  private loadNarrativeTemplates() {
    narrativeTemplates.forEach(template => {
      if (template.generate) {
        this.templates.set(template.id, template.generate);
      }
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getTemplate(id: string): (context: any) => string {
    const template = this.templates.get(id);
    if (!template) {
      throw new Error(`Template with id '${id}' not found`);
    }
    
    return template;
  }
}

export const narrativeTemplateManager = new NarrativeTemplateManager();
