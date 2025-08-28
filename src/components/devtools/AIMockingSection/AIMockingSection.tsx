// src/components/devtools/AIMockingSection/AIMockingSection.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MockScenarios, MockScenario } from '@/lib/ai/__mocks__/mockScenarios';
import { mockStateManager, MockConfiguration } from '@/lib/devtools/mockStateManager';

/**
 * AI Mocking Section component for DevTools
 * Provides controls to toggle between Live API and Mock modes
 */
export const AIMockingSection: React.FC = () => {
  const [config, setConfig] = useState<MockConfiguration>(mockStateManager.getConfiguration());
  const [scenarios] = useState<MockScenarios>(new MockScenarios());
  const [showCustomScenario, setShowCustomScenario] = useState(false);
  const [customScenario, setCustomScenario] = useState<Partial<MockScenario>>({
    id: '',
    name: '',
    description: '',
    delay: 1000,
    shouldSucceed: true
  });

  // Subscribe to configuration changes
  useEffect(() => {
    const unsubscribe = mockStateManager.subscribe(setConfig);
    return unsubscribe;
  }, []);

  // Get all available scenarios (predefined + custom)
  const allScenarios = [
    ...scenarios.getAllScenarios(),
    ...config.customScenarios
  ];

  const handleModeToggle = () => {
    mockStateManager.setMockEnabled(!config.isEnabled);
  };

  const handleScenarioChange = (scenarioId: string) => {
    mockStateManager.setActiveScenario(scenarioId);
  };

  const handleAddCustomScenario = () => {
    if (!customScenario.id || !customScenario.name) {
      return;
    }

    const newScenario: MockScenario = {
      id: customScenario.id,
      name: customScenario.name,
      description: customScenario.description || '',
      delay: customScenario.delay || 1000,
      shouldSucceed: customScenario.shouldSucceed || true,
      response: customScenario.shouldSucceed ? {
        content: `Custom mock response: ${customScenario.name}`,
        finishReason: 'STOP',
        promptTokens: 20,
        completionTokens: 15
      } : {
        code: 'CUSTOM_ERROR',
        message: `Custom error: ${customScenario.name}`,
        retryable: true
      }
    };

    mockStateManager.addCustomScenario(newScenario);
    
    // Reset form
    setCustomScenario({
      id: '',
      name: '',
      description: '',
      delay: 1000,
      shouldSucceed: true
    });
    setShowCustomScenario(false);
  };

  const handleRemoveCustomScenario = (scenarioId: string) => {
    mockStateManager.removeCustomScenario(scenarioId);
  };

  const handleImportConfig = () => {
    const input = prompt('Paste configuration JSON:');
    if (input) {
      const success = mockStateManager.importConfiguration(input);
      if (success) {
        alert('Configuration imported successfully!');
      } else {
        alert('Failed to import configuration. Please check the format.');
      }
    }
  };

  const handleExportConfig = () => {
    const configJson = mockStateManager.exportConfiguration();
    navigator.clipboard.writeText(configJson).then(() => {
      alert('Configuration copied to clipboard!');
    });
  };

  const activeScenario = allScenarios.find(s => s.id === config.activeScenarioId);

  return (
    <div className="space-y-4" data-testid="ai-mocking-section">
      {/* Mode Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${config.isEnabled ? 'bg-yellow-500' : 'bg-green-500'}`} />
          <span className="text-xs text-slate-200">
            Mode: {config.isEnabled ? 'Mock' : 'Live API'}
          </span>
        </div>
        
        <Button
          onClick={handleModeToggle}
          size="sm"
          variant={config.isEnabled ? "default" : "outline"}
          className={config.isEnabled 
            ? "bg-yellow-600 hover:bg-yellow-700 text-white" 
            : "border-slate-600 text-slate-300 hover:bg-slate-700"
          }
          data-testid="mode-toggle"
        >
          {config.isEnabled ? 'Disable Mock' : 'Enable Mock'}
        </Button>
      </div>

      {config.isEnabled && (
        <div className="space-y-4">
          {/* Scenario Selection */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Mock Scenario
            </label>
            <select
              value={config.activeScenarioId}
              onChange={(e) => handleScenarioChange(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 text-slate-200 rounded px-3 py-2 text-sm"
              data-testid="scenario-selector"
            >
              {allScenarios.map(scenario => (
                <option key={scenario.id} value={scenario.id}>
                  {scenario.name} ({scenario.shouldSucceed ? 'Success' : 'Error'}) - {scenario.delay}ms
                </option>
              ))}
            </select>
            
            {activeScenario && (
              <p className="text-xs text-slate-400 mt-1">
                {activeScenario.description}
              </p>
            )}
          </div>

          {/* Settings */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="delayVariation"
                checked={config.settings.delayVariation}
                onChange={(e) => mockStateManager.updateSettings({ delayVariation: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="delayVariation" className="text-xs text-slate-300">
                Delay Variation
              </label>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Variation %
              </label>
              <Input
                type="number"
                value={config.settings.variationPercent}
                onChange={(e) => mockStateManager.updateSettings({ variationPercent: parseInt(e.target.value) || 0 })}
                className="bg-slate-700 border-slate-600 text-slate-200"
                min="0"
                max="100"
                disabled={!config.settings.delayVariation}
              />
            </div>
          </div>

          {/* Custom Scenarios */}
          <div className="border-t border-slate-600 pt-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-slate-200">Custom Scenarios</h4>
              <Button
                onClick={() => setShowCustomScenario(!showCustomScenario)}
                size="sm"
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Add Custom
              </Button>
            </div>

            {showCustomScenario && (
              <div className="space-y-3 bg-slate-700/50 p-3 rounded border border-slate-600 mb-3">
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Scenario ID"
                    value={customScenario.id}
                    onChange={(e) => setCustomScenario(prev => ({ ...prev, id: e.target.value }))}
                    className="bg-slate-800 border-slate-600 text-slate-200"
                  />
                  <Input
                    placeholder="Scenario Name"
                    value={customScenario.name}
                    onChange={(e) => setCustomScenario(prev => ({ ...prev, name: e.target.value }))}
                    className="bg-slate-800 border-slate-600 text-slate-200"
                  />
                </div>
                
                <Textarea
                  placeholder="Description"
                  value={customScenario.description}
                  onChange={(e) => setCustomScenario(prev => ({ ...prev, description: e.target.value }))}
                  className="bg-slate-800 border-slate-600 text-slate-200"
                  rows={2}
                />
                
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    placeholder="Delay (ms)"
                    value={customScenario.delay}
                    onChange={(e) => setCustomScenario(prev => ({ ...prev, delay: parseInt(e.target.value) || 1000 }))}
                    className="bg-slate-800 border-slate-600 text-slate-200"
                    min="0"
                  />
                  
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="shouldSucceed"
                      checked={customScenario.shouldSucceed}
                      onChange={(e) => setCustomScenario(prev => ({ ...prev, shouldSucceed: e.target.checked }))}
                      className="rounded"
                    />
                    <label htmlFor="shouldSucceed" className="text-xs text-slate-300">
                      Should Succeed
                    </label>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button onClick={handleAddCustomScenario} size="sm" className="bg-green-600 hover:bg-green-700">
                    Add Scenario
                  </Button>
                  <Button 
                    onClick={() => setShowCustomScenario(false)} 
                    size="sm" 
                    variant="ghost"
                    className="text-slate-300 hover:bg-slate-600"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* List Custom Scenarios */}
            {config.customScenarios.length > 0 && (
              <div className="space-y-2">
                {config.customScenarios.map(scenario => (
                  <div key={scenario.id} className="flex items-center justify-between bg-slate-700 p-2 rounded border border-slate-600">
                    <div>
                      <div className="text-sm text-slate-200">{scenario.name}</div>
                      <div className="text-xs text-slate-400">{scenario.description}</div>
                    </div>
                    <Button
                      onClick={() => handleRemoveCustomScenario(scenario.id)}
                      size="sm"
                      variant="ghost"
                      className="text-red-400 hover:bg-slate-600"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Import/Export */}
          <div className="border-t border-slate-600 pt-4">
            <h4 className="text-sm font-semibold text-slate-200 mb-2">Configuration</h4>
            <div className="flex gap-2">
              <Button onClick={handleExportConfig} size="sm" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
                Export
              </Button>
              <Button onClick={handleImportConfig} size="sm" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
                Import
              </Button>
              <Button 
                onClick={() => mockStateManager.reset()} 
                size="sm" 
                variant="outline" 
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Reset
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};