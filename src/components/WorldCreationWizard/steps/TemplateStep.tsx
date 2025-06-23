'use client';

import React from 'react';
import TemplateSelector from '../../world/TemplateSelector';
import { SmartTemplates } from '../../world/SmartTemplates';
import { applyWorldTemplate } from '../../../lib/templates/templateLoader';
import { wizardStyles, WizardFormSection } from '@/components/shared/wizard';
import { TabNavigation, TabOption } from '@/components/shared/TabNavigation';
import { WorldTemplate } from '@/lib/ai/templateGenerator';
import { AttributeSuggestion, SkillSuggestion } from '../WizardState';
import { World } from '@/types/world.types';
import { useAsyncState, useFormState } from '@/hooks';

interface TemplateStepProps {
  selectedTemplateId: string | null | undefined;
  onUpdate: (updates: Partial<World> & { 
    selectedTemplateId?: string | null; 
    createOwnWorld?: boolean;
    aiSuggestions?: {
      attributes: AttributeSuggestion[];
      skills: SkillSuggestion[];
    };
  }) => void;
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
  // Template processing state using hooks
  const templateProcessingState = useAsyncState<void>();
  
  // Mode selection state using form hook
  const modeFormState = useFormState({
    initialData: {
      currentMode: 'traditional' as TemplateMode
    }
  });

  // Tab navigation options
  const tabOptions: TabOption<TemplateMode>[] = [
    { value: 'traditional', label: 'Choose Template' },
    { value: 'smart', label: 'Generate' }
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
    
    await templateProcessingState.execute(async () => {
      // Check if this is a recent AI template
      if (selectedTemplateId.startsWith('ai-template-')) {
        // For AI templates, check sessionStorage for the data
        const recentTemplateData = sessionStorage.getItem('recent-template-data');
        if (recentTemplateData) {
          try {
            const templateData = JSON.parse(recentTemplateData);
            // Apply the AI template data directly to wizard state
            onUpdate(templateData);
            console.log('Applied recent AI template:', templateData.name);
            
            // Proceed to next step
            setTimeout(() => {
              onComplete(false);
            }, 0);
            return;
          } catch (error) {
            console.error('Failed to apply recent template:', error);
            throw error;
          }
        }
      } else {
        // Apply traditional template
        applyWorldTemplate(selectedTemplateId);
      }
      
      // Proceed to next step
      setTimeout(() => {
        onComplete(false);
      }, 0);
    });
  };
  
  // Handler for AI-generated templates
  const handleSmartTemplateGenerated = async (template: WorldTemplate) => {
    await templateProcessingState.execute(async () => {
      // Convert template data to wizard format and populate the state
      const convertedAttributes = template.attributes.map((attr) => ({
        name: attr.name,
        description: attr.description || `${attr.name} represents a core aspect of characters in this world`,
        minValue: attr.minValue,
        maxValue: attr.maxValue,
        baseValue: attr.baseValue,
        category: attr.category || 'General',
        accepted: true // Auto-accept template attributes
      }));

      const convertedSkills = template.skills.map((skill) => ({
        name: skill.name,
        description: skill.description || `${skill.name} is an important skill for characters in this world`,
        difficulty: skill.difficulty,
        category: skill.category || 'General',
        baseValue: skill.baseValue,
        minValue: skill.minValue,
        maxValue: skill.maxValue,
        accepted: true // Auto-accept template skills
      }));
      
      // Update the wizard state with template data and AI suggestions
      const updateData = { 
        selectedTemplateId: 'smart-template',
        createOwnWorld: false,
        // World data fields go at the top level (not nested under worldData)
        name: template.name,
        description: template.description,
        genre: template.genre,
        aiSuggestions: {
          attributes: convertedAttributes,
          skills: convertedSkills
        }
      };
      
      onUpdate(updateData);
      
      // Proceed to the next step (Basic Info) so user can review/modify
      onComplete(false);
    });
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
            activeValue={modeFormState.data.currentMode}
            onChange={(value) => modeFormState.updateField('currentMode', value)}
            className="mb-4"
          />
        </div>

        {/* Content based on mode */}
        {modeFormState.data.currentMode === 'traditional' ? (
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
          
          {modeFormState.data.currentMode === 'traditional' && (
            <button
              type="button"
              onClick={handleApplyTemplate}
              disabled={!selectedTemplateId || templateProcessingState.isLoading}
              className={`${wizardStyles.navigation.primaryButton} ${
                (!selectedTemplateId || templateProcessingState.isLoading) ? 'disabled:bg-gray-300 disabled:cursor-not-allowed' : ''
              }`}
              data-testid="next-button"
            >
              {templateProcessingState.isLoading ? 'Applying Template...' : 'Use Selected Template'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TemplateStep;
