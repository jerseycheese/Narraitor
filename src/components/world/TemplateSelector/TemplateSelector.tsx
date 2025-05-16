'use client';

import React from 'react';
import { templates, WorldTemplate } from '../../../lib/templates/worldTemplates';

export interface TemplateSelectorProps {
  /**
   * Array of templates to display
   */
  templates?: WorldTemplate[];
  
  /**
   * Callback when a template is selected
   */
  onSelect: (templateId: string) => void;
  
  /**
   * Optional currently selected template ID
   */
  selectedTemplateId?: string | null;
}

/**
 * Component for selecting predefined world templates
 */
const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  templates: providedTemplates,
  onSelect,
  selectedTemplateId = null
}) => {
  // Use provided templates or default to the imported templates
  const displayTemplates = providedTemplates || templates;
  
  // Handler for template selection
  const handleSelectTemplate = (templateId: string) => {
    onSelect(templateId);
  };
  
  // Render a template preview
  const renderTemplatePreview = (template: WorldTemplate) => {
    return (
      <div 
        className="border p-4 mt-2 bg-gray-50 rounded"
        data-testid={`template-preview-${template.id}`}
      >
        <h4 className="font-bold mb-2">Template Details</h4>
        
        <div data-testid={`template-preview-attributes-${template.id}`}>
          <h5 className="font-semibold mb-1">Attributes ({template.attributes.length})</h5>
          <ul className="text-sm">
            {template.attributes.map((attr) => (
              <li key={attr.name} className="mb-1">
                <span className="font-medium">{attr.name}</span>: {attr.description}
              </li>
            ))}
          </ul>
        </div>
        
        <div 
          className="mt-3"
          data-testid={`template-preview-skills-${template.id}`}
        >
          <h5 className="font-semibold mb-1">Skills ({template.skills.length})</h5>
          <ul className="text-sm">
            {template.skills.map((skill) => (
              <li key={skill.name} className="mb-1">
                <span className="font-medium">{skill.name}</span>: {skill.description}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  };
  
  return (
    <div 
      className="p-4"
      data-testid="template-selector"
    >
      <h2 className="text-xl font-bold mb-4">Choose a World Template</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {displayTemplates.map((template) => (
          <div key={template.id}>
            <div
              className={`border rounded p-4 cursor-pointer transition-colors hover:border-blue-500
                ${selectedTemplateId === template.id ? 'selected-template border-blue-500 bg-blue-50' : 'border-gray-300'}`}
              onClick={() => handleSelectTemplate(template.id)}
              data-testid={`template-card-${template.id}`}
            >
              <h3 
                className="text-lg font-bold mb-2"
                data-testid={`template-name-${template.id}`}
              >
                {template.name}
              </h3>
              
              <p
                className="text-gray-600 mb-2"
                data-testid={`template-description-${template.id}`}
              >
                {template.description}
              </p>
              
              <div className="text-sm text-gray-500">
                <p>Genre: {template.genre}</p>
                <p>{template.attributes.length} attributes · {template.skills.length} skills</p>
              </div>
            </div>
            
            {/* Show preview for selected template */}
            {selectedTemplateId === template.id && renderTemplatePreview(template)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TemplateSelector;
