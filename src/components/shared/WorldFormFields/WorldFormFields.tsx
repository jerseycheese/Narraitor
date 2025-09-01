'use client';

import React from 'react';
import { GENRES } from '@/lib/constants/genres';
import { getResponsivePlaceholder, RESPONSIVE_PLACEHOLDERS } from '@/lib/utils/responsivePlaceholder';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

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
      <Label htmlFor="world-name" className="block text-sm font-medium text-gray-700 mb-2">
        World Name {required && <span className="text-red-500">*</span>}
      </Label>
      <Input
        id="world-name"
        type="text"
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder={placeholder || getResponsivePlaceholder(RESPONSIVE_PLACEHOLDERS.worldName)}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      />
      {error && (
        <p className="text-sm text-red-600 mt-1">{error}</p>
      )}
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
      <Label htmlFor="world-genre" className="block text-sm font-medium text-gray-700 mb-2">
        Genre {required && <span className="text-red-500">*</span>}
      </Label>
      <Select
        id="world-genre"
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
      {error && (
        <p className="text-sm text-red-600 mt-1">{error}</p>
      )}
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
  const isNearLimit = maxLength && characterCount > maxLength * 0.8;

  return (
    <div className={className}>
      <Label htmlFor="world-description" className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <Textarea
        id="world-description"
        rows={rows}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        maxLength={maxLength}
      />
      
      {/* Character count */}
      {maxLength && (
        <div className="flex justify-between items-center mt-1">
          <div className="flex-1">
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
          </div>
          <p className={`text-xs ${isNearLimit ? 'text-amber-600' : 'text-gray-500'}`}>
            {characterCount}/{maxLength}
          </p>
        </div>
      )}
      
      {/* Error without character count */}
      {!maxLength && error && (
        <p className="text-sm text-red-600 mt-1">{error}</p>
      )}
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
    <div className={`flex items-center justify-center p-4 ${className}`}>
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <p className="text-sm font-medium text-gray-900">{message}</p>
        {details && (
          <p className="text-xs text-gray-600 mt-1">{details}</p>
        )}
      </div>
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
    <div className={`bg-red-50 border border-red-200 rounded-md p-4 ${className}`}>
      <div className="flex">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-800">
            Error
          </h3>
          <p className="text-sm text-red-700 mt-1">
            {error}
          </p>
        </div>
        
        {(onRetry || onDismiss) && (
          <div className="flex space-x-2 ml-4">
            {onRetry && (
              <Button
                onClick={onRetry}
                variant="ghost"
                className="text-sm font-medium text-red-800 hover:text-red-900 underline"
              >
                Retry
              </Button>
            )}
            {onDismiss && (
              <Button
                onClick={onDismiss}
                variant="ghost"
                className="text-sm font-medium text-red-800 hover:text-red-900"
              >
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