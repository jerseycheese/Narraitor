// src/components/devtools/AIMockingSection/AIMockingSection.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { MockScenarios, MockScenario } from '@/lib/ai/__mocks__/mockScenarios';
import {
  mockStateManager,
  MockConfiguration,
} from '@/lib/devtools/mockStateManager';

/**
 * AI Mocking Section component for DevTools
 * Provides controls to toggle between Live API and Mock modes
 */
export const AIMockingSection: React.FC = () => {
  const [config, setConfig] = useState<MockConfiguration>(
    mockStateManager.getConfiguration()
  );
  const [scenarios] = useState<MockScenarios>(new MockScenarios());
  const [showCustomScenario, setShowCustomScenario] = useState(false);
  const [customScenario, setCustomScenario] = useState<Partial<MockScenario>>({
    id: '',
    name: '',
    description: '',
    delay: 1000,
    shouldSucceed: true,
  });

  // Subscribe to configuration changes
  useEffect(() => {
    const unsubscribe = mockStateManager.subscribe(setConfig);
    return unsubscribe;
  }, []);

  // Get all available scenarios (predefined + custom, deduplicated)
  const allScenarios = [
    ...scenarios.getAllScenarios(),
    ...config.customScenarios.filter(
      (custom) =>
        !scenarios
          .getAllScenarios()
          .some((predefined) => predefined.id === custom.id)
    ),
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

    const shouldSucceed = customScenario.shouldSucceed || true;
    const response = shouldSucceed
      ? {
          content: `Custom mock response: ${customScenario.name}`,
          finishReason: 'STOP' as const,
          promptTokens: 20,
          completionTokens: 15,
        }
      : {
          code: 'CUSTOM_ERROR',
          message: `Custom error: ${customScenario.name}`,
          retryable: true,
        };

    const newScenario: MockScenario = {
      id: customScenario.id,
      name: customScenario.name,
      description: customScenario.description || '',
      delay: customScenario.delay || 1000,
      shouldSucceed,
      response,
    };

    mockStateManager.addCustomScenario(newScenario);

    // Reset form
    setCustomScenario({
      id: '',
      name: '',
      description: '',
      delay: 1000,
      shouldSucceed: true,
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

  const activeScenario = allScenarios.find(
    (s) => s.id === config.activeScenarioId
  );

  return (
    <div data-testid="ai-mocking-section">
      {/* Mode Toggle */}
      <div>
        <div>
          <div />
          <span>Mode: {config.isEnabled ? 'Mock' : 'Live API'}</span>
        </div>

        <Button
          onClick={handleModeToggle}
          size="sm"
          variant={config.isEnabled ? 'default' : 'outline'}
          data-testid="mock-mode-toggle"
        >
          {config.isEnabled ? 'Disable Mock' : 'Enable Mock'}
        </Button>
      </div>

      {config.isEnabled && (
        <div>
          {/* Scenario Selection */}
          <div>
            <label>Mock Scenario</label>
            <Select
              value={config.activeScenarioId}
              onChange={(e) => handleScenarioChange(e.target.value)}
              data-testid="scenario-selector"
            >
              {allScenarios.map((scenario) => (
                <option key={scenario.id} value={scenario.id}>
                  {scenario.name} (
                  {scenario.shouldSucceed ? 'Success' : 'Error'}) -{' '}
                  {scenario.delay}ms
                </option>
              ))}
            </Select>

            {activeScenario && <p>{activeScenario.description}</p>}
          </div>

          {/* Settings */}
          <div>
            <Checkbox
              id="delayVariation"
              checked={config.settings.delayVariation}
              onChange={(e) =>
                mockStateManager.updateSettings({
                  delayVariation: e.target.checked,
                })
              }
              label="Delay Variation"
            />

            <div>
              <label>Variation %</label>
              <Input
                type="number"
                value={config.settings.variationPercent}
                onChange={(e) =>
                  mockStateManager.updateSettings({
                    variationPercent: parseInt(e.target.value) || 0,
                  })
                }
                min="0"
                max="100"
                disabled={!config.settings.delayVariation}
              />
            </div>
          </div>

          {/* Custom Scenarios */}
          <div>
            <div>
              <h4>Custom Scenarios</h4>
              <Button
                onClick={() => setShowCustomScenario(!showCustomScenario)}
                size="sm"
                variant="outline"
              >
                Add Custom
              </Button>
            </div>

            {showCustomScenario && (
              <div>
                <div>
                  <Input
                    placeholder="Scenario ID"
                    value={customScenario.id}
                    onChange={(e) =>
                      setCustomScenario((prev) => ({
                        ...prev,
                        id: e.target.value,
                      }))
                    }
                  />
                  <Input
                    placeholder="Scenario Name"
                    value={customScenario.name}
                    onChange={(e) =>
                      setCustomScenario((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                  />
                </div>

                <Textarea
                  placeholder="Description"
                  value={customScenario.description}
                  onChange={(e) =>
                    setCustomScenario((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={2}
                />

                <div>
                  <Input
                    type="number"
                    placeholder="Delay (ms)"
                    value={customScenario.delay}
                    onChange={(e) =>
                      setCustomScenario((prev) => ({
                        ...prev,
                        delay: parseInt(e.target.value) || 1000,
                      }))
                    }
                    min="0"
                  />

                  <Checkbox
                    id="shouldSucceed"
                    checked={customScenario.shouldSucceed}
                    onChange={(e) =>
                      setCustomScenario((prev) => ({
                        ...prev,
                        shouldSucceed: e.target.checked,
                      }))
                    }
                    label="Should Succeed"
                  />
                </div>

                <div>
                  <Button
                    onClick={handleAddCustomScenario}
                    size="sm"
                    variant="success"
                  >
                    Add Scenario
                  </Button>
                  <Button
                    onClick={() => setShowCustomScenario(false)}
                    size="sm"
                    variant="ghost"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* List Custom Scenarios */}
            {config.customScenarios.length > 0 && (
              <div>
                {config.customScenarios.map((scenario) => (
                  <div key={scenario.id}>
                    <div>
                      <div>{scenario.name}</div>
                      <div>{scenario.description}</div>
                    </div>
                    <Button
                      onClick={() => handleRemoveCustomScenario(scenario.id)}
                      size="sm"
                      variant="ghost"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Import/Export */}
          <div>
            <h4>Configuration</h4>
            <div>
              <Button onClick={handleExportConfig} size="sm" variant="outline">
                Export
              </Button>
              <Button onClick={handleImportConfig} size="sm" variant="outline">
                Import
              </Button>
              <Button
                onClick={() => mockStateManager.reset()}
                size="sm"
                variant="outline"
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
