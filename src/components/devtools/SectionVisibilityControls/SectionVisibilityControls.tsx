'use client';

import React, { useState } from 'react';
import { useDevTools } from '../DevToolsContext';
import { DevToolsSection } from '@/lib/devtools/sectionVisibilityStorage';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

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
        className="text-xs bg-gray-700 text-white hover:bg-gray-100 border border-gray-500"
        aria-expanded={isDropdownOpen}
        aria-haspopup="menu"
        aria-label="Section visibility controls"
        data-testid="visibility-controls-dropdown"
      >
        Sections ({visibleCount}/{totalCount}) ▼
      </Button>

      {isDropdownOpen && (
        <div 
          className="absolute top-full right-0 mt-1 bg-gray-700 border border-gray-700 rounded shadow-lg z-50 min-w-48"
          data-testid="visibility-dropdown"
          role="menu"
        >
          {/* Header with bulk actions */}
          <div className="p-2 border-b border-gray-700">
            <div className="flex gap-1">
              <Button
                onClick={handleShowAll}
                variant="ghost"
                size="sm"
                className="text-xs flex-1 bg-gray-700 text-white hover:bg-gray-100"
                data-testid="show-all-sections"
                role="menuitem"
              >
                Show All
              </Button>
              <Button
                onClick={handleHideAll}
                variant="ghost"
                size="sm"
                className="text-xs flex-1 bg-gray-700 text-white hover:bg-gray-100"
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
                <Button
                  key={sectionId}
                  onClick={() => handleSectionToggle(sectionId)}
                  variant="ghost"
                  size="sm"
                  className="w-full px-3 py-2 text-left text-xs text-white hover:bg-gray-700 flex items-center gap-2 justify-start h-auto"
                  data-testid={SECTION_TEST_IDS[sectionId as keyof typeof SECTION_TEST_IDS]}
                  role="menuitemcheckbox"
                  aria-checked={isVisible}
                  aria-label={`Toggle ${displayName} visibility`}
                >
                  <span className={`w-4 h-4 border border-gray-500 rounded flex items-center justify-center ${
                    isVisible ? 'bg-gray-100' : 'bg-transparent'
                  }`}>
                    {isVisible && (
                      <span className="text-black" aria-hidden="true">
                        <Check className="w-3 h-3" aria-hidden="true" />
                      </span>
                    )}
                  </span>
                  <span>{displayName}</span>
                </Button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="p-2 border-t border-gray-700">
            <Button
              onClick={() => setIsDropdownOpen(false)}
              variant="ghost"
              size="sm"
              className="w-full text-xs text-gray-500 hover:text-gray-200 h-auto"
              data-testid="close-dropdown"
            >
              Close
            </Button>
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
