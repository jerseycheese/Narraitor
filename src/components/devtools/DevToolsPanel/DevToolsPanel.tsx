'use client';

import React, { useEffect, useState } from 'react';
import { useDevTools } from '../DevToolsContext';
import { StateSection } from '../StateSection';
import { AITestingPanel } from '../AITestingPanel';
import { CollapsibleSection } from '../CollapsibleSection';

/**
 * Environment info component for the DevTools panel
 */
const EnvironmentInfo = () => {
  const [info, setInfo] = useState({
    nodeEnv: '',
    isClient: false,
    isDev: false
  });
  
  useEffect(() => {
    setInfo({
      nodeEnv: process.env.NODE_ENV || 'unknown',
      isClient: true,
      isDev: process.env.NODE_ENV === 'development'
    });
  }, []);
  
  return (
    <div className="devtools-panel mb-4 text-xs bg-slate-700 p-2 rounded border border-slate-600">
      <h3 className="devtools-panel font-bold mb-1 text-slate-200">Environment Info:</h3>
      <div className="devtools-panel text-slate-300">NODE_ENV: {info.nodeEnv}</div>
      <div className="devtools-panel text-slate-300">Is Client: {String(info.isClient)}</div>
      <div className="devtools-panel text-slate-300">Is Development: {String(info.isDev)}</div>
      <div className="devtools-panel text-slate-300">Window Location: {typeof window !== 'undefined' ? window.location.pathname : 'N/A'}</div>
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
  const [isClient, setIsClient] = useState(false);
  const [isTestPage, setIsTestPage] = useState(false);
  
  // Set client-side flags after mount
  useEffect(() => {
    setIsClient(true);
    
    // Check if we're on the test page
    if (typeof window !== 'undefined') {
      setIsTestPage(window.location.pathname.includes('/dev/devtools-test'));
    }
  }, [isOpen]);

  // Only render in development environment
  if (isClient && process.env.NODE_ENV !== 'development' && !isTestPage) {
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
          {/* Only render this on client-side to avoid hydration mismatch */}
          {isClient && isTestPage && ' (Test Page Mode)'}
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
          className="devtools-panel p-4 overflow-auto h-[calc(50vh-48px)] max-h-[calc(50vh-48px)] bg-slate-800 text-slate-200"
        >
          <EnvironmentInfo />
          <StateSection defaultCollapsed={true} />
          
          {/* AI Testing Section */}
          <CollapsibleSection title="AI Testing" initialCollapsed={true}>
            <AITestingPanel />
          </CollapsibleSection>
        </div>
      )}
    </div>
  );
};