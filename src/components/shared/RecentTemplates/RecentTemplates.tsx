'use client';

import React, { useCallback } from 'react';
import { useSessionStore } from '@/state/sessionStore';
import { useHistory } from '@/lib/hooks/useHistory';
import { TemplateHistoryEntry } from '@/types/game.types';
import { wizardStyles } from '@/components/shared/wizard/styles/wizardStyles';

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
  description = "Recently generated AI templates you can reuse",
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
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleTemplateClick(entry);
    }
  }, [handleTemplateClick]);

  // Don't render if no templates
  if (templateHistoryManager.isEmpty) {
    return null;
  }

  return (
    <div className={`${wizardStyles.divider} ${className}`}>
      <h3 className={wizardStyles.subheading}>{title}</h3>
      {description && (
        <p className="text-sm text-gray-600 mb-4">{description}</p>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {templateHistoryManager.getRecent().map((entry, index) => (
          <div 
            key={index}
            className={`border rounded-lg p-4 cursor-pointer transition-all hover:border-blue-500 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              ${selectedTemplateId === `ai-template-${entry.template.name}` ? 'selected-template border-blue-500 bg-blue-50 shadow-md' : 'border-gray-300'}`}
            onClick={() => handleTemplateClick(entry)}
            onKeyPress={(e) => handleKeyPress(e, entry)}
            role="button"
            tabIndex={0}
            aria-label={`Use template: ${entry.template.name} (${entry.template.genre})`}
            data-testid={`recent-template-${index}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-medium text-lg">{entry.template.name}</h4>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{entry.template.description}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-sm font-medium text-gray-700">{entry.template.genre}</span>
                  <span className="text-xs text-gray-500">•</span>
                  <span className="text-xs text-gray-500">
                    {entry.template.attributes.length} attributes · {entry.template.skills.length} skills
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Generated {new Date(entry.generatedAt).toLocaleDateString()}
                </p>
              </div>
              <span className={`${wizardStyles.badge.base} ${wizardStyles.badge.secondary} ml-2 shrink-0`}>
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