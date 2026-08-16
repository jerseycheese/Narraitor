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
  /**
   * Shape of address to show in the empty field. A preset that expects the
   * player to host the service themselves passes its own example, because the
   * path is the part nobody guesses right.
   */
  endpointPlaceholder?: string;
}

const DEFAULT_ENDPOINT_PLACEHOLDER = 'https://api.example.com/v1/chat/completions';

/**
 * Form for an advanced custom endpoint.
 *
 * This is the generic door onto the provider abstraction: anything that
 * accepts OpenAI-style chat completions works here, which is most of them. The
 * named presets are a curated list on top of the same path.
 */
export function CustomProviderForm({
  value,
  onChange,
  className,
  endpointPlaceholder,
}: CustomProviderFormProps) {
  // A shape hint for the field, not the security check: the endpoint is refused
  // server-side by the endpoint guard, which is the only place that decision is
  // safe to make. This just stops the player walking to the verify step with an
  // address the server is always going to turn down.
  const endpointLooksWrong = value.endpoint.trim().length > 0 && !value.endpoint.trim().startsWith('https://');

  return (
    <div className={clsx('component-custom-provider-form', className)}>
      <p className="form-help-text" id="custom-provider-endpoint-help">
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
          placeholder={endpointPlaceholder || DEFAULT_ENDPOINT_PLACEHOLDER}
          aria-describedby="custom-provider-endpoint-help"
          aria-invalid={endpointLooksWrong || undefined}
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
