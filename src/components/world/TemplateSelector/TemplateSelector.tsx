'use client';

import React, { useCallback } from 'react';
import { templates, WorldTemplate } from '@/lib/templates/worldTemplates';
import { RecentTemplates } from '@/components/shared/RecentTemplates';
import { TemplateHistoryEntry } from '@/types/game.types';
import { convertHistoryEntryToWizardData, storeTemplateDataForWizard } from '@/lib/utils/templateHelpers';

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

  // Handler for using recent templates (converts AI template to traditional template selection)
  const handleHistoryTemplate = useCallback((entry: TemplateHistoryEntry) => {
    const templateData = convertHistoryEntryToWizardData(entry);
    storeTemplateDataForWizard(templateData);
    onSelect(templateData.selectedTemplateId!);
  }, [onSelect]);

  return (
    <div 
      className="space-y-6"
      data-testid="template-selector"
    >
      {/* Traditional Templates */}
      <div>
        <div 
          className="space-y-2"
          data-tutorial="template-list"
        >
          {displayTemplates.map((template) => (
            <div
              key={template.id}
              className={`border rounded-md p-3 cursor-pointer transition-all hover:border-blue-500
                ${selectedTemplateId === template.id ? 'selected-template border-blue-500 bg-blue-50 shadow-md' : 'border-gray-300'}`}
              onClick={() => handleSelectTemplate(template.id)}
              data-testid={`template-card-${template.id}`}
            >
              <h3 
                className="text-base font-semibold"
                data-testid={`template-name-${template.id}`}
              >
                {template.name}
              </h3>
              
              <p
                className="text-gray-700 mt-1 text-sm"
                data-testid={`template-description-${template.id}`}
              >
                {template.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Templates */}
      <RecentTemplates
        onTemplateSelect={handleHistoryTemplate}
        selectedTemplateId={selectedTemplateId}
        title="Recent Templates"
        description="Recently generated AI templates you can reuse"
      />
    </div>
  );
};

export default TemplateSelector;
