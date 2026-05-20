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
    description:
      'Generate a completely original world with unique settings and themes',
    requiresReference: false,
  },
  {
    id: 'inspired_by',
    label: 'Inspired By',
    description:
      'Generate an original world inspired by an existing fictional universe or real setting',
    requiresReference: true,
    referenceLabel: 'Existing Setting',
    referencePlaceholder: 'e.g., Star Wars, The Office, Breaking Bad',
    additionalDetailsLabel: 'Additional Details',
    additionalDetailsPlaceholder:
      'What aspects should your world be inspired by? What makes it unique?',
  },
  {
    id: 'set_within',
    label: 'Set Within',
    description:
      'Generate a world directly within an existing fictional universe or real setting',
    requiresReference: true,
    referenceLabel: 'Existing Setting',
    referencePlaceholder: 'e.g., Star Wars, The Office, Breaking Bad',
    additionalDetailsLabel: 'Specific Setting/Time',
    additionalDetailsPlaceholder:
      "Where specifically in this universe? What time period? What's the focus?",
  },
];

export function WorldTypeSelector({
  value,
  onChange,
  showLabels = true,
  size = 'medium',
  disabled = false,
  className = '',
}: WorldTypeSelectorProps) {
  // Defensive check to prevent crashes if value is undefined
  if (!value) {
    return null;
  }

  const selectedOption = WORLD_TYPE_OPTIONS.find(
    (option) => option.id === value.worldType
  );

  const handleTypeChange = (worldType: WorldTypeData['worldType']) => {
    onChange({
      ...value,
      worldType,
      // Clear reference fields when switching to original
      ...(worldType === 'original'
        ? { worldReference: '', additionalDetails: '' }
        : {}),
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

  return (
    <div className={`${className}`}>
      {/* World Type Selection */}
      {showLabels && (
        <Label>
          World Type <span>*</span>
        </Label>
      )}

      <RadioGroup
        value={value.worldType}
        onValueChange={handleRadioChange}
        disabled={disabled}
      >
        {WORLD_TYPE_OPTIONS.map((option) => (
          <label key={option.id}>
            <RadioGroupItem value={option.id} />
            <div>
              <div>{option.label}</div>
              <div>
                {option.description}
              </div>
            </div>
          </label>
        ))}
      </RadioGroup>

      {/* Conditional Fields */}
      {selectedOption?.requiresReference && (
        <div>
          {/* Existing Setting Field */}
          <div>
            <Label htmlFor="world-reference">
              {selectedOption.referenceLabel} <span>*</span>
            </Label>
            <Input
              id="world-reference"
              type="text"
              placeholder={selectedOption.referencePlaceholder}
              value={value.worldReference}
              onChange={(e) => handleReferenceChange(e.target.value)}
              disabled={disabled}
            />
          </div>

          {/* Additional Details Field */}
          <div>
            <Label htmlFor="additional-details">
              {selectedOption.additionalDetailsLabel}{' '}
              {value.worldType === 'set_within' ? (
                <span>(optional - will be inferred from your reference)</span>
              ) : (
                <span>*</span>
              )}
            </Label>
            <Textarea
              id="additional-details"
              rows={3}
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

export type { WorldTypeOption, WorldTypeData };
