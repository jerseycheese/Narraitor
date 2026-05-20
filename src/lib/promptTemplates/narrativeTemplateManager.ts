import { narrativeTemplates } from './templates/narrative';
import type { NarrativeTemplateContext } from './templates/narrative/context';

type TemplateGenerator = (context: NarrativeTemplateContext) => string;

// Create a simple manager for narrative templates
class NarrativeTemplateManager {
  private templates: Map<string, TemplateGenerator> = new Map();

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

  getTemplate(id: string): TemplateGenerator {
    const template = this.templates.get(id);
    if (!template) {
      throw new Error(`Template with id '${id}' not found`);
    }

    return template;
  }
}

export const narrativeTemplateManager = new NarrativeTemplateManager();
