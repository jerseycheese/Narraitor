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
 * Form for an advanced custom endpoint.
 *
 * This is the generic door onto the provider abstraction (#890): anything that
 * accepts OpenAI-style chat completions works here, which is most of them. The
 * named presets are a curated list on top of the same path.
 */
export function CustomProviderForm({ value, onChange, className }: CustomProviderFormProps) {
  return (
    <div className={clsx('component-custom-provider-form', className)}>
      <p className="form-help-text">
        Any service that accepts OpenAI-style chat completions works here. The endpoint must be an
        https URL on a public host — the request is made by the server, so a local address is not
        reachable.
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
