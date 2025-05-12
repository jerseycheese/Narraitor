import React, { useState, useCallback } from 'react';
import { PriorityWeights } from '../types';

interface PrioritizationSettingsProps {
  defaultWeights?: PriorityWeights;
  presets?: Array<{ name: string; weights: PriorityWeights }>;
  onChange?: (weights: PriorityWeights) => void;
  readOnly?: boolean;
}

export const PrioritizationSettings: React.FC<PrioritizationSettingsProps> = ({
  defaultWeights = {},
  presets = [],
  onChange,
  readOnly = false
}) => {
  const [weights, setWeights] = useState<PriorityWeights>(defaultWeights);
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  
  const handleWeightChange = useCallback((key: string, value: number) => {
    if (readOnly) return;
    
    const newWeights = { ...weights, [key]: value };
    setWeights(newWeights);
    onChange?.(newWeights);
  }, [weights, onChange, readOnly]);
  
  const handlePresetSelect = useCallback((presetName: string) => {
    const preset = presets.find(p => p.name === presetName);
    if (!preset || readOnly) return;
    
    setSelectedPreset(presetName);
    setWeights(preset.weights);
    onChange?.(preset.weights);
  }, [presets, onChange, readOnly]);
  
  const contextTypes = Object.keys(weights);
  
  return (
    <div className="narraitor-prioritization-settings-container space-y-4">
      {presets.length > 0 && (
        <div className="narraitor-prioritization-settings-presets">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Presets
          </label>
          <select
            value={selectedPreset}
            onChange={(e) => handlePresetSelect(e.target.value)}
            disabled={readOnly}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Custom</option>
            {presets.map(preset => (
              <option key={preset.name} value={preset.name}>
                {preset.name}
              </option>
            ))}
          </select>
        </div>
      )}
      
      <div className="narraitor-prioritization-settings-weights space-y-3">
        <h3 className="text-sm font-medium text-gray-700">Priority Weights</h3>
        {contextTypes.map(type => (
          <div key={type} className="flex items-center space-x-3">
            <label className="flex-1 text-sm text-gray-600">
              {type.replace(/\./g, ' > ')}
            </label>
            <input
              type="range"
              min="1"
              max="5"
              value={weights[type]}
              onChange={(e) => handleWeightChange(type, parseInt(e.target.value))}
              disabled={readOnly}
              className="w-32"
            />
            <span className="w-8 text-sm text-gray-700 text-center">
              {weights[type]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
