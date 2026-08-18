'use client';

import React, { useEffect, useState } from 'react';
import { useDevTools } from '../DevToolsContext';
import { StateSection } from '../StateSection';
import { AITestingPanel } from '../AITestingPanel';
import { CollapsibleSection } from '@/components/ui/CollapsibleSection';
import { PortraitDebugSection } from '../PortraitDebugSection';
import { EndingImageDebugSection } from '../EndingImageDebugSection';
import { ConsistencyValidationSection } from '../ConsistencyValidationSection';
import { LoreManagementSection } from '../LoreManagementSection';
import { TokenBudgetPanel } from '../TokenBudgetPanel';
import { WorldClockSection } from '../WorldClockSection';
import { ErrorSection } from '../ErrorSection';
import { DecisionConsoleSection } from '../DecisionConsoleSection';
import { DecisionFlowSection } from '../DecisionFlowSection';
import { DevToolsSection } from '../shared/DevToolsSection';
import { SectionVisibilityControls } from '../SectionVisibilityControls';
import { DevToolsSection as SectionId } from '@/lib/devtools/sectionVisibilityStorage';
import { Button } from '@/components/ui/button';
import { TestDataGeneratorSection } from '../TestDataGeneratorSection';
import { QuickSetup } from '../QuickSetup';
import './DevToolsPanel.css';

/**
 * Environment info component for the DevTools panel
 */
const EnvironmentInfo = () => {
  const [mounted, setMounted] = useState(false);
  const [location, setLocation] = useState('N/A');

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      setLocation(window.location.pathname);
    }
  }, []);

  // Static values that don't change between server and client
  const nodeEnv = process.env.NODE_ENV || 'unknown';
  const isDev = process.env.NODE_ENV === 'development';

  return (
    <DevToolsSection title="Environment Info:" >
      <div>NODE_ENV: {nodeEnv}</div>
      <div>Is Client: {String(mounted)}</div>
      <div>Is Development: {String(isDev)}</div>
      <div>Window Location: {location}</div>
    </DevToolsSection>
  );
};

/**
 * DevToolsPanel Component
 *
 * The main DevTools panel that appears at the bottom of the screen.
 * It can be collapsed/expanded and contains debugging tools.
 *
 * This component is the main container for all DevTools functionality.
 * To add new debugging tools, create a new component in the devtools directory
 * and add it to the content area of this component.
 *
 * @example
 * // Adding a new section to the DevToolsPanel
 * {isOpen && (
 *   <div>
 *     <StateSection />
 *     <MyNewSection /> // Your new section
 *   </div>
 * )}
 *
 * @see /docs/devtools/extending-devtools.md for more information
 */
