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
      className="component-template-selector"
      data-testid="template-selector"
    >
      {/* Traditional Templates */}
      <div>
        <div className="wizard-template-list" data-tutorial="template-list">
          {displayTemplates.map((template) => {
            const isSelected = selectedTemplateId === template.id;
            return (
              <div
                key={template.id}
                className={`wizard-card ${isSelected ? 'wizard-card-selected selected-template' : 'wizard-card-unselected'}`}
                onClick={() => handleSelectTemplate(template.id)}
                data-testid={`template-card-${template.id}`}
              >
                <h3
                  className="wizard-card-title"
                  data-testid={`template-name-${template.id}`}
                >
                  {template.name}
                </h3>

                <p
                  className="wizard-card-description"
                  data-testid={`template-description-${template.id}`}
                >
                  {template.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Templates */}
      <RecentTemplates
        onTemplateSelect={handleHistoryTemplate}
        selectedTemplateId={selectedTemplateId}
        title="Recent Templates"
        description="Recently generated templates you can reuse"
      />
    </div>
  );
};

export default TemplateSelector;
