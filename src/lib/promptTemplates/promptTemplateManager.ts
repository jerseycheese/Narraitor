import { PromptTemplate, PromptType, VariableValues } from './types';

/**
 * Manager for prompt templates that handles creation, retrieval, 
 * and processing of templates with variable substitution.
 * 
 * This implementation meets the acceptance criteria:
 * - Supports different prompt types through the PromptType enum
 * - Allows variable substitution with standardized {{variable}} syntax
 * - Supports templates with appropriate AI instructions based on purpose
 * - Organizes templates by use case type with retrieval methods
 * - Validates templates to ensure they contain required elements
 */
export class PromptTemplateManager {
  private templates: Map<string, PromptTemplate> = new Map();

  /**
   * Adds a new template to the manager.
   * @param template - The template to add
   * @throws Error if a template with the same id already exists
   */
  addTemplate(template: PromptTemplate): void {
    this.validateTemplate(template);
    
    if (this.templates.has(template.id)) {
      throw new Error(`Template with id '${template.id}' already exists`);
    }
    
    this.templates.set(template.id, template);
  }

  /**
   * Retrieves a template by its id.
   * @param id - The id of the template to retrieve
   * @returns The template or undefined if not found
   */
  getTemplate(id: string): PromptTemplate | undefined {
    return this.templates.get(id);
  }

  /**
   * Updates an existing template.
   * @param id - The id of the template to update
   * @param updatedTemplate - The new template data
   * @throws Error if the template does not exist
   */
  updateTemplate(id: string, updatedTemplate: PromptTemplate): void {
    if (!this.templates.has(id)) {
      throw new Error(`Template with id '${id}' not found`);
    }
    
    this.validateTemplate(updatedTemplate);
    this.templates.set(id, updatedTemplate);
  }

  /**
   * Removes a template by its id.
   * @param id - The id of the template to remove
   */
  removeTemplate(id: string): void {
    this.templates.delete(id);
  }

  /**
   * Processes a template by substituting variables with provided values.
   * @param id - The id of the template to process
   * @param variables - The variable values to substitute
   * @returns The processed template content with variables substituted
   * @throws Error if the template does not exist
   */
  processTemplate(id: string, variables: VariableValues): string {
    const template = this.getTemplate(id);
    
    if (!template) {
      throw new Error(`Template with id '${id}' not found`);
    }
    
    let processedContent = template.content;
    
    for (const variable of template.variables) {
      const value = variables[variable.name];
      
      if (value !== undefined) {
        // Replace all occurrences of the variable placeholder with its value
        const placeholder = `{{${this.escapeRegExp(variable.name)}}}`;
        processedContent = processedContent.replace(
          new RegExp(placeholder, 'g'), 
          value
        );
      }
    }
    
    return processedContent;
  }

  /**
   * Retrieves all templates of a specific type.
   * @param type - The type of templates to retrieve
   * @returns An array of templates of the specified type
   */
  getTemplatesByType(type: PromptType): PromptTemplate[] {
    const result: PromptTemplate[] = [];
    
    for (const template of this.templates.values()) {
      if (template.type === type) {
        result.push(template);
      }
    }
    
    return result;
  }

  /**
   * Retrieves all templates.
   * @returns An array of all templates
   */
  getAllTemplates(): PromptTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Retrieves all template types currently in use.
   * @returns An array of unique template types
   */
  getAllTemplateTypes(): PromptType[] {
    const types = new Set<PromptType>();
    
    for (const template of this.templates.values()) {
      types.add(template.type);
    }
    
    return Array.from(types);
  }

  /**
   * Validates a template for required fields and variable references.
   * @param template - The template to validate
   * @throws Error if the template is invalid
   */
  validateTemplate(template: PromptTemplate): void {
    // Check required fields
    if (!template.id) {
      throw new Error('Template is missing required fields: id');
    }
    if (!template.type) {
      throw new Error('Template is missing required fields: type');
    }
    if (!template.content) {
      throw new Error('Template is missing required fields: content');
    }
    if (!template.variables) {
      throw new Error('Template is missing required fields: variables');
    }
    
    // Check if all referenced variables are defined
    const variableNames = new Set(template.variables.map(v => v.name));
    const referencedVariables = this.extractReferencedVariables(template.content);
    
    for (const variable of referencedVariables) {
      if (!variableNames.has(variable)) {
        throw new Error(`Template references undefined variable: ${variable}`);
      }
    }
  }

  /**
   * Extracts variable names from template content.
   * @param content - The template content to extract variables from
   * @returns An array of variable names
   * @private
   */
  private extractReferencedVariables(content: string): string[] {
    const matches = content.match(/{{([^{}]+)}}/g) || [];
    return matches.map(match => match.substring(2, match.length - 2));
  }

  /**
   * Escapes regular expression special characters in a string.
   * @param string - The string to escape
   * @returns The escaped string
   * @private
   */
  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

// Export singleton instance
export const promptTemplateManager = new PromptTemplateManager();
