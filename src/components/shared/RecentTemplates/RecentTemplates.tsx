'use client';

import React, { useCallback } from 'react';
import { useSessionStore } from '@/state/sessionStore';
import { useHistory } from '@/lib/hooks/useHistory';
import { TemplateHistoryEntry } from '@/types/game.types';
import { wizardStyles } from '@/components/shared/wizard/styles/wizardStyles';
import { formatDate } from '@/lib/utils';
import { getGenreLabel } from '@/lib/constants/genres';

interface RecentTemplatesProps {
  onTemplateSelect: (entry: TemplateHistoryEntry) => void;
  selectedTemplateId?: string | null;
  title?: string;
  description?: string;
  className?: string;
  maxTemplates?: number;
}

export const RecentTemplates: React.FC<RecentTemplatesProps> = ({
  onTemplateSelect,
  selectedTemplateId = null,
  title = "Recent Templates",
  description = "Recently generated templates you can reuse",
  className = "",
  maxTemplates = 5
}) => {
  // Template history hooks
  const templateHistory = useSessionStore(useCallback(state => state.templateHistory, []));
  const addTemplateToHistory = useSessionStore(useCallback(state => state.addTemplateToHistory, []));
  const clearTemplateHistory = useSessionStore(useCallback(state => state.clearTemplateHistory, []));
  
  const templateHistoryManager = useHistory(
    templateHistory,
    addTemplateToHistory,
    clearTemplateHistory,
    maxTemplates
  );

  const handleTemplateClick = useCallback((entry: TemplateHistoryEntry) => {
    onTemplateSelect(entry);
  }, [onTemplateSelect]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent, entry: TemplateHistoryEntry) => {
    if (e.key === 'Enter' || e.key === '') {
      e.preventDefault();
      handleTemplateClick(entry);
    }
  }, [handleTemplateClick]);

  // Don't render if no templates
  if (templateHistoryManager.isEmpty) {
    return null;
  }

  return (
    <div className={`${wizardStyles.divider}${className}`}>
      <h3 className={wizardStyles.subheading}>{title}</h3>
      {description && (
        <p >{description}</p>
      )}
      <div >
        {templateHistoryManager.getRecent().map((entry, index) => (
          <div 
            key={index}
            className={`${selectedTemplateId === `ai-template-${entry.template.name}` ? 'selected-template' : ''}`}
            onClick={() => handleTemplateClick(entry)}
            onKeyPress={(e) => handleKeyPress(e, entry)}
            role="button"
            tabIndex={0}
            aria-label={`Use template:${entry.template.name}(${getGenreLabel(entry.template.genre)})`}
            data-testid={`recent-template-${index}`}
          >
            <div >
              <div>
                <h4 >{entry.template.name}</h4>
                <div >
                  <span >{getGenreLabel(entry.template.genre)}</span>
                </div>
                <p >
                  Generated {formatDate(entry.generatedAt)}
                </p>
              </div>
              <span className={`${wizardStyles.badge.base}${wizardStyles.badge.secondary}`}>
                {entry.generationType === 'inspired-by' ? 'Inspired' : 
                 entry.generationType === 'genre-mix' ? 'Mixed' : 'Surprise'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
