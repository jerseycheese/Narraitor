'use client';

import React, { useState } from 'react';
import TemplateSelector from '../../world/TemplateSelector';
import { SmartTemplates } from '../../world/SmartTemplates';
import { applyWorldTemplate } from '../../../lib/templates/templateLoader';
import { wizardStyles, WizardFormSection } from '@/components/shared/wizard';
import { TabNavigation, TabOption } from '@/components/shared/TabNavigation';
import { WorldTemplate } from '@/lib/ai/templateGenerator';
import { AttributeSuggestion, SkillSuggestion } from '../WizardState';
import { World } from '@/types/world.types';

interface TemplateStepProps {
  selectedTemplateId: string | null | undefined;
  onUpdate: (updates: { 
    selectedTemplateId?: string | null; 
    createOwnWorld?: boolean;
    worldData?: Partial<World>;
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
  const [isApplying, setIsApplying] = useState(false);
  const [currentMode, setCurrentMode] = useState<TemplateMode>('traditional');

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
      
      // Convert template data to wizard format and populate the state
      const convertedAttributes = template.attributes.map((attr) => ({
        name: attr.name,
        description: `${attr.name} attribute for this world`,
        minValue: attr.minValue,
        maxValue: attr.maxValue,
        baseValue: attr.baseValue,
        category: attr.category || 'General',
        accepted: true // Auto-accept template attributes
      }));

      const convertedSkills = template.skills.map((skill) => ({
        name: skill.name,
        description: `${skill.name} skill for this world`,
        difficulty: skill.difficulty,
        category: skill.category || 'General',
        baseValue: skill.baseValue,
        minValue: skill.minValue,
        maxValue: skill.maxValue,
        accepted: true // Auto-accept template skills
      }));
      
      // Update the wizard state with template data and AI suggestions
      onUpdate({ 
        selectedTemplateId: 'smart-template',
        createOwnWorld: false,
        worldData: {
          name: template.name,
          description: template.description,
          genre: template.genre,
        },
        aiSuggestions: {
          attributes: convertedAttributes,
          skills: convertedSkills
        }
      });
      
      // Proceed to the next step (Basic Info) so user can review/modify
      onComplete(false);
      
    } catch (error) {
      console.error('Error processing template:', error);
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
