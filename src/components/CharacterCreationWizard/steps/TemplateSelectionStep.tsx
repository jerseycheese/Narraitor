// src/components/CharacterCreationWizard/steps/TemplateSelectionStep.tsx

import React, { useState } from 'react';
import { WizardFormSection, wizardStyles } from '@/components/shared/wizard';
import { ActiveStateCard } from '@/components/shared/cards/ActiveStateCard';
import { Button } from '@/components/ui/button';
import { CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { World, CharacterTemplate } from '@/types/world.types';
import { getGenreLabel } from '@/lib/constants/genres';

interface CharacterWizardData {
  characterData: {
    name: string;
    description: string;
    selectedTemplateId?: string | null;
    attributes?: Array<{
      attributeId: string;
      name: string;
      value: number;
      minValue: number;
      maxValue: number;
      description?: string;
    }>;
    skills?: Array<{
      skillId: string;
      name: string;
      level: number;
      minLevel: number;
      maxLevel: number;
      description?: string;
      isSelected: boolean;
      attributeIds?: string[];
      linkedAttributeId?: string;
    }>;
    background?: {
      history?: string;
      personality?: string;
      motivation?: string;
      goals?: string[];
      physicalDescription?: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  validation: {
    [stepNumber: number]: {
      valid: boolean;
      touched: boolean;
      errors: string[];
    };
  };
}

interface TemplateSelectionStepProps {
  data: CharacterWizardData;
  onUpdate: (updates: Record<string, unknown>) => void;
  onValidation: (valid: boolean, errors: string[]) => void;
  worldConfig: World;
}

export const TemplateSelectionStep: React.FC<TemplateSelectionStepProps> = ({
  data,
  onUpdate,
  worldConfig
}) => {
  const templates = worldConfig.characterTemplates || [];
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    data.characterData.selectedTemplateId || null
  );

  // Note: Template selection is always valid (optional step)
  // The validator in useCharacterCreationWizard already returns valid by default
  // No need to call onValidation here - it would create unnecessary re-renders

  const handleTemplateSelect = (template: CharacterTemplate) => {
    setSelectedTemplateId(template.id);

    // Pre-fill wizard data with template values
    const updates: Record<string, unknown> = {
      name: template.name,
      description: template.background.description,
      selectedTemplateId: template.id,
    };

    // Convert template attributes to wizard format
    if (template.attributes && worldConfig.attributes) {
      updates.attributes = template.attributes.map(attr => {
        const worldAttr = worldConfig.attributes.find(wa => wa.name === attr.name);
        return {
          attributeId: worldAttr?.id || attr.id,
          name: attr.name,
          description: worldAttr?.description,
          value: attr.value,
          minValue: worldAttr?.minValue || 0,
          maxValue: worldAttr?.maxValue || 10
        };
      });
    }

    // Convert template skills to wizard format
    if (template.skills && worldConfig.skills) {
      updates.skills = template.skills.map(skill => {
        const worldSkill = worldConfig.skills.find(ws => ws.name === skill.name);
        return {
          skillId: worldSkill?.id || skill.id,
          name: skill.name,
          description: worldSkill?.description,
          level: skill.level,
          minLevel: worldSkill?.minValue || 0,
          maxLevel: worldSkill?.maxValue || 10,
          attributeIds: worldSkill?.attributeIds || [],
          linkedAttributeId: worldSkill?.attributeIds?.[0],
          isSelected: true  // All template skills are pre-selected
        };
      });
    }

    // Pre-fill background from template
    if (template.background) {
      updates.background = {
        history: template.background.description,
        personality: template.background.personality,
        motivation: template.background.motivation,
        goals: [template.background.motivation],
        physicalDescription: template.background.physicalDescription || ''
      };
    }

    onUpdate(updates);
  };

  // Show message if no templates available
  if (templates.length === 0) {
    return (
      <WizardFormSection
        title="Choose a Starting Template"
        description="Character templates will help you get started quickly"
      >
        <div className="wizard-empty-state">
          <p>No templates available for this world yet.</p>
          <p>Continue to create your character from scratch.</p>
        </div>
      </WizardFormSection>
    );
  }

  return (
    <WizardFormSection
      title="Choose a Starting Template"
      description="Select a pre-configured character template or skip to create from scratch"
    >
      <div className="wizard-info-banner">
        <p>
          These templates are tailored to your <strong>{getGenreLabel(worldConfig.genre)}</strong> world.
          Select one to get started quickly, or skip to create your own character from scratch.
          You can customize any template values in the following steps.
        </p>
      </div>

      <div className="wizard-archetype-grid">
        {templates.map(template => (
          <ActiveStateCard
            key={template.id}
            isActive={selectedTemplateId === template.id}
            activeText="Selected Template"
            onClick={() => handleTemplateSelect(template)}
            testId="template-card"
          >
            <CardHeader>
              <CardTitle className={wizardStyles.step.title}>
                {template.name}
              </CardTitle>
              <CardDescription className={wizardStyles.step.description}>
                {template.description}
              </CardDescription>
            </CardHeader>

            <CardContent className="wizard-archetype-card-body">
              <p className={`${wizardStyles.step.description} wizard-archetype-quote`}>
                &ldquo;{template.background.personality}&rdquo;
              </p>

              {template.attributes && template.attributes.length > 0 && (
                <div className="wizard-archetype-section">
                  <h4 className="wizard-archetype-section-heading">
                    Key Attributes
                  </h4>
                  <div className="wizard-badge-row">
                    {[...template.attributes]
                      .sort((a, b) => b.value - a.value)
                      .slice(0, 3)
                      .map((attr, idx) => (
                        <Badge
                          key={`${template.id}-attr-${idx}`}
                          variant="secondary"
                        >
                          {attr.name} {attr.value}
                        </Badge>
                      ))}
                  </div>
                </div>
              )}

              {template.skills && template.skills.length > 0 && (
                <div className="wizard-archetype-section">
                  <h4 className="wizard-archetype-section-heading">
                    Best Skills
                  </h4>
                  <div className="wizard-badge-row">
                    {[...template.skills]
                      .sort((a, b) => b.level - a.level)
                      .slice(0, 3)
                      .map((skill, idx) => (
                        <Badge
                          key={`${template.id}-skill-${idx}`}
                          variant="outline"
                        >
                          {skill.name} {skill.level}
                        </Badge>
                      ))}
                  </div>
                </div>
              )}

              <div className="wizard-archetype-section">
                <h4 className="wizard-archetype-section-heading">Motivation</h4>
                <p className={`${wizardStyles.step.description} wizard-archetype-quote`}>
                  &ldquo;{template.background.motivation}&rdquo;
                </p>
              </div>

              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  handleTemplateSelect(template);
                }}
                disabled={selectedTemplateId === template.id}
              >
                {selectedTemplateId === template.id ? 'Selected' : 'Use This Template'}
              </Button>
            </CardContent>
          </ActiveStateCard>
        ))}
      </div>

      <div className="wizard-help-row">
        <p>
          Selected a template? Click <strong>Next</strong> to customize it further.
        </p>
        <p>
          All template values can be modified in the following steps.
        </p>
      </div>
    </WizardFormSection>
  );
};
