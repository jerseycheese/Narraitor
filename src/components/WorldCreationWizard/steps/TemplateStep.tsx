'use client';

import React, { useState } from 'react';
import TemplateSelector from '../../world/TemplateSelector';
import { applyWorldTemplate } from '../../../lib/templates/templateLoader';
import { wizardStyles, WizardFormSection } from '@/components/shared/wizard';

interface TemplateStepProps {
  selectedTemplateId: string | null | undefined;
  onUpdate: (updates: { selectedTemplateId: string | null }) => void;
  errors: Record<string, string>;
  onComplete: () => void;
  onCancel?: () => void;
}

const TemplateStep: React.FC<TemplateStepProps> = ({
  selectedTemplateId,
  onUpdate,
  errors,
  onComplete,
  onCancel,
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
        onComplete();
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
    onComplete();
  };
  
  return (
    <div data-testid="template-step">
      <WizardFormSection
        title="Getting Started"
        description="You can choose a template to quickly set up your world, or create your own world from scratch."
      >
      
      <TemplateSelector
        onSelect={handleSelectTemplate}
        selectedTemplateId={selectedTemplateId}
      />
      
      </WizardFormSection>
      
      {errors.template && (
        <div className={"mt-4 " + wizardStyles.form.error} data-testid="template-error">
          {errors.template}
        </div>
      )}
      
      <div className="mt-6 flex justify-between">
        <button
          type="button"
          onClick={onCancel || (() => window.history.back())}
          className={wizardStyles.navigation.cancelButton}
        >
          Cancel
        </button>
        
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleCreateOwnWorld}
            className={wizardStyles.navigation.secondaryButton}
            data-testid="create-own-button"
          >
            Create My Own World
          </button>
          
          <button
            type="button"
            onClick={handleApplyTemplate}
            disabled={!selectedTemplateId || isApplying}
            className={`${wizardStyles.navigation.primaryButton} ${
              (!selectedTemplateId || isApplying) ? 'disabled:bg-gray-300 disabled:cursor-not-allowed' : ''
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
