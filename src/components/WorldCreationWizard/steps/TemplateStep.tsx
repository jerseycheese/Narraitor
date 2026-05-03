'use client';

import React, { useState } from 'react';
import TemplateSelector from '@/components/world/TemplateSelector';
import { SmartTemplates } from '@/components/world/SmartTemplates';
import { applyWorldTemplate } from '@/lib/templates/templateLoader';
import { wizardStyles, WizardFormSection } from '@/components/shared/wizard';
import { TabNavigation, TabOption } from '@/components/shared/TabNavigation';
import { WorldTemplate } from '@/lib/ai/templateGenerator';
import {
  AttributeSuggestion,
  SkillSuggestion,
} from '@/types/ai-suggestions.types';
import { World } from '@/types/world.types';
import { Button } from '@/components/ui/button';
import { AIGuidanceSource } from '@/lib/constants/worldGuidance';
import { toGenreValue } from '@/lib/constants/genres';

interface TemplateStepProps {
  selectedTemplateId: string | null | undefined;
  onUpdate: (
    updates: Partial<World> & {
      selectedTemplateId?: string | null;
      createOwnWorld?: boolean;
      aiSuggestions?: {
        attributes: AttributeSuggestion[];
        skills: SkillSuggestion[];
      };
      aiSuggestionMeta?: {
        source: AIGuidanceSource;
        generatedAt?: string;
        descriptionSnapshot?: string;
      };
      aiSuggestionsGenerated?: boolean;
    }
  ) => void;
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

  const createSuggestionMeta = (
    description: string,
    source: AIGuidanceSource
  ) => ({
    source,
    generatedAt: new Date().toISOString(),
    descriptionSnapshot: (description || '').trim(),
  });

  // Tab navigation options
  const tabOptions: TabOption<TemplateMode>[] = [
    { value: 'traditional', label: 'Choose Template' },
    { value: 'smart', label: 'Generate' },
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

      // Check if this is a recent AI template
      if (selectedTemplateId.startsWith('ai-template-')) {
        // For AI templates, check sessionStorage for the data
        const recentTemplateData = sessionStorage.getItem(
          'recent-template-data'
        );
        if (recentTemplateData) {
          try {
            const templateData = JSON.parse(recentTemplateData);
            // Apply the AI template data directly to wizard state
            onUpdate({
              ...templateData,
              aiSuggestionsGenerated: true,
              aiSuggestionMeta:
                templateData.aiSuggestionMeta ??
                createSuggestionMeta(
                  templateData.description || '',
                  'template'
                ),
            });

            // Proceed to next step
            setTimeout(() => {
              onComplete(false);
              setIsApplying(false);
            }, 0);
            return;
          } catch (error) {
            console.error('Failed to apply recent template:', error);
          }
        }
      } else {
        // Apply traditional template
        applyWorldTemplate(selectedTemplateId);
      }

      // Proceed to next step
      setTimeout(() => {
        onComplete(false);
        setIsApplying(false);
      }, 0);
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
        description:
          attr.description ||
          `${attr.name} represents a core aspect of characters in this world`,
        minValue: attr.minValue,
        maxValue: attr.maxValue,
        baseValue: attr.baseValue,
        category: attr.category || 'General',
        accepted: true, // Auto-accept template attributes
      }));

      const convertedSkills = template.skills.map((skill) => ({
        name: skill.name,
        description:
          skill.description ||
          `${skill.name} is an important skill for characters in this world`,
        difficulty: skill.difficulty,
        category: skill.category || 'General',
        baseValue: skill.baseValue,
        minValue: skill.minValue,
        maxValue: skill.maxValue,
        accepted: true, // Auto-accept template skills
      }));

      // Update the wizard state with template data and AI suggestions
      const updateData = {
        selectedTemplateId: 'smart-template',
        createOwnWorld: false,
        // World data fields go at the top level (not nested under worldData)
        name: template.name,
        description: template.description,
        genre: toGenreValue(template.genre),
        aiSuggestions: {
          attributes: convertedAttributes,
          skills: convertedSkills,
        },
        aiSuggestionMeta: createSuggestionMeta(
          template.description,
          'template'
        ),
        aiSuggestionsGenerated: true,
      };

      onUpdate(updateData);

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
    onUpdate({
      selectedTemplateId: null,
      createOwnWorld: true,
      aiSuggestionMeta: undefined,
      aiSuggestionsGenerated: false,
      aiSuggestions: undefined,
    });
    // Proceed to next step without applying a template, passing createOwnWorld flag
    onComplete(true);
  };

  return (
    <div className="component-template-step" data-testid="template-step">
      <WizardFormSection
        title="Getting Started"
        description="Choose how you'd like to create your world - use existing templates, generate automatically, or start from scratch."
      >
        {/* Mode Selection */}
        <div data-tutorial="world-type-selector">
          <div className="wizard-template-mode-grid">
            <div className="wizard-panel">
              <h4 className="wizard-card-title">Start from Scratch</h4>
              <p className="wizard-card-description">
                Build your world without a template and define everything as
                you go.
              </p>
              <div className="wizard-card-actions">
                <Button
                  type="button"
                  onClick={handleCreateOwnWorld}
                  variant="outline"
                  data-testid="create-own-button"
                  data-tutorial="create-own-world-btn"
                >
                  Create My Own World
                </Button>
              </div>
            </div>

            <div className="wizard-template-mode-divider">
              <span />
              <span>or</span>
              <span />
            </div>

            <div className="wizard-panel">
              <h4 className="wizard-card-title">Use a Template</h4>
              <p className="wizard-card-description">
                Pick a curated template or generate one to jump-start your
                world.
              </p>
              <div data-tutorial="generate-tab">
                <TabNavigation
                  options={tabOptions}
                  activeValue={currentMode}
                  onChange={setCurrentMode}
                />
              </div>
              <div>
                {currentMode === 'traditional' ? (
                  <TemplateSelector
                    onSelect={handleSelectTemplate}
                    selectedTemplateId={selectedTemplateId}
                  />
                ) : (
                  <SmartTemplates
                    onTemplateGenerated={handleSmartTemplateGenerated}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </WizardFormSection>

      {errors.template && (
        <div
          className={wizardStyles.form.error}
          data-testid="template-error"
        >
          {errors.template}
        </div>
      )}

      <div className="wizard-button-row">
        <Button
          type="button"
          onClick={onCancel || (() => window.history.back())}
          variant="outline"
        >
          Cancel
        </Button>

        {currentMode === 'traditional' && (
          <Button
            type="button"
            onClick={handleApplyTemplate}
            disabled={!selectedTemplateId || isApplying}
            data-testid="next-button"
          >
            {isApplying ? 'Applying Template...' : 'Use Selected Template'}
          </Button>
        )}
      </div>
    </div>
  );
};

export default TemplateStep;
