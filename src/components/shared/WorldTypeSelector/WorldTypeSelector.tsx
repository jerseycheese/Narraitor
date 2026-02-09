'use client';

import React from 'react';
import { WorldTypeOption, WorldTypeData } from './types';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

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
    referencePlaceholder: 'e.g., Star Wars, The Office, Breaking Bad',
    additionalDetailsLabel: 'Additional Details',
    additionalDetailsPlaceholder: 'What aspects should your world be inspired by? What makes it unique?',
  },
  {
    id: 'set_within',
    label: 'Set Within',
    description: 'Generate a world directly within an existing fictional universe or real setting',
    requiresReference: true,
    referenceLabel: 'Existing Setting',
    referencePlaceholder: 'e.g., Star Wars, The Office, Breaking Bad',
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

  const handleRadioChange = (value: string) => {
    handleTypeChange(value as WorldTypeData['worldType']);
  };

  const handleReferenceChange = (worldReference: string) => {
    onChange({ ...value, worldReference });
  };

  const handleAdditionalDetailsChange = (additionalDetails: string) => {
    onChange({ ...value, additionalDetails });
  };

  const sizeClasses = {
    small: {
      container: '',
      conditionalTop: '',
      radio: '',
      title: '',
      description: '',
      input: '',
      label: '',
    },
    medium: {
      container: '',
      conditionalTop: '',
      radio: '',
      title: '',
      description: '',
      input: '',
      label: '',
    },
    large: {
      container: '',
      conditionalTop: '',
      radio: '',
      title: '',
      description: '',
      input: '',
      label: '',
    },
  };

  const styles = sizeClasses[size];
  const layoutClasses = layout === 'horizontal' ? '' : '';

  return (
    <div className={`${className}`}>
      {/* World Type Selection */}
      {showLabels && (
        <Label className={`${styles.label}`}>
          World Type <span >*</span>
        </Label>
      )}
      
      <RadioGroup
        value={value.worldType}
        onValueChange={handleRadioChange}
        disabled={disabled}
        className={layoutClasses}
      >
        {WORLD_TYPE_OPTIONS.map((option) => (
          <label
            key={option.id}
            className={`${styles.radio}${
              value.worldType === option.id ? '' : ''
            }${disabled ? '' : ''}`}
          >
            <RadioGroupItem
              value={option.id}
              
            />
            <div >
              <div className={`${styles.title}`}>{option.label}</div>
              <div className={`${styles.description}`}>{option.description}</div>
            </div>
          </label>
        ))}
      </RadioGroup>

      {/* Conditional Fields */}
      {selectedOption?.requiresReference && (
        <div className={`${styles.conditionalTop}${styles.container}`}>
          {/* Existing Setting Field */}
          <div>
            <Label htmlFor="world-reference" className={`${styles.label}`}>
              {selectedOption.referenceLabel} <span >*</span>
            </Label>
            <Input
              id="world-reference"
              type="text"
              className={`${styles.input}`}
              placeholder={selectedOption.referencePlaceholder}
              value={value.worldReference}
              onChange={(e) => handleReferenceChange(e.target.value)}
              disabled={disabled}
            />
          </div>

          {/* Additional Details Field */}
          <div>
            <Label htmlFor="additional-details" className={`${styles.label}`}>
              {selectedOption.additionalDetailsLabel} {value.worldType === 'set_within' ? (
                <span >(optional - will be inferred from your reference)</span>
              ) : (
                <span >*</span>
              )}
            </Label>
            <Textarea
              id="additional-details"
              rows={3}
              className={`${styles.input}`}
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
