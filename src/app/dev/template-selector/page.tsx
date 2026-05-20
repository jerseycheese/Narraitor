'use client';

import React, { useState } from 'react';
import TemplateSelector from '../../../components/world/TemplateSelector/TemplateSelector';
import { templates, WorldTemplate } from '../../../lib/templates/worldTemplates';
import { applyWorldTemplate } from '../../../lib/templates/templateLoader';
import Logger from '@/lib/utils/logger';

const logger = new Logger('TemplateSelectorDev');

export default function TemplateSelectorTestHarness() {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<WorldTemplate | null>(null);
  const [appliedTemplateId, setAppliedTemplateId] = useState<string | null>(null);
  
  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const template = templates.find(t => t.id === templateId);
    setSelectedTemplate(template || null);
  };
  
  const handleApplyTemplate = () => {
    if (selectedTemplateId) {
      try {
        const worldId = applyWorldTemplate(selectedTemplateId);
        setAppliedTemplateId(selectedTemplateId);
        logger.debug(`Applied template ${selectedTemplateId} to create world ${worldId}`);
      } catch (error) {
        logger.error('Error applying template:', error);
      }
    }
  };
  
  return (
    <div>
      <h2>Template Selector Test Harness</h2>
      
      <div>
        <div>
          <h2>Template Selection</h2>
          <TemplateSelector 
            onSelect={handleSelectTemplate} 
            selectedTemplateId={selectedTemplateId}
          />
          
          {selectedTemplateId && (
            <div>
              <button
                data-testid="apply-template-button"
                
                onClick={handleApplyTemplate}
              >
                Apply Template
              </button>
            </div>
          )}
        </div>
        
        <div>
          <h2>Test Controls</h2>
          
          <div>
            <h3>Selected Template</h3>
            {selectedTemplate ? (
              <div data-testid="selected-template-info">
                <p><strong>ID:</strong> {selectedTemplate.id}</p>
                <p><strong>Name:</strong> {selectedTemplate.name}</p>
                <p><strong>Genre:</strong> {selectedTemplate.genre}</p>
                <p><strong>Attributes:</strong> {selectedTemplate.attributes.length}</p>
                <p><strong>Skills:</strong> {selectedTemplate.skills.length}</p>
              </div>
            ) : (
              <p data-testid="no-selection-message">No template selected</p>
            )}
          </div>
          
          {appliedTemplateId && (
            <div>
              <h3>Applied Template</h3>
              <div data-testid="applied-template-info" >
                <p>Successfully applied template: <strong>{appliedTemplateId}</strong></p>
                <p>Check your console for more details.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
