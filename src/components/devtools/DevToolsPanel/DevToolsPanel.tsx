'use client';

import React, { useEffect, useState } from 'react';
import { useDevTools } from '../DevToolsContext';
import { StateSection } from '../StateSection';
import { AITestingPanel } from '../AITestingPanel';
import { CollapsibleSection } from '../CollapsibleSection';
import { TestDataGeneratorSection } from '../TestDataGeneratorSection';
import { PortraitDebugSection } from '../PortraitDebugSection';
import { EndingImageDebugSection } from '../EndingImageDebugSection';
import { ConsistencyValidationSection } from '../ConsistencyValidationSection';

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
    <div className="mb-4 text-xs bg-slate-700 p-2 rounded border border-slate-600">
      <h3 className="font-bold mb-1 text-slate-200">Environment Info:</h3>
      <div className="text-slate-300">NODE_ENV: {nodeEnv}</div>
      <div className="text-slate-300">Is Client: {String(mounted)}</div>
      <div className="text-slate-300">Is Development: {String(isDev)}</div>
      <div className="text-slate-300">Window Location: {location}</div>
    </div>
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
  const { isOpen, toggleDevTools } = useDevTools();
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
        <button
          data-testid="devtools-panel-toggle"
          onClick={toggleDevTools}
          className="px-2 py-1 text-xs rounded focus:outline-none focus:ring-2 bg-slate-600 text-slate-200 hover:bg-slate-500 border border-slate-500"
        >
          {isOpen ? 'Hide DevTools' : 'Show DevTools'}
        </button>
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
            {/* Left Column: State Management */}
            <div className="space-y-4">
              {/* State Management Group */}
              <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
                <h3 className="text-sm font-semibold mb-3 text-slate-100 border-b border-slate-600 pb-2">
                  State Management
                </h3>
                <StateSection defaultCollapsed={true} />
              </div>
            </div>
            
            {/* Right Column: AI Tools, Test Data & Content Generation */}
            <div className="space-y-4">
              {/* AI Tools Group */}
              <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
                <h3 className="text-sm font-semibold mb-3 text-slate-100 border-b border-slate-600 pb-2">
                  AI Tools & Validation
                </h3>
                <div className="space-y-3">
                  <CollapsibleSection title="AI Testing" initialCollapsed={true}>
                    <AITestingPanel />
                  </CollapsibleSection>
                  
                  <CollapsibleSection title="Consistency Validation" initialCollapsed={true}>
                    <ConsistencyValidationSection />
                  </CollapsibleSection>
                </div>
              </div>
              
              {/* Test Data Group */}
              <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
                <h3 className="text-sm font-semibold mb-3 text-slate-100 border-b border-slate-600 pb-2">
                  Test Data & Generators
                </h3>
                <CollapsibleSection title="Test Data Generators" initialCollapsed={true}>
                  <TestDataGeneratorSection />
                </CollapsibleSection>
              </div>
              
              {/* Content Generation Group */}
              <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
                <h3 className="text-sm font-semibold mb-3 text-slate-100 border-b border-slate-600 pb-2">
                  Content Generation
                </h3>
                <div className="space-y-3">
                  <PortraitDebugSection />
                  
                  <EndingImageDebugSection />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
