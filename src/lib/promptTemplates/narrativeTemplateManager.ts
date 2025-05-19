import { PromptTemplateManager } from './promptTemplateManager';
import { narrativeTemplates } from './templates/narrative';

// Create a singleton instance with narrative templates pre-loaded
class NarrativeTemplateManager extends PromptTemplateManager {
  constructor() {
    super();
    this.loadNarrativeTemplates();
  }

  private loadNarrativeTemplates() {
    narrativeTemplates.forEach(template => {
      this.addTemplate(template);
    });
  }

  getTemplate(id: string): ((context: any) => string) {
    const template = super.getTemplate(id);
    if (!template) {
      throw new Error(`Template with id '${id}' not found`);
    }
    
    // Return the generate function if it exists, otherwise return a function that returns content
    return template.generate || ((context: any) => template.content);
  }
}

export const narrativeTemplateManager = new NarrativeTemplateManager();