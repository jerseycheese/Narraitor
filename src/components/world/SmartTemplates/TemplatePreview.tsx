// src/components/world/SmartTemplates/TemplatePreview.tsx

import React from 'react';
import { WorldTemplate } from '@/lib/ai/templateGenerator';
import { wizardStyles } from '@/components/shared/wizard/styles/wizardStyles';
import { SkillDifficulty } from '@/components/ui/SkillDifficulty';

interface TemplatePreviewProps {
  template: WorldTemplate;
  onUse: () => void;
  onBack: () => void;
}

export const TemplatePreview: React.FC<TemplatePreviewProps> = ({
  template,
  onUse,
  onBack
}) => {
  return (
    <div className={wizardStyles.container}>
      <div className={wizardStyles.header}>
        <h2 className={wizardStyles.title}>Template Preview</h2>
        <p className="text-gray-600">Review your generated world template before using it</p>
      </div>

      <div className="space-y-6">
        {/* Basic Info */}
        <div className={wizardStyles.card.base}>
          <h3 className="text-xl font-bold mb-4">{template.name}</h3>
          <div className="space-y-3">
            <div>
              <span className="font-medium text-gray-700">Theme:</span>
              <span className={`ml-2 ${wizardStyles.badge.base} ${wizardStyles.badge.primary}`}>
                {template.theme}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700 block mb-2">Description:</span>
              <p className="text-gray-800 leading-relaxed">{template.description}</p>
            </div>
          </div>
        </div>

        {/* AI Explanation */}
        {template.explanation && (
          <div className={wizardStyles.card.base}>
            <h4 className="font-semibold mb-3 text-blue-700">Why these attributes and skills?</h4>
            <p className="text-gray-700 leading-relaxed">{template.explanation}</p>
          </div>
        )}

        {/* Attributes */}
        <div className={wizardStyles.card.base}>
          <h4 className="font-semibold mb-4">Attributes ({template.attributes.length})</h4>
          <div className="grid gap-3 md:grid-cols-2">
            {template.attributes.map((attr, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <span className="font-medium">{attr.name}</span>
                  {attr.category && (
                    <span className={`ml-2 ${wizardStyles.badge.base} ${wizardStyles.badge.secondary}`}>
                      {attr.category}
                    </span>
                  )}
                </div>
                <div className="text-right text-sm text-gray-600">
                  <div>Base: {attr.baseValue}</div>
                  <div>Range: {attr.minValue}-{attr.maxValue}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Skills */}
        <div className={wizardStyles.card.base}>
          <h4 className="font-semibold mb-4">Skills ({template.skills.length})</h4>
          <div className="grid gap-3">
            {template.skills.map((skill, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="font-medium">{skill.name}</span>
                  <SkillDifficulty difficulty={skill.difficulty} />
                  {skill.category && (
                    <span className={`${wizardStyles.badge.base} ${wizardStyles.badge.secondary}`}>
                      {skill.category}
                    </span>
                  )}
                </div>
                <div className="text-right text-sm text-gray-600">
                  <div>Base: {skill.baseValue}</div>
                  <div>Range: {skill.minValue}-{skill.maxValue}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className={wizardStyles.navigation.container}>
          <button
            onClick={onBack}
            className={wizardStyles.navigation.secondaryButton}
          >
            Back to Templates
          </button>
          <div className={wizardStyles.navigation.buttonGroup}>
            <button
              onClick={onUse}
              className={wizardStyles.navigation.primaryButton}
            >
              Use This Template
            </button>
          </div>
        </div>

        {/* Customization Note */}
        <div className="text-center text-sm text-gray-500 italic border-t pt-4">
          Note: This template provides a starting point. You can edit all aspects after using it.
        </div>
      </div>
    </div>
  );
};