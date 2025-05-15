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
      <h2 style={styles.stepTitle}>Basic Information</h2>
      <p style={styles.stepDescription}>
        Let&apos;s start with some basic information about your world.
      </p>

      <div style={styles.formGroup}>
        <label htmlFor="worldName" style={styles.label}>
          World Name <span style={styles.required}>*</span>
        </label>
        <input
          id="worldName"
          data-testid="world-name-input"
          type="text"
          value={worldData.name || ''}
          onChange={(e) => onUpdate({ ...worldData, name: e.target.value })}
          placeholder="Enter your world's name"
          style={styles.input}
          aria-invalid={!!combinedErrors.name}
          aria-describedby={combinedErrors.name ? 'name-error' : undefined}
        />
        {combinedErrors.name && (
          <span id="name-error" data-testid="name-error" style={styles.error}>
            {combinedErrors.name}
          </span>
        )}
      </div>

      <div style={styles.formGroup}>
        <label htmlFor="worldDescription" style={styles.label}>
          Brief Description <span style={styles.required}>*</span>
        </label>
        <textarea
          id="worldDescription"
          data-testid="world-description-textarea"
          value={worldData.description || ''}
          onChange={(e) => onUpdate({ ...worldData, description: e.target.value })}
          placeholder="Provide a brief description of your world"
          rows={4}
          style={styles.textarea}
          aria-invalid={!!combinedErrors.description}
          aria-describedby={combinedErrors.description ? 'description-error' : undefined}
        />
        {combinedErrors.description && (
          <span id="description-error" data-testid="description-error" style={styles.error}>
            {combinedErrors.description}
          </span>
        )}
      </div>

      <div style={styles.formGroup}>
        <label htmlFor="worldGenre" style={styles.label}>
          Genre <span style={styles.required}>*</span>
        </label>
        <select
          id="worldGenre"
          data-testid="world-genre-select"
          value={worldData.theme || 'fantasy'}
          onChange={(e) => onUpdate({ ...worldData, theme: e.target.value })}
          style={styles.select}
        >
          {GENRE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div style={styles.actions}>
        <button
          type="button"
          data-testid="step-cancel-button"
          onClick={onCancel}
          style={styles.cancelButton}
        >
          Cancel
        </button>
        <button
          type="button"
          data-testid="step-next-button"
          onClick={validateAndNext}
          style={styles.nextButton}
        >
          Next
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  stepTitle: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    marginBottom: '0.5rem',
  },
  stepDescription: {
    color: '#6b7280',
    marginBottom: '1.5rem',
  },
  formGroup: {
    marginBottom: '1.5rem',
  },
  label: {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '0.5rem',
  },
  required: {
    color: '#ef4444',
  },
  input: {
    width: '100%',
    padding: '0.5rem 1rem',
    border: '1px solid #d1d5db',
    borderRadius: '0.375rem',
    fontSize: '1rem',
    transition: 'border-color 0.15s',
  },
  textarea: {
    width: '100%',
    padding: '0.5rem 1rem',
    border: '1px solid #d1d5db',
    borderRadius: '0.375rem',
    fontSize: '1rem',
    resize: 'vertical',
    transition: 'border-color 0.15s',
  },
  select: {
    width: '100%',
    padding: '0.5rem 1rem',
    border: '1px solid #d1d5db',
    borderRadius: '0.375rem',
    fontSize: '1rem',
    backgroundColor: 'white',
    cursor: 'pointer',
  },
  error: {
    display: 'block',
    fontSize: '0.875rem',
    color: '#ef4444',
    marginTop: '0.25rem',
  },
  actions: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '2rem',
  },
  cancelButton: {
    padding: '0.5rem 1rem',
    border: '1px solid #d1d5db',
    borderRadius: '0.375rem',
    backgroundColor: 'white',
    color: '#374151',
    cursor: 'pointer',
    transition: 'background-color 0.15s',
  },
  nextButton: {
    padding: '0.5rem 1rem',
    border: 'none',
    borderRadius: '0.375rem',
    backgroundColor: '#3b82f6',
    color: 'white',
    cursor: 'pointer',
    transition: 'background-color 0.15s',
  },
};
