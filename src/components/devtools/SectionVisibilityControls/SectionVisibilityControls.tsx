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
  [DevToolsSection.TEST_DATA_GENERATOR]: 'Test Data Generator',
  [DevToolsSection.AI_TESTING]: 'AI Testing Panel',
  [DevToolsSection.PORTRAIT_DEBUG]: 'Portrait Debug',
  [DevToolsSection.ENDING_IMAGE_DEBUG]: 'Ending Image Debug',
  [DevToolsSection.CONSISTENCY_VALIDATION]: 'Consistency Validation',
  [DevToolsSection.RELEVANCE_DEBUGGER]: 'Relevance Debugger',
  [DevToolsSection.LORE_MANAGEMENT]: 'Lore Management',
} as const;

/**
 * Mapping for test IDs to match test expectations
 */
const SECTION_TEST_IDS = {
  [DevToolsSection.STATE_SECTION]: 'toggle-state-section',
  [DevToolsSection.TEST_DATA_GENERATOR]: 'toggle-test-data-generator',
  [DevToolsSection.AI_TESTING]: 'toggle-ai-testing',
  [DevToolsSection.PORTRAIT_DEBUG]: 'toggle-portrait-debug',
  [DevToolsSection.ENDING_IMAGE_DEBUG]: 'toggle-ending-image-debug',
  [DevToolsSection.CONSISTENCY_VALIDATION]: 'toggle-consistency-validation',
  [DevToolsSection.RELEVANCE_DEBUGGER]: 'toggle-relevance-debugger',
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
    <div  data-testid="section-visibility-controls">
      <Button
        onClick={toggleDropdown}
        variant="ghost"
        size="sm"
        
        aria-expanded={isDropdownOpen}
        aria-haspopup="menu"
        aria-label="Section visibility controls"
        data-testid="visibility-controls-dropdown"
      >
        Sections ({visibleCount}/{totalCount}) ▼
      </Button>

      {isDropdownOpen && (
        <div 
          
          data-testid="visibility-dropdown"
          role="menu"
        >
          {/* Header with bulk actions */}
          <div >
            <div >
              <Button
                onClick={handleShowAll}
                variant="ghost"
                size="sm"
                
                data-testid="show-all-sections"
                role="menuitem"
              >
                Show All
              </Button>
              <Button
                onClick={handleHideAll}
                variant="ghost"
                size="sm"
                
                data-testid="hide-all-sections"
                role="menuitem"
              >
                Hide All
              </Button>
            </div>
          </div>

          {/* Individual section toggles */}
          <div >
            {Object.entries(SECTION_INFO).map(([sectionId, displayName]) => {
              const isVisible = isSectionVisible?.(sectionId) ?? true;
              
              return (
                <Button
                  key={sectionId}
                  onClick={() => handleSectionToggle(sectionId)}
                  variant="ghost"
                  size="sm"
                  
                  data-testid={SECTION_TEST_IDS[sectionId as keyof typeof SECTION_TEST_IDS]}
                  role="menuitemcheckbox"
                  aria-checked={isVisible}
                  aria-label={`Toggle${displayName}visibility`}
                >
                  <span className={`${
                    isVisible ? '' : ''
                  }`}>
                    {isVisible && (
                      <span  aria-hidden="true">
                        <Check  aria-hidden="true" />
                      </span>
                    )}
                  </span>
                  <span>{displayName}</span>
                </Button>
              );
            })}
          </div>

          {/* Footer */}
          <div >
            <Button
              onClick={() => setIsDropdownOpen(false)}
              variant="ghost"
              size="sm"
              
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
          
          onClick={() => setIsDropdownOpen(false)}
          data-testid="dropdown-backdrop"
        />
      )}
    </div>
  );
};
