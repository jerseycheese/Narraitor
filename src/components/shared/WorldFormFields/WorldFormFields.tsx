'use client';

import React from 'react';
import { GENRES } from '@/lib/constants/genres';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { LoadingState as UILoadingState } from '@/components/ui/LoadingState/LoadingState';

export interface WorldNameInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export function WorldNameInput({
  value,
  onChange,
  error,
  placeholder,
  disabled = false,
  required = false,
  className = '',
}: WorldNameInputProps) {
  return (
    <div className={className}>
      <Label htmlFor="world-name">
        World Name {required && <span>*</span>}
      </Label>
      <Input
        id="world-name"
        type="text"
        placeholder={placeholder || 'E.g., Neo-Tokyo...'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      />
      {error && <p>{error}</p>}
    </div>
  );
}

export interface GenreSelectProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  className?: string;
}

export function GenreSelect({
  value,
  onChange,
  error,
  disabled = false,
  required = true,
  placeholder = 'Select a genre',
  className = '',
}: GenreSelectProps) {
  return (
    <div className={className}>
      <Label htmlFor="world-genre">Genre {required && <span>*</span>}</Label>
      <Select
        id="world-genre"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      >
        <option value="">{placeholder}</option>
        {GENRES.map((genre) => (
          <option key={genre.value} value={genre.value}>
            {genre.label}
          </option>
        ))}
      </Select>
      {error && <p>{error}</p>}
    </div>
  );
}

export interface DescriptionTextAreaProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  label?: string;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  required?: boolean;
  maxLength?: number;
  className?: string;
}

export function DescriptionTextArea({
  value,
  onChange,
  error,
  label = 'Description',
  placeholder = 'Describe your world...',
  rows = 4,
  disabled = false,
  required = true,
  maxLength = 1000,
  className = '',
}: DescriptionTextAreaProps) {
  const characterCount = value.length;

  return (
    <div className={className}>
      <Label htmlFor="world-description">
        {label} {required && <span>*</span>}
      </Label>
      <Textarea
        id="world-description"
        rows={rows}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        maxLength={maxLength}
      />

      {/* Character count */}
      {maxLength && (
        <div>
          <div>{error && <p>{error}</p>}</div>
          <p>
            {characterCount}/{maxLength}
          </p>
        </div>
      )}

      {/* Error without character count */}
      {!maxLength && error && <p>{error}</p>}
    </div>
  );
}

export interface LoadingStateProps {
  isLoading: boolean;
  message?: string;
  details?: string;
  className?: string;
}

export function LoadingState({
  isLoading,
  message = 'Loading...',
  details,
  className = '',
}: LoadingStateProps) {
  if (!isLoading) return null;

  return (
    <div className={`${className}`}>
      <UILoadingState
        message={details ? `${message}-${details}` : message}
        size="md"
        theme="light"
        centered={true}
      />
    </div>
  );
}

export interface ErrorDisplayProps {
  error: string | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export function ErrorDisplay({
  error,
  onRetry,
  onDismiss,
  className = '',
}: ErrorDisplayProps) {
  if (!error) return null;

  return (
    <div className={`${className}`}>
      <div>
        <div>
          <h3>Error</h3>
          <p>{error}</p>
        </div>

        {(onRetry || onDismiss) && (
          <div>
            {onRetry && (
              <Button onClick={onRetry} variant="ghost">
                Retry
              </Button>
            )}
            {onDismiss && (
              <Button onClick={onDismiss} variant="ghost">
                ×
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Grouped export for all world form components
 */
export const WorldFormFields = {
  NameInput: WorldNameInput,
  GenreSelect: GenreSelect,
  DescriptionTextArea: DescriptionTextArea,
  LoadingState: LoadingState,
  ErrorDisplay: ErrorDisplay,
};
