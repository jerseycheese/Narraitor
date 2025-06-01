/**
 * Adapter to convert a function-based template into a PromptTemplate object
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createTemplateAdapter(templateFn: (context: any) => string): (context: any) => string {
  return templateFn;
}