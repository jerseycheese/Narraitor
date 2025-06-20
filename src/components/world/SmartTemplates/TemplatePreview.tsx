// src/components/world/SmartTemplates/TemplatePreview.tsx

import React, { memo } from 'react';
import { WorldTemplate } from '@/lib/ai/templateGenerator';
import { PreviewModal } from '@/components/shared/PreviewModal/PreviewModal';
import { wizardStyles } from '@/components/shared/wizard/styles/wizardStyles';

interface TemplatePreviewProps {
  template: WorldTemplate;
  isOpen: boolean;
  onUse: () => void;
  onBack: () => void;
}

const TemplatePreview: React.FC<TemplatePreviewProps> = memo(({
  template,
  isOpen,
  onUse,
  onBack
}) => {
  const renderTemplateContent = (template: WorldTemplate) => (
    <>
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
                <span className={`${wizardStyles.badge.base} ${wizardStyles.badge.primary}`}>
                  {skill.difficulty}
                </span>
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
    </>
  );

  return (
    <PreviewModal
      isOpen={isOpen}
      data={template}
      title="Template Preview"
      subtitle="Review your generated world template before using it"
      renderContent={renderTemplateContent}
      onConfirm={onUse}
      onCancel={onBack}
      confirmText="Use This Template"
      cancelText="Back to Templates"
      footerNote="Note: This template provides a starting point. You can edit all aspects after using it."
    />
  );
});

TemplatePreview.displayName = 'TemplatePreview';

export { TemplatePreview };