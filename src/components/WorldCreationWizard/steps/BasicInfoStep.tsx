'use client';

import React, { useState } from 'react';
import { World } from '@/types/world.types';

interface BasicInfoStepProps {
  worldData: Partial<World>;
  errors: Record<string, string>;
  onUpdate: (updates: Partial<World>) => void;
  onNext: () => void;
  onCancel: () => void;
}

const GENRE_OPTIONS = [
  { value: 'fantasy', label: 'Fantasy' },
  { value: 'sci-fi', label: 'Science Fiction' },
  { value: 'modern', label: 'Modern' },
  { value: 'historical', label: 'Historical' },
  { value: 'post-apocalyptic', label: 'Post-Apocalyptic' },
  { value: 'cyberpunk', label: 'Cyberpunk' },
  { value: 'western', label: 'Western' },
  { value: 'other', label: 'Other' },
];

export default function BasicInfoStep({
  worldData,
  errors,
  onUpdate,
  onNext,
  onCancel,
}: BasicInfoStepProps) {
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

  const validateAndNext = () => {
    const newErrors: Record<string, string> = {};
    
    // Basic validation
    if (!worldData.name || worldData.name.trim().length < 3) {
      newErrors.name = 'World name must be at least 3 characters';
    }
    if (!worldData.description || worldData.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setLocalErrors(newErrors);
      return;
    }
    
    setLocalErrors({});
    onNext();
  };

  const combinedErrors = { ...errors, ...localErrors };

  return (
    <div data-testid="basic-info-step">
      <h2 className="text-xl font-bold mb-4">Basic Information</h2>
      <p className="mb-4">
        Let&apos;s start with some basic information about your world.
      </p>

      <div className="mb-4">
        <label htmlFor="worldName" className="block mb-1">
          World Name <span className="text-red-500">*</span>
        </label>
        <input
          id="worldName"
          data-testid="world-name-input"
          type="text"
          value={worldData.name || ''}
          onChange={(e) => onUpdate({ ...worldData, name: e.target.value })}
          placeholder="Enter your world's name"
          className="w-full p-2 border rounded"
          aria-invalid={!!combinedErrors.name}
          aria-describedby={combinedErrors.name ? 'name-error' : undefined}
        />
        {combinedErrors.name && (
          <span id="name-error" data-testid="name-error" className="text-red-500">
            {combinedErrors.name}
          </span>
        )}
      </div>

      <div className="mb-4">
        <label htmlFor="worldDescription" className="block mb-1">
          Brief Description <span className="text-red-500">*</span>
        </label>
        <textarea
          id="worldDescription"
          data-testid="world-description-textarea"
          value={worldData.description || ''}
          onChange={(e) => onUpdate({ ...worldData, description: e.target.value })}
          placeholder="Provide a brief description of your world"
          rows={4}
          className="w-full p-2 border rounded"
          aria-invalid={!!combinedErrors.description}
          aria-describedby={combinedErrors.description ? 'description-error' : undefined}
        />
        {combinedErrors.description && (
          <span id="description-error" data-testid="description-error" className="text-red-500">
            {combinedErrors.description}
          </span>
        )}
      </div>

      <div className="mb-4">
        <label htmlFor="worldGenre" className="block mb-1">
          Genre <span className="text-red-500">*</span>
        </label>
        <select
          id="worldGenre"
          data-testid="world-genre-select"
          value={worldData.theme || 'fantasy'}
          onChange={(e) => onUpdate({ ...worldData, theme: e.target.value })}
          className="w-full p-2 border rounded"
        >
          {GENRE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex justify-between mt-6">
        <button
          type="button"
          data-testid="step-cancel-button"
          onClick={onCancel}
          className="px-4 py-2 border rounded"
        >
          Cancel
        </button>
        <button
          type="button"
          data-testid="step-next-button"
          onClick={validateAndNext}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Next
        </button>
      </div>
    </div>
  );
}

