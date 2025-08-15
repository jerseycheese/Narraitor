'use client';

import React, { useEffect, useState } from 'react';
import { useDevTools } from '../DevToolsContext';
import { StateSection, StateInspectorSection } from '../StateSection';
import { AITestingPanel } from '../AITestingPanel';
import { CollapsibleSection } from '../CollapsibleSection';
import { TestDataGeneratorSection } from '../TestDataGeneratorSection';
import { PortraitDebugSection } from '../PortraitDebugSection';
import { EndingImageDebugSection } from '../EndingImageDebugSection';
import { ConsistencyValidationSection } from '../ConsistencyValidationSection';
import { TextNormalizationSection } from '../TextNormalizationSection';
import { LoreManagementSection } from '../LoreManagementSection';
import { ErrorSection } from '../ErrorSection';
import { DevToolsSection } from '../shared/DevToolsSection';
import { SectionVisibilityControls } from '../SectionVisibilityControls';
import { DevToolsSection as SectionId } from '@/lib/devtools/sectionVisibilityStorage';
import { Button } from '@/components/ui/button';

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
    <DevToolsSection title="Environment Info:" className="mb-4 text-xs">
      <div className="text-slate-100">NODE_ENV: {nodeEnv}</div>
      <div className="text-slate-100">Is Client: {String(mounted)}</div>
      <div className="text-slate-100">Is Development: {String(isDev)}</div>
      <div className="text-slate-100">Window Location: {location}</div>
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
 *   <div className="p-4 overflow-auto">
 *     <StateSection />
 *     <MyNewSection /> // Your new section
 *   </div>
 * )}
 * 
 * @see /docs/devtools/extending-devtools.md for more information
 */
export const DevToolsPanel = () => {
  const { isOpen, toggleDevTools, isSectionVisible } = useDevTools();
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

  // Don't render anything on the server to avoid hydration issues
  if (!mounted) {
    return null;
  }

  // Only render in development environment or on test page
  if (process.env.NODE_ENV !== 'development' && !isTestPage) {
    return null;
  }

  return (
    <div 
      data-testid="devtools-panel-container"
      className={`fixed bottom-0 left-0 right-0 bg-slate-800 border-t-2 border-slate-600 z-[9999] overflow-hidden ${
        isOpen ? 'max-h-[50vh]' : 'h-12'
      } min-h-[3rem] shadow-lg`}
    >
      {/* Header with toggle button */}
      <div 
        data-testid="devtools-panel-header"
        className="flex justify-between items-center px-4 py-2 border-b border-slate-600 flex-shrink-0 bg-slate-700 h-12"
      >
        <div className="text-sm font-medium text-slate-200">
          Narraitor DevTools
          {isTestPage && ' (Test Page Mode)'}
        </div>
        <div className="flex gap-2 items-center">
          {isOpen && <SectionVisibilityControls />}
          <Button
            data-testid="devtools-panel-toggle"
            onClick={toggleDevTools}
            variant="ghost"
            size="sm"
            className="text-xs bg-slate-600 text-slate-200 hover:bg-slate-500 border border-slate-500"
          >
            {isOpen ? 'Hide DevTools' : 'Show DevTools'}
          </Button>
        </div>
      </div>

      {/* Content area - only rendered when open */}
      {isOpen && (
        <div 
          data-testid="devtools-panel-content"
          className="p-4 overflow-auto h-[calc(50vh-48px)] max-h-[calc(50vh-48px)] bg-slate-800 text-slate-200"
        >
          <EnvironmentInfo />
          
          {/* Two-column grid layout organized by function */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column: State Management & Error Tracking */}
            <div className="space-y-4">
              {/* State Management Group - only show if any child sections are visible */}
              {(isSectionVisible(SectionId.STATE_SECTION) || isSectionVisible(SectionId.STATE_INSPECTOR)) && (
                <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
                  <h3 className="text-sm font-semibold mb-3 text-slate-100 border-b border-slate-600 pb-2">
                    State Management
                  </h3>
                  {isSectionVisible(SectionId.STATE_SECTION) && (
                    <StateSection defaultCollapsed={true} />
                  )}
                  {isSectionVisible(SectionId.STATE_INSPECTOR) && (
                    <StateInspectorSection defaultCollapsed={true} />
                  )}
                </div>
              )}

              {/* Error Tracking Group */}
              {isSectionVisible(SectionId.ERROR_SECTION) && (
                <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
                  <h3 className="text-sm font-semibold mb-3 text-slate-100 border-b border-slate-600 pb-2">
                    Error Tracking
                  </h3>
                  <CollapsibleSection title="Runtime Errors" initialCollapsed={true}>
                    <ErrorSection />
                  </CollapsibleSection>
                </div>
              )}
            </div>
            
            {/* Right Column: AI Tools, Test Data & Content Generation */}
            <div className="space-y-4">
              {/* AI Tools Group - only show if any child sections are visible */}
              {(isSectionVisible(SectionId.AI_TESTING) || 
                isSectionVisible(SectionId.CONSISTENCY_VALIDATION) || 
                isSectionVisible(SectionId.TEXT_NORMALIZATION) || 
                isSectionVisible(SectionId.LORE_MANAGEMENT)) && (
                <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
                  <h3 className="text-sm font-semibold mb-3 text-slate-100 border-b border-slate-600 pb-2">
                    AI Tools & Validation
                  </h3>
                  <div className="space-y-3">
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
                    
                    {isSectionVisible(SectionId.TEXT_NORMALIZATION) && (
                      <CollapsibleSection title="Text Normalization" initialCollapsed={true}>
                        <TextNormalizationSection />
                      </CollapsibleSection>
                    )}
                    
                    {isSectionVisible(SectionId.LORE_MANAGEMENT) && (
                      <CollapsibleSection title="Lore Management" initialCollapsed={true}>
                        <LoreManagementSection />
                      </CollapsibleSection>
                    )}
                  </div>
                </div>
              )}
              
              {/* Test Data Group - only show if child section is visible */}
              {isSectionVisible(SectionId.TEST_DATA_GENERATOR) && (
                <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
                  <h3 className="text-sm font-semibold mb-3 text-slate-100 border-b border-slate-600 pb-2">
                    Test Data & Generators
                  </h3>
                  <CollapsibleSection title="Test Data Generators" initialCollapsed={true}>
                    <TestDataGeneratorSection />
                  </CollapsibleSection>
                </div>
              )}
              
              {/* Content Generation Group - only show if any child sections are visible */}
              {(isSectionVisible(SectionId.PORTRAIT_DEBUG) || isSectionVisible(SectionId.ENDING_IMAGE_DEBUG)) && (
                <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
                  <h3 className="text-sm font-semibold mb-3 text-slate-100 border-b border-slate-600 pb-2">
                    Content Generation
                  </h3>
                  <div className="space-y-3">
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
