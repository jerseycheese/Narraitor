// src/components/world/SmartTemplates/TemplatePreview.tsx

import React, { memo } from 'react';
import { WorldTemplate } from '@/lib/ai/templateGenerator';
import { PreviewModal } from '@/components/shared/PreviewModal/PreviewModal';
import { wizardStyles } from '@/components/shared/wizard/styles/wizardStyles';
import { getGenreLabel } from '@/lib/constants/genres';

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
        <h3>{template.name}</h3>
        <div>
          <div>
            <span>Genre:</span>
            <span className={`${wizardStyles.badge.base} ${wizardStyles.badge.primary}`}>
              {getGenreLabel(template.genre)}
            </span>
          </div>
          <div>
            <span>Description:</span>
            <p>{template.description}</p>
          </div>
        </div>
      </div>

      {/* AI Explanation */}
      {template.explanation && (
        <div className={wizardStyles.card.base}>
          <h4>Why these attributes and skills?</h4>
          <p>{template.explanation}</p>
        </div>
      )}

      {/* Attributes */}
      <div className={wizardStyles.card.base}>
        <h4>Attributes ({template.attributes.length})</h4>
        <div>
          {template.attributes.map((attr, index) => (
            <div key={index} >
              <div>
                <span>{attr.name}</span>
                {attr.category && (
                  <span className={`${wizardStyles.badge.base} ${wizardStyles.badge.secondary}`}>
                    {attr.category}
                  </span>
                )}
              </div>
              <div>
                <div>Base: {attr.baseValue}</div>
                <div>Range: {attr.minValue}-{attr.maxValue}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Skills */}
      <div className={wizardStyles.card.base}>
        <h4>Skills ({template.skills.length})</h4>
        <div>
          {template.skills.map((skill, index) => (
            <div key={index} >
              <div>
                <span>{skill.name}</span>
                <span className={`${wizardStyles.badge.base} ${wizardStyles.badge.primary}`}>
                  {skill.difficulty}
                </span>
                {skill.category && (
                  <span className={`${wizardStyles.badge.base} ${wizardStyles.badge.secondary}`}>
                    {skill.category}
                  </span>
                )}
              </div>
              <div>
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