export const DevToolsPanel = () => {
  const { isOpen, toggleDevTools, isSectionVisible, settings, updateSetting } = useDevTools();
  const [mounted, setMounted] = useState(false);
  const [isTestPage, setIsTestPage] = useState(false);

  // Set mounted flag and check if we're on the test page after mount
  useEffect(() => {
    setMounted(true);

    // Check if we're on the test page
    if (typeof window !== 'undefined') {
      setIsTestPage(window.location.pathname.includes('/dev/devtools-test'));
    }
  }, []);

  // Scroll DevTools into view when opened
  useEffect(() => {
    if (isOpen && mounted) {
      // Small delay to ensure the panel has expanded
      setTimeout(() => {
        const devToolsElement = document.querySelector('[data-testid="devtools-panel-container"]');
        if (devToolsElement) {
          devToolsElement.scrollIntoView({
            behavior: 'smooth',
            block: 'end',
            inline: 'nearest'
          });
        }
      }, 100);
    }
  }, [isOpen, mounted]);

  // Don't render anything on the server to avoid hydration issues
  if (!mounted) {
    return null;
  }

  // Only render in development environment or on test page
  if (process.env.NODE_ENV !== 'development' && !isTestPage) {
    return null;
  }

  return (
    <div className="devtools-panel" data-testid="devtools-panel-container">
      {/* Header with toggle button */}
      <div className="devtools-panel-header" data-testid="devtools-panel-header">
        <div className="devtools-panel-title">
          Narraitor DevTools
          {isTestPage && '(Test Page Mode)'}
        </div>
        <div className="devtools-panel-controls">
          {isOpen && (
            <>
              <QuickSetup />
              <label className="devtools-panel-prompts-toggle">
                <input
                  type="checkbox"
                  checked={settings.showPromptDebugInfo}
                  onChange={(e) => updateSetting('showPromptDebugInfo', e.target.checked)}
                  title="Toggle prompt debug information in narrative segments"
                />
                <span>Show Prompts</span>
              </label>
              <SectionVisibilityControls />
            </>
          )}
          <Button
            data-testid="devtools-panel-toggle"
            onClick={toggleDevTools}
            variant="ghost"
            size="sm"
          >
            {isOpen ? 'Hide DevTools' : 'Show DevTools'}
          </Button>
        </div>
      </div>

      {/* Content area - only rendered when open */}
      {isOpen && (
        <div className="devtools-panel-content" data-testid="devtools-panel-content">
          <EnvironmentInfo />

          {/* Two-column grid layout organized by function */}
          <div className="devtools-panel-grid">
            {/* Left Column: State Management & Error Tracking */}
            <div className="devtools-panel-column">
              {/* State Management Group - only show if any child sections are visible */}
              {isSectionVisible(SectionId.STATE_SECTION) && (
                <div className="devtools-panel-group">
                  <h3 className="devtools-panel-group-title">State Management</h3>
                  <StateSection defaultCollapsed={true} />
                </div>
              )}

              {/* Decisions Group - only show if any child sections are visible */}
              {(isSectionVisible(SectionId.DECISION_CONSOLE) ||
                isSectionVisible(SectionId.DECISION_FLOW)) && (
                <div className="devtools-panel-group">
                  <h3 className="devtools-panel-group-title">Decisions</h3>
                  <div className="devtools-panel-subgroup">
                    {isSectionVisible(SectionId.DECISION_CONSOLE) && (
                      <CollapsibleSection title="Decision Console" initialCollapsed={true}>
                        <DecisionConsoleSection />
                      </CollapsibleSection>
                    )}

                    {isSectionVisible(SectionId.DECISION_FLOW) && (
                      <CollapsibleSection title="Decision Creation Flow" initialCollapsed={true}>
                        <DecisionFlowSection />
                      </CollapsibleSection>
                    )}
                  </div>
                </div>
              )}

              {/* Error Tracking Group */}
              {isSectionVisible(SectionId.ERROR_SECTION) && (
                <div className="devtools-panel-group">
                  <h3 className="devtools-panel-group-title">Error Tracking</h3>
                  <CollapsibleSection title="Runtime Errors" initialCollapsed={true}>
                    <ErrorSection />
                  </CollapsibleSection>
                </div>
              )}
            </div>

            {/* Right Column: AI Tools, Test Data & Content Generation */}
            <div className="devtools-panel-column">
              {/* AI Tools Group - only show if any child sections are visible */}
              {(isSectionVisible(SectionId.AI_TESTING) ||
                isSectionVisible(SectionId.CONSISTENCY_VALIDATION) ||
                isSectionVisible(SectionId.TOKEN_BUDGET) ||
                isSectionVisible(SectionId.WORLD_CLOCK) ||
                isSectionVisible(SectionId.LORE_MANAGEMENT)) && (
                <div className="devtools-panel-group">
                  <h3 className="devtools-panel-group-title">AI Tools &amp; Validation</h3>
                  <div className="devtools-panel-subgroup">
                    {isSectionVisible(SectionId.AI_TESTING) && (
                      <CollapsibleSection title="AI Testing" initialCollapsed={true}>
                        <AITestingPanel />
                      </CollapsibleSection>
                    )}

                    {isSectionVisible(SectionId.CONSISTENCY_VALIDATION) && (
                      <CollapsibleSection title="Consistency Validation" initialCollapsed={true}>
                        <ConsistencyValidationSection />
                      </CollapsibleSection>
                    )}

                    {isSectionVisible(SectionId.LORE_MANAGEMENT) && (
                      <CollapsibleSection title="Lore Management" initialCollapsed={true}>
                        <LoreManagementSection />
                      </CollapsibleSection>
                    )}

                    {isSectionVisible(SectionId.TOKEN_BUDGET) && (
                      <CollapsibleSection title="Token Budget" initialCollapsed={true}>
                        <TokenBudgetPanel />
                      </CollapsibleSection>
                    )}

                    {isSectionVisible(SectionId.WORLD_CLOCK) && (
                      <CollapsibleSection title="World Clock" initialCollapsed={true}>
                        <WorldClockSection />
                      </CollapsibleSection>
                    )}
                  </div>
                </div>
              )}

              {isSectionVisible(SectionId.TEST_DATA_GENERATOR) && (
                <div className="devtools-panel-group">
                  <h3 className="devtools-panel-group-title">Test Data &amp; Generators</h3>
                  <CollapsibleSection title="Test Data Generators" initialCollapsed={true}>
                    <TestDataGeneratorSection />
                  </CollapsibleSection>
                </div>
              )}

              {/* Content Generation Group - only show if any child sections are visible */}
              {(isSectionVisible(SectionId.PORTRAIT_DEBUG) || isSectionVisible(SectionId.ENDING_IMAGE_DEBUG)) && (
                <div className="devtools-panel-group">
                  <h3 className="devtools-panel-group-title">Content Generation</h3>
                  <div className="devtools-panel-subgroup">
                    {isSectionVisible(SectionId.PORTRAIT_DEBUG) && <PortraitDebugSection />}

                    {isSectionVisible(SectionId.ENDING_IMAGE_DEBUG) && <EndingImageDebugSection />}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
