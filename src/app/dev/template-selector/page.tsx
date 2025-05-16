'use client';

import React, { useState } from 'react';
import TemplateSelector from '../../../components/world/TemplateSelector/TemplateSelector';
import { templates, WorldTemplate } from '../../../lib/templates/worldTemplates';
import { applyWorldTemplate } from '../../../lib/templates/templateLoader';

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
        console.log(`Applied template ${selectedTemplateId} to create world ${worldId}`);
      } catch (error) {
        console.error('Error applying template:', error);
      }
    }
  };
  
  return (
    <div className="p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-4" data-testid="test-harness-title">Template Selector Test Harness</h1>
      
      <div className="flex gap-6 flex-col md:flex-row">
        <div className="w-full md:w-2/3">
          <h2 className="text-xl font-semibold mb-2">Template Selection</h2>
          <TemplateSelector 
            onSelect={handleSelectTemplate} 
            selectedTemplateId={selectedTemplateId}
          />
          
          {selectedTemplateId && (
            <div className="mt-4">
              <button
                data-testid="apply-template-button"
                className="px-4 py-2 bg-green-500 text-white rounded"
                onClick={handleApplyTemplate}
              >
                Apply Template
              </button>
            </div>
          )}
        </div>
        
        <div className="w-full md:w-1/3">
          <h2 className="text-xl font-semibold mb-2">Test Controls</h2>
          
          <div className="mb-4 p-4 border rounded">
            <h3 className="text-lg font-semibold mb-2">Selected Template</h3>
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
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">Applied Template</h3>
              <div data-testid="applied-template-info" className="p-3 bg-green-100 rounded">
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