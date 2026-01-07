// src/components/CharacterCreationWizard/steps/TemplateSelectionStep.tsx

import React, { useState, useEffect } from 'react';
import { WizardFormSection } from '@/components/shared/wizard';
import { ActiveStateCard } from '@/components/shared/cards/ActiveStateCard';
import { Button } from '@/components/ui/button';
import { CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { World, CharacterTemplate } from '@/types/world.types';

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
  onValidation,
  worldConfig
}) => {
  const templates = worldConfig.characterTemplates || [];
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    data.characterData.selectedTemplateId || null
  );

  // Notify parent that template selection is always valid (optional step)
  useEffect(() => {
    onValidation(true, []);
  }, [onValidation]);

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
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">
            No templates available for this world yet.
          </p>
          <p className="text-sm text-muted-foreground">
            Continue to create your character from scratch.
          </p>
        </div>
      </WizardFormSection>
    );
  }

  return (
    <WizardFormSection
      title="Choose a Starting Template"
      description="Select a pre-configured character template or skip to create from scratch"
    >
      {/* Info banner */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-700">
          These templates are tailored to your <strong>{worldConfig.genre}</strong> world.
          Select one to get started quickly, or skip to create your own character from scratch.
          You can customize any template values in the following steps.
        </p>
      </div>

      {/* Template Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {templates.map(template => (
          <ActiveStateCard
            key={template.id}
            isActive={selectedTemplateId === template.id}
            activeText="Selected Template"
            onClick={() => handleTemplateSelect(template)}
            activeClassName="border-green-500 bg-green-50 shadow-xl ring-2 ring-green-500"
            inactiveClassName="border-gray-300 bg-white hover:shadow-lg hover:border-gray-400"
            testId="template-card"
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-xl font-bold text-gray-900">
                {template.name}
              </CardTitle>
              <CardDescription className="text-sm text-gray-700">
                {template.description}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Personality */}
              <div>
                <p className="text-sm text-gray-700 leading-relaxed italic">
                  &ldquo;{template.background.personality}&rdquo;
                </p>
              </div>

              {/* Top 3 Attributes */}
              {template.attributes && template.attributes.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">
                    Key Attributes
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {template.attributes
                      .sort((a, b) => b.value - a.value)
                      .slice(0, 3)
                      .map((attr, idx) => (
                        <Badge
                          key={`${template.id}-attr-${idx}`}
                          variant="secondary"
                          className="text-xs"
                        >
                          {attr.name} {attr.value}
                        </Badge>
                      ))}
                  </div>
                </div>
              )}

              {/* Top 3 Skills */}
              {template.skills && template.skills.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">
                    Best Skills
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {template.skills
                      .sort((a, b) => b.level - a.level)
                      .slice(0, 3)
                      .map((skill, idx) => (
                        <Badge
                          key={`${template.id}-skill-${idx}`}
                          variant="outline"
                          className="text-xs"
                        >
                          {skill.name} {skill.level}
                        </Badge>
                      ))}
                  </div>
                </div>
              )}

              {/* Motivation */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-1">
                  Motivation
                </h4>
                <p className="text-xs text-gray-700 italic">
                  &ldquo;{template.background.motivation}&rdquo;
                </p>
              </div>

              {/* Select Button */}
              <Button
                className="w-full mt-4"
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

      {/* Help Text */}
      <div className="mt-6 text-center space-y-2">
        <p className="text-sm text-muted-foreground">
          Selected a template? Click <strong>Next</strong> to customize it further.
        </p>
        <p className="text-xs text-muted-foreground">
          All template values can be modified in the following steps.
        </p>
      </div>
    </WizardFormSection>
  );
};
