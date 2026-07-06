import React from 'react';
import { clsx } from 'clsx';
import { Button } from '@/components/ui/button';
import type { ProviderConfig, ProviderValidationRecord } from '@/types/provider.types';
import './provider-config.css';

interface ProviderCardProps {
  provider: ProviderConfig;
  isActive: boolean;
  validation?: ProviderValidationRecord;
  onSetActive: (id: string) => void;
  onValidate: (id: string) => void;
  onDelete: (id: string) => void;
  isValidating?: boolean;
  className?: string;
}

/** A saved provider with its status and switch / re-check / remove actions. */
export function ProviderCard({
  provider,
  isActive,
  validation,
  onSetActive,
  onValidate,
  onDelete,
  isValidating = false,
  className,
}: ProviderCardProps) {
  return (
    <div
      className={clsx('component-provider-card', className)}
      data-active={isActive}
      data-provider-id={provider.id}
    >
      <div className="provider-card-head">
        <div>
          <div className="provider-card-name">{provider.name}</div>
          <div className="provider-card-meta">{provider.model}</div>
        </div>
        <div className="provider-card-badges">
          {isActive && (
            <span className="provider-badge" data-tone="active">
              In use
            </span>
          )}
          {validation && (
            <span
              className="provider-badge"
              data-tone={validation.valid ? 'valid' : 'invalid'}
            >
              {validation.valid ? 'Connected' : 'Needs attention'}
            </span>
          )}
        </div>
      </div>

      <div className="provider-card-actions">
        {!isActive && (
          <Button variant="secondary" size="sm" onClick={() => onSetActive(provider.id)}>
            Use this
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onValidate(provider.id)}
          disabled={isValidating}
        >
          {isValidating ? 'Checking...' : 'Test connection'}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onDelete(provider.id)}>
          Remove
        </Button>
      </div>
    </div>
  );
}
