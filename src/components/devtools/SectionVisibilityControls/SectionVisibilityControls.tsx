'use client';

import React, { useState } from 'react';
import { useDevTools } from '../DevToolsContext';
import { DevToolsSection } from '@/lib/devtools/sectionVisibilityStorage';
import { Button } from '@/components/ui/button';

/**
 * Section information for display
 */
const SECTION_INFO = {
  [DevToolsSection.STATE_SECTION]: 'State Section',
  [DevToolsSection.STATE_INSPECTOR]: 'State Inspector',
  [DevToolsSection.AI_TESTING]: 'AI Testing Panel',
  [DevToolsSection.TEST_DATA_GENERATOR]: 'Test Data Generator',
  [DevToolsSection.PORTRAIT_DEBUG]: 'Portrait Debug',
  [DevToolsSection.ENDING_IMAGE_DEBUG]: 'Ending Image Debug',
  [DevToolsSection.CONSISTENCY_VALIDATION]: 'Consistency Validation',
  [DevToolsSection.TEXT_NORMALIZATION]: 'Text Normalization',
  [DevToolsSection.LORE_MANAGEMENT]: 'Lore Management',
} as const;

/**
 * Mapping for test IDs to match test expectations
 */
const SECTION_TEST_IDS = {
  [DevToolsSection.STATE_SECTION]: 'toggle-state-section',
  [DevToolsSection.STATE_INSPECTOR]: 'toggle-state-inspector',
  [DevToolsSection.AI_TESTING]: 'toggle-ai-testing',
  [DevToolsSection.TEST_DATA_GENERATOR]: 'toggle-test-data-generator',
  [DevToolsSection.PORTRAIT_DEBUG]: 'toggle-portrait-debug',
  [DevToolsSection.ENDING_IMAGE_DEBUG]: 'toggle-ending-image-debug',
  [DevToolsSection.CONSISTENCY_VALIDATION]: 'toggle-consistency-validation',
  [DevToolsSection.TEXT_NORMALIZATION]: 'toggle-text-normalization',
  [DevToolsSection.LORE_MANAGEMENT]: 'toggle-lore-management',
} as const;

/**
 * SectionVisibilityControls Component
 * 
 * Provides controls for toggling visibility of individual DevTools sections.
 * Includes dropdown menu with individual toggles and show all/hide all actions.
 */
export const SectionVisibilityControls = () => {
  const { sectionVisibility, toggleSectionVisibility, setSectionVisibility, isSectionVisible } = useDevTools();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const visibleCount = Object.values(sectionVisibility).filter(Boolean).length;
  const totalCount = Object.keys(SECTION_INFO).length;

  const handleShowAll = () => {
    const allVisible = Object.keys(SECTION_INFO).reduce((acc, sectionId) => {
      acc[sectionId] = true;
      return acc;
    }, {} as Record<string, boolean>);
    setSectionVisibility(allVisible);
  };

  const handleHideAll = () => {
    const allHidden = Object.keys(SECTION_INFO).reduce((acc, sectionId) => {
      acc[sectionId] = false;
      return acc;
    }, {} as Record<string, boolean>);
    setSectionVisibility(allHidden);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(prev => !prev);
  };

  const handleSectionToggle = (sectionId: string) => {
    toggleSectionVisibility(sectionId);
  };

  return (
    <div className="relative" data-testid="section-visibility-controls">
      <Button
        onClick={toggleDropdown}
        variant="ghost"
        size="sm"
        className="text-xs bg-slate-600 text-slate-200 hover:bg-slate-500 border border-slate-500"
        aria-expanded={isDropdownOpen}
        aria-haspopup="menu"
        aria-label="Section visibility controls"
        data-testid="visibility-controls-dropdown"
      >
        Sections ({visibleCount}/{totalCount}) ▼
      </Button>

      {isDropdownOpen && (
        <div 
          className="absolute top-full right-0 mt-1 bg-slate-700 border border-slate-600 rounded shadow-lg z-50 min-w-48"
          data-testid="visibility-dropdown"
          role="menu"
        >
          {/* Header with bulk actions */}
          <div className="p-2 border-b border-slate-600">
            <div className="flex gap-1">
              <Button
                onClick={handleShowAll}
                variant="ghost"
                size="sm"
                className="text-xs flex-1 bg-slate-600 text-slate-200 hover:bg-slate-500"
                data-testid="show-all-sections"
                role="menuitem"
              >
                Show All
              </Button>
              <Button
                onClick={handleHideAll}
                variant="ghost"
                size="sm"
                className="text-xs flex-1 bg-slate-600 text-slate-200 hover:bg-slate-500"
                data-testid="hide-all-sections"
                role="menuitem"
              >
                Hide All
              </Button>
            </div>
          </div>

          {/* Individual section toggles */}
          <div className="max-h-64 overflow-y-auto">
            {Object.entries(SECTION_INFO).map(([sectionId, displayName]) => {
              const isVisible = isSectionVisible?.(sectionId) ?? true;
              
              return (
                <button
                  key={sectionId}
                  onClick={() => handleSectionToggle(sectionId)}
                  className="w-full px-3 py-2 text-left text-xs text-slate-200 hover:bg-slate-600 flex items-center gap-2"
                  data-testid={SECTION_TEST_IDS[sectionId as keyof typeof SECTION_TEST_IDS]}
                  role="menuitemcheckbox"
                  aria-checked={isVisible}
                  aria-label={`Toggle ${displayName} visibility`}
                >
                  <span className={`w-4 h-4 border border-slate-400 rounded flex items-center justify-center ${
                    isVisible ? 'bg-slate-500' : 'bg-transparent'
                  }`}>
                    {isVisible && <span className="text-slate-200">✓</span>}
                  </span>
                  <span>{displayName}</span>
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="p-2 border-t border-slate-600">
            <button
              onClick={() => setIsDropdownOpen(false)}
              className="w-full text-xs text-slate-400 hover:text-slate-200"
              data-testid="close-dropdown"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {isDropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsDropdownOpen(false)}
          data-testid="dropdown-backdrop"
        />
      )}
    </div>
  );
};