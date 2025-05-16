'use client';

import React, { useState } from 'react';
import TemplateSelector from '../../world/TemplateSelector';
import { applyWorldTemplate } from '../../../lib/templates/templateLoader';

interface TemplateStepProps {
  selectedTemplateId: string | null | undefined;
  onUpdate: (updates: { selectedTemplateId: string | null }) => void;
  onNext: () => void;
  onBack: () => void;
  onCancel: () => void;
  errors: Record<string, string>;
}

const TemplateStep: React.FC<TemplateStepProps> = ({
  selectedTemplateId,
  onUpdate,
  onNext,
  onCancel,
  errors,
}) => {
  const [isApplying, setIsApplying] = useState(false);
  
  // Handler for template selection
  const handleSelectTemplate = (templateId: string) => {
    onUpdate({ selectedTemplateId: templateId });
  };
  
  // Handler for proceeding with template
  const handleApplyTemplate = async () => {
    if (!selectedTemplateId) {
      return;
    }
    
    try {
      setIsApplying(true);
      // Apply the template to create a new world
      const worldId = applyWorldTemplate(selectedTemplateId);
      
      // Proceed to next step
      // Using setTimeout to ensure state updates complete before navigation
      // This fixes the test issue by ensuring the callback is executed
      setTimeout(() => {
        onNext();
        setIsApplying(false);
      }, 0);
      
      return worldId;
    } catch (error) {
      console.error('Error applying template:', error);
      setIsApplying(false);
    }
  };
  
  // Handler for creating a blank world
  const handleCreateOwnWorld = () => {
    // Clear any selected template
    onUpdate({ selectedTemplateId: null });
    // Proceed to next step without applying a template
    onNext();
  };
  
  return (
    <div data-testid="template-step">
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">Getting Started</h2>
        <p className="text-gray-600">
          You can choose a template to quickly set up your world, or create your own world from scratch.
        </p>
      </div>
      
      <TemplateSelector
        onSelect={handleSelectTemplate}
        selectedTemplateId={selectedTemplateId}
      />
      
      {errors.template && (
        <div className="mt-4 text-red-500" data-testid="template-error">
          {errors.template}
        </div>
      )}
      
      <div className="mt-6 flex justify-between">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
          data-testid="cancel-button"
        >
          Cancel
        </button>
        
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleCreateOwnWorld}
            className="px-4 py-2 rounded bg-gray-500 text-white hover:bg-gray-600"
            data-testid="create-own-button"
          >
            Create My Own World
          </button>
          
          <button
            type="button"
            onClick={handleApplyTemplate}
            disabled={!selectedTemplateId || isApplying}
            className={`px-4 py-2 rounded text-white ${
              !selectedTemplateId || isApplying
                ? 'bg-blue-300 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
            data-testid="next-button"
          >
            {isApplying ? 'Applying Template...' : 'Use Selected Template'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplateStep;
