import { narrativeTemplates } from './templates/narrative';

// Generator context shape varies per template; see individual template files.
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- intentional, see PromptTemplate
type TemplateGenerator = (context: any) => string;

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
