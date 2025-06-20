'use client';

import React, { useState } from 'react';
import TemplateSelector from '../../world/TemplateSelector';
import { SmartTemplates } from '../../world/SmartTemplates';
import { applyWorldTemplate } from '../../../lib/templates/templateLoader';
import { wizardStyles, WizardFormSection } from '@/components/shared/wizard';
import { TabNavigation, TabOption } from '@/components/shared/TabNavigation';
import { WorldTemplate } from '@/lib/ai/templateGenerator';
import { NarrativeGenerator } from '@/lib/ai/narrativeGenerator';
import { geminiClient } from '@/lib/ai/geminiClient';
import { useWorldStore } from '@/state/worldStore';

interface TemplateStepProps {
  selectedTemplateId: string | null | undefined;
  onUpdate: (updates: { selectedTemplateId?: string | null; createOwnWorld?: boolean }) => void;
  errors: Record<string, string>;
  onComplete: (createOwnWorld?: boolean) => void;
  onCancel?: () => void;
}

type TemplateMode = 'traditional' | 'smart';

const TemplateStep: React.FC<TemplateStepProps> = ({
  selectedTemplateId,
  onUpdate,
  errors,
  onComplete,
  onCancel,
}) => {
  const [isApplying, setIsApplying] = useState(false);
  const [currentMode, setCurrentMode] = useState<TemplateMode>('traditional');

  // Tab navigation options
  const tabOptions: TabOption<TemplateMode>[] = [
    { value: 'traditional', label: 'Choose Template' },
    { value: 'smart', label: 'AI Generate ✨' }
  ];
  
  // Handler for template selection
  const handleSelectTemplate = (templateId: string) => {
    onUpdate({ selectedTemplateId: templateId, createOwnWorld: false });
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
        onComplete(false);
        setIsApplying(false);
      }, 0);
      
      return worldId;
    } catch {
      // Error applying template
      setIsApplying(false);
    }
  };
  
  // Handler for AI-generated templates
  const handleSmartTemplateGenerated = async (template: WorldTemplate) => {
    try {
      setIsApplying(true);
      
      // Convert template to world format and create it
      const narrativeGenerator = new NarrativeGenerator(geminiClient);
      const worldData = narrativeGenerator.convertTemplateToWorld(template);
      
      // Create the world using the world store
      const worldId = useWorldStore.getState().createWorld(worldData);
      
      // Mark as not creating own world since we're using a template
      onUpdate({ selectedTemplateId: worldId, createOwnWorld: false });
      
      // Complete the step
      onComplete(false);
      
    } catch (error) {
      console.error('Error creating world from template:', error);
    } finally {
      setIsApplying(false);
    }
  };

  // Handler for creating a blank world
  const handleCreateOwnWorld = () => {
    // Clear any selected template and set createOwnWorld flag
    onUpdate({ selectedTemplateId: null, createOwnWorld: true });
    // Proceed to next step without applying a template, passing createOwnWorld flag
    onComplete(true);
  };
  
  return (
    <div data-testid="template-step">
      <WizardFormSection
        title="Getting Started"
        description="Choose how you'd like to create your world - use existing templates, generate with AI, or start from scratch."
      >
        
        {/* Mode Selection */}
        <div className="mb-6">
          <TabNavigation
            options={tabOptions}
            activeValue={currentMode}
            onChange={setCurrentMode}
            className="mb-4"
          />
        </div>

        {/* Content based on mode */}
        {currentMode === 'traditional' ? (
          <TemplateSelector
            onSelect={handleSelectTemplate}
            selectedTemplateId={selectedTemplateId}
          />
        ) : (
          <div className="border rounded-lg p-4">
            <SmartTemplates onTemplateGenerated={handleSmartTemplateGenerated} />
          </div>
        )}
      
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
          
          {currentMode === 'traditional' && (
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
          )}
        </div>
      </div>
    </div>
  );
};

export default TemplateStep;
