import { narrativeTemplates } from './templates/narrative';
import type { NarrativeTemplateContext } from './templates/narrative/context';

type TemplateGenerator = (context: NarrativeTemplateContext) => string;

const templates = new Map<string, TemplateGenerator>();
for (const template of narrativeTemplates) {
  if (template.generate) {
    templates.set(template.id, template.generate);
  }
}

export function getNarrativeTemplate(id: string): TemplateGenerator {
  const template = templates.get(id);
  if (!template) {
    throw new Error(`Template with id '${id}' not found`);
  }

  return template;
}
