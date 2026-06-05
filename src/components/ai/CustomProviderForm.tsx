import React from 'react';
import { clsx } from 'clsx';
import { Input } from '@/components/ui/input';
import './provider-config.css';

interface CustomProviderValue {
  name: string;
  endpoint: string;
  model: string;
}

interface CustomProviderFormProps {
  value: CustomProviderValue;
  onChange: (updates: Partial<CustomProviderValue>) => void;
  className?: string;
}

/**
 * Form for an advanced custom endpoint. Custom endpoints aren't wired up yet —
 * only Google Gemini works for now — so we say so plainly rather than letting a
 * player hit a dead end at the verify step.
 */
export function CustomProviderForm({ value, onChange, className }: CustomProviderFormProps) {
  return (
    <div className={clsx('component-custom-provider-form', className)}>
      <p className="form-help-text">
        Custom endpoints are coming soon. Right now only Google Gemini works end to end.
      </p>

      <div className="form-group">
        <label className="form-label" htmlFor="custom-provider-name">
          Name
        </label>
        <Input
          id="custom-provider-name"
          value={value.name}
          placeholder="My provider"
          onChange={(e) => onChange({ name: e.target.value })}
        />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="custom-provider-endpoint">
          Endpoint URL
        </label>
        <Input
          id="custom-provider-endpoint"
          value={value.endpoint}
          placeholder="https://api.example.com/v1/chat/completions"
          onChange={(e) => onChange({ endpoint: e.target.value })}
        />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="custom-provider-model">
          Model
        </label>
        <Input
          id="custom-provider-model"
          value={value.model}
          placeholder="model-name"
          onChange={(e) => onChange({ model: e.target.value })}
        />
      </div>
    </div>
  );
}
