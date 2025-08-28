// src/components/devtools/MockControlsSection/MockStatusIndicator.tsx

'use client';

import React from 'react';
import { useMockConfiguration, useMockControls } from '@/state/mockConfigurationStore';

/**
 * Visual indicator showing the current mock status
 */
export const MockStatusIndicator: React.FC = () => {
  const configuration = useMockConfiguration();
  const { getActiveScenario } = useMockControls();
  const activeScenario = getActiveScenario();

  if (!configuration.enabled) {
    return (
      <div className="flex items-center gap-2 text-xs">
        <div className="w-2 h-2 rounded-full bg-slate-500"></div>
        <span className="text-slate-400">Mock Disabled</span>
      </div>
    );
  }

  const getStatusColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      case 'timeout': return 'bg-yellow-500';
      case 'custom': return 'bg-blue-500';
      default: return 'bg-slate-500';
    }
  };

  return (
    <div className="flex items-center gap-2 text-xs">
      <div 
        className={`w-2 h-2 rounded-full ${getStatusColor(activeScenario?.type || 'success')}`}
        title={activeScenario?.description}
      ></div>
      <span className="text-slate-200">
        Mock: {activeScenario?.name || 'Unknown'}
      </span>
    </div>
  );
};