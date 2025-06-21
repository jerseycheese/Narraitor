'use client';

import React from 'react';
import { WorldTypeOption, WorldTypeData } from './types';

export interface WorldTypeSelectorProps {
  value: WorldTypeData;
  onChange: (data: WorldTypeData) => void;
  showLabels?: boolean;
  layout?: 'vertical' | 'horizontal';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  className?: string;
}

const WORLD_TYPE_OPTIONS: WorldTypeOption[] = [
  {
    id: 'original',
    label: 'Original World',
    description: 'Generate a completely original world with unique settings and themes',
    requiresReference: false,
  },
  {
    id: 'inspired_by',
    label: 'Inspired By',
    description: 'Generate an original world inspired by an existing fictional universe or real setting',
    requiresReference: true,
    referenceLabel: 'Existing Setting',
    referencePlaceholder: 'E.g., Star Wars, The Office, Lord of the Rings, Breaking Bad...',
    additionalDetailsLabel: 'Additional Details',
    additionalDetailsPlaceholder: 'What aspects should your world be inspired by? What makes it unique?',
  },
  {
    id: 'set_within',
    label: 'Set Within',
    description: 'Generate a world directly within an existing fictional universe or real setting',
    requiresReference: true,
    referenceLabel: 'Existing Setting',
    referencePlaceholder: 'E.g., Star Wars, The Office, Lord of the Rings, Breaking Bad...',
    additionalDetailsLabel: 'Specific Setting/Time',
    additionalDetailsPlaceholder: 'Where specifically in this universe? What time period? What\'s the focus?',
  },
];

export function WorldTypeSelector({
  value,
  onChange,
  showLabels = true,
  layout = 'vertical',
  size = 'medium',
  disabled = false,
  className = '',
}: WorldTypeSelectorProps) {
  // Defensive check to prevent crashes if value is undefined
  if (!value) {
    return null;
  }
  
  const selectedOption = WORLD_TYPE_OPTIONS.find(option => option.id === value.worldType);

  const handleTypeChange = (worldType: WorldTypeData['worldType']) => {
    onChange({
      ...value,
      worldType,
      // Clear reference fields when switching to original
      ...(worldType === 'original' ? { worldReference: '', additionalDetails: '' } : {}),
    });
  };

  const handleReferenceChange = (worldReference: string) => {
    onChange({ ...value, worldReference });
  };

  const handleAdditionalDetailsChange = (additionalDetails: string) => {
    onChange({ ...value, additionalDetails });
  };

  const sizeClasses = {
    small: {
      container: 'space-y-2',
      radio: 'p-2',
      title: 'text-sm font-medium',
      description: 'text-xs',
      input: 'text-sm py-1',
      label: 'text-xs font-medium',
    },
    medium: {
      container: 'space-y-3',
      radio: 'p-3',
      title: 'font-medium',
      description: 'text-sm',
      input: 'py-2',
      label: 'text-sm font-medium',
    },
    large: {
      container: 'space-y-4',
      radio: 'p-4',
      title: 'text-lg font-semibold',
      description: 'text-base',
      input: 'py-3',
      label: 'text-base font-semibold',
    },
  };

  const styles = sizeClasses[size];
  const layoutClasses = layout === 'horizontal' ? 'flex flex-wrap gap-4' : 'space-y-3';

  return (
    <div className={`${className}`}>
      {/* World Type Selection */}
      {showLabels && (
        <label className={`block ${styles.label} text-gray-700 mb-3`}>
          World Type <span className="text-red-500">*</span>
        </label>
      )}
      
      <div className={layoutClasses}>
        {WORLD_TYPE_OPTIONS.map((option) => (
          <label
            key={option.id}
            className={`flex items-start ${styles.radio} border rounded-lg cursor-pointer hover:bg-gray-50 ${
              value.worldType === option.id ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input
              type="radio"
              name="worldType"
              value={option.id}
              checked={value.worldType === option.id}
              onChange={() => handleTypeChange(option.id)}
              disabled={disabled}
              className="mt-1 mr-3"
            />
            <div className="flex-1">
              <div className={`${styles.title} text-gray-900`}>{option.label}</div>
              <div className={`${styles.description} text-gray-600`}>{option.description}</div>
            </div>
          </label>
        ))}
      </div>

      {/* Conditional Fields */}
      {selectedOption?.requiresReference && (
        <div className={styles.container}>
          {/* Existing Setting Field */}
          <div>
            <label htmlFor="world-reference" className={`block ${styles.label} text-gray-700 mb-2`}>
              {selectedOption.referenceLabel} <span className="text-red-500">*</span>
            </label>
            <input
              id="world-reference"
              type="text"
              className={`w-full px-3 ${styles.input} border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder={selectedOption.referencePlaceholder}
              value={value.worldReference}
              onChange={(e) => handleReferenceChange(e.target.value)}
              disabled={disabled}
            />
          </div>

          {/* Additional Details Field */}
          <div>
            <label htmlFor="additional-details" className={`block ${styles.label} text-gray-700 mb-2`}>
              {selectedOption.additionalDetailsLabel} <span className="text-red-500">*</span>
            </label>
            <textarea
              id="additional-details"
              rows={3}
              className={`w-full px-3 ${styles.input} border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder={selectedOption.additionalDetailsPlaceholder}
              value={value.additionalDetails}
              onChange={(e) => handleAdditionalDetailsChange(e.target.value)}
              disabled={disabled}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export { WORLD_TYPE_OPTIONS };
export type { WorldTypeOption, WorldTypeData };