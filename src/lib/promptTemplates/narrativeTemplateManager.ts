import { narrativeTemplates } from './templates/narrative';

// Generator context shape varies per template; see individual template files.
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- intentional, see PromptTemplate
type TemplateGenerator = (context: any) => string;

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
