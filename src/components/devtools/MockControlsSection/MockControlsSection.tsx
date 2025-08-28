// src/components/devtools/MockControlsSection/MockControlsSection.tsx

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMockConfiguration, useMockControls } from '@/state/mockConfigurationStore';
import { ScenarioEditor } from './ScenarioEditor';
import { MockStatusIndicator } from './MockStatusIndicator';
import { MockScenario } from '@/lib/ai/types';

/**
 * Main mock controls section for DevTools
 */
export const MockControlsSection: React.FC = () => {
  const configuration = useMockConfiguration();
  const {
    enableMock,
    setActiveScenario,
    updateGlobalDelay,
    toggleDelayVariation,
    addScenario,
    updateScenario,
    deleteScenario,
    resetToDefaults,
    exportConfiguration,
    importConfiguration
  } = useMockControls();

  const [showEditor, setShowEditor] = useState(false);
  const [editingScenario, setEditingScenario] = useState<MockScenario | null>(null);
  const [importData, setImportData] = useState('');
  const [showImport, setShowImport] = useState(false);

  const handleSaveScenario = (scenarioData: Omit<MockScenario, 'id'>) => {
    if (editingScenario) {
      updateScenario(editingScenario.id, scenarioData);
    } else {
      addScenario(scenarioData);
    }
    setShowEditor(false);
    setEditingScenario(null);
  };

  const handleEditScenario = (scenario: MockScenario) => {
    setEditingScenario(scenario);
    setShowEditor(true);
  };

  const handleDeleteScenario = (scenarioId: string) => {
    if (confirm('Are you sure you want to delete this scenario?')) {
      deleteScenario(scenarioId);
    }
  };

  const handleImport = () => {
    if (importConfiguration(importData)) {
      setImportData('');
      setShowImport(false);
      alert('Configuration imported successfully!');
    } else {
      alert('Failed to import configuration. Please check the format.');
    }
  };

  const handleExport = () => {
    const configJson = exportConfiguration();
    navigator.clipboard.writeText(configJson).then(() => {
      alert('Configuration copied to clipboard!');
    });
  };

  if (showEditor) {
    return (
      <ScenarioEditor
        scenario={editingScenario || undefined}
        onSave={handleSaveScenario}
        onCancel={() => {
          setShowEditor(false);
          setEditingScenario(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Status and Main Controls */}
      <div className="flex items-center justify-between">
        <MockStatusIndicator />
        <div className="flex gap-2">
          <Button
            onClick={() => enableMock(!configuration.enabled)}
            variant={configuration.enabled ? "default" : "outline"}
            size="sm"
            className={configuration.enabled 
              ? "bg-green-600 hover:bg-green-700 text-white" 
              : "border-slate-600 text-slate-300 hover:bg-slate-700"
            }
          >
            {configuration.enabled ? 'Disable Mock' : 'Enable Mock'}
          </Button>
        </div>
      </div>

      {configuration.enabled && (
        <>
          {/* Scenario Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-300">
              Active Scenario
            </label>
            <select 
              value={configuration.activeScenario} 
              onChange={(e) => setActiveScenario(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 text-slate-200 rounded px-3 py-2 text-sm"
            >
              {configuration.scenarios.map((scenario) => (
                <option key={scenario.id} value={scenario.id}>
                  {scenario.name} ({scenario.type})
                </option>
              ))}
            </select>
          </div>

          {/* Global Settings */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Global Delay (ms)
              </label>
              <Input
                type="number"
                value={configuration.globalDelay}
                onChange={(e) => updateGlobalDelay(parseInt(e.target.value) || 0)}
                className="bg-slate-700 border-slate-600 text-slate-200"
                min="0"
              />
            </div>
            
            <div className="flex items-center gap-2 mt-6">
              <input
                type="checkbox"
                id="delayVariation"
                checked={configuration.enableDelayVariation}
                onChange={toggleDelayVariation}
                className="rounded"
              />
              <label htmlFor="delayVariation" className="text-xs text-slate-300">
                Delay Variation
              </label>
            </div>
          </div>

          {/* Scenario Management */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-semibold text-slate-200">Scenarios</h4>
              <Button
                onClick={() => setShowEditor(true)}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Add Scenario
              </Button>
            </div>
            
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {configuration.scenarios.map((scenario) => (
                <div 
                  key={scenario.id}
                  className="flex items-center justify-between bg-slate-700 p-2 rounded border border-slate-600"
                >
                  <div className="flex-1">
                    <div className="text-sm text-slate-200">{scenario.name}</div>
                    <div className="text-xs text-slate-400">
                      {scenario.type} • {scenario.delay}ms
                      {scenario.description && ` • ${scenario.description}`}
                    </div>
                  </div>
                  
                  <div className="flex gap-1">
                    <Button
                      onClick={() => handleEditScenario(scenario)}
                      size="sm"
                      variant="ghost"
                      className="text-xs text-slate-300 hover:bg-slate-600"
                    >
                      Edit
                    </Button>
                    
                    {!scenario.id.startsWith('success-') && 
                     !scenario.id.startsWith('error-') && 
                     scenario.id !== 'timeout' && (
                      <Button
                        onClick={() => handleDeleteScenario(scenario.id)}
                        size="sm"
                        variant="ghost"
                        className="text-xs text-red-400 hover:bg-slate-600"
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Configuration Management */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-slate-200">Configuration</h4>
            
            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={handleExport}
                size="sm"
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Export
              </Button>
              
              <Button
                onClick={() => setShowImport(!showImport)}
                size="sm"
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Import
              </Button>
              
              <Button
                onClick={() => {
                  if (confirm('Reset to default configuration? This will remove all custom scenarios.')) {
                    resetToDefaults();
                  }
                }}
                size="sm"
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Reset
              </Button>
            </div>

            {showImport && (
              <div className="space-y-2">
                <textarea
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  placeholder="Paste configuration JSON here..."
                  className="w-full h-20 bg-slate-700 border border-slate-600 rounded text-slate-200 text-xs p-2"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleImport}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Import
                  </Button>
                  <Button
                    onClick={() => {
                      setShowImport(false);
                      setImportData('');
                    }}
                    size="sm"
                    variant="ghost"
                    className="text-slate-300 hover:bg-slate-600"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};