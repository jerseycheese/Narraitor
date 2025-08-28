// src/components/devtools/MockControlsSection/ScenarioEditor.tsx

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MockScenario } from '@/lib/ai/types';

interface ScenarioEditorProps {
  scenario?: MockScenario;
  onSave: (scenario: Omit<MockScenario, 'id'>) => void;
  onCancel: () => void;
}

/**
 * Editor for creating and modifying mock scenarios
 */
export const ScenarioEditor: React.FC<ScenarioEditorProps> = ({
  scenario,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    name: scenario?.name || '',
    type: scenario?.type || 'success' as const,
    delay: scenario?.delay?.toString() || '1000',
    description: scenario?.description || '',
    responseContent: scenario?.response?.content || '',
    errorCode: scenario?.error?.code || '',
    errorMessage: scenario?.error?.message || '',
    errorRetryable: scenario?.error?.retryable || true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newScenario: Omit<MockScenario, 'id'> = {
      name: formData.name,
      type: formData.type,
      delay: parseInt(formData.delay) || 1000,
      description: formData.description
    };

    // Add type-specific data
    if (formData.type === 'error') {
      newScenario.error = {
        code: formData.errorCode || 'MOCK_ERROR',
        message: formData.errorMessage || 'Mock error',
        retryable: formData.errorRetryable
      };
    } else if ((formData.type === 'success' || formData.type === 'custom') && formData.responseContent) {
      newScenario.response = {
        content: formData.responseContent,
        finishReason: 'STOP'
      };
    }

    onSave(newScenario);
  };

  const updateField = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="bg-slate-700 p-4 rounded border border-slate-600 space-y-4">
      <h4 className="text-sm font-semibold text-slate-200">
        {scenario ? 'Edit Scenario' : 'Create New Scenario'}
      </h4>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Name
            </label>
            <Input
              value={formData.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="Scenario name"
              className="bg-slate-800 border-slate-600 text-slate-200"
              required
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Type
            </label>
            <select 
              value={formData.type} 
              onChange={(e) => updateField('type', e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 text-slate-200 rounded px-3 py-2 text-sm"
            >
              <option value="success">Success</option>
              <option value="error">Error</option>
              <option value="timeout">Timeout</option>
              <option value="custom">Custom</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Delay (ms)
            </label>
            <Input
              type="number"
              value={formData.delay}
              onChange={(e) => updateField('delay', e.target.value)}
              placeholder="1000"
              className="bg-slate-800 border-slate-600 text-slate-200"
              min="0"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Description
          </label>
          <Input
            value={formData.description}
            onChange={(e) => updateField('description', e.target.value)}
            placeholder="Describe this scenario"
            className="bg-slate-800 border-slate-600 text-slate-200"
          />
        </div>

        {/* Error-specific fields */}
        {formData.type === 'error' && (
          <div className="space-y-3 p-3 bg-slate-800 rounded border border-slate-600">
            <h5 className="text-xs font-medium text-slate-300">Error Configuration</h5>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Error Code
                </label>
                <Input
                  value={formData.errorCode}
                  onChange={(e) => updateField('errorCode', e.target.value)}
                  placeholder="API_ERROR"
                  className="bg-slate-700 border-slate-500 text-slate-200"
                />
              </div>
              
              <div className="flex items-center gap-2 mt-6">
                <input
                  type="checkbox"
                  id="errorRetryable"
                  checked={formData.errorRetryable}
                  onChange={(e) => updateField('errorRetryable', e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="errorRetryable" className="text-xs text-slate-300">
                  Retryable
                </label>
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Error Message
              </label>
              <Input
                value={formData.errorMessage}
                onChange={(e) => updateField('errorMessage', e.target.value)}
                placeholder="Mock error message"
                className="bg-slate-700 border-slate-500 text-slate-200"
              />
            </div>
          </div>
        )}

        {/* Response content for success/custom */}
        {(formData.type === 'success' || formData.type === 'custom') && (
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Response Content (optional)
            </label>
            <Textarea
              value={formData.responseContent}
              onChange={(e) => updateField('responseContent', e.target.value)}
              placeholder="Custom response content (leave empty for auto-generated)"
              className="bg-slate-800 border-slate-600 text-slate-200 min-h-[100px]"
            />
          </div>
        )}

        <div className="flex gap-2 justify-end">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            className="text-slate-300 hover:bg-slate-600"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {scenario ? 'Update' : 'Create'} Scenario
          </Button>
        </div>
      </form>
    </div>
  );
};