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
  
  const selectedTemplate = displayTemplates.find(t => t.id === selectedTemplateId);

  return (
    <div 
      className="space-y-6"
      data-testid="template-selector"
    >
      <div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {displayTemplates.map((template) => (
            <div
              key={template.id}
              className={`border rounded-lg p-4 cursor-pointer transition-all hover:border-blue-500 hover:shadow-md
                ${selectedTemplateId === template.id ? 'selected-template border-blue-500 bg-blue-50 shadow-md' : 'border-gray-300'}`}
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
                className="text-gray-600 mb-3 text-sm"
                data-testid={`template-description-${template.id}`}
              >
                {template.description}
              </p>
              
              <div className="text-sm text-gray-500 space-y-1">
                <p className="font-medium">{template.genre}</p>
                <p>{template.attributes.length} attributes · {template.skills.length} skills</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Show preview for selected template in a separate section */}
      {selectedTemplate && (
        <div 
          className="border rounded-lg bg-gray-50 p-6"
          data-testid={`template-preview-${selectedTemplate.id}`}
        >
          <h3 className="text-lg font-bold mb-4">Template Details: {selectedTemplate.name}</h3>
          
          <div className="space-y-4">
            {/* Attributes Section */}
            <div data-testid={`template-preview-attributes-${selectedTemplate.id}`}>
              <h4 className="font-semibold mb-2 text-gray-700">Attributes ({selectedTemplate.attributes.length})</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {selectedTemplate.attributes.map((attr) => (
                  <div key={attr.name} className="bg-white rounded p-2 border border-gray-200">
                    <span className="font-medium text-sm text-gray-900">{attr.name}</span>
                    <p className="text-xs text-gray-600 mt-0.5">{attr.description}</p>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Skills Section */}
            <div data-testid={`template-preview-skills-${selectedTemplate.id}`}>
              <h4 className="font-semibold mb-2 text-gray-700">Skills ({selectedTemplate.skills.length})</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {selectedTemplate.skills.map((skill) => (
                  <div key={skill.name} className="bg-white rounded p-2 border border-gray-200">
                    <span className="font-medium text-sm text-gray-900">{skill.name}</span>
                    <p className="text-xs text-gray-600 mt-0.5">{skill.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateSelector;
