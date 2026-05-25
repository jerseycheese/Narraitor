'use client';

import React from 'react';
import {
  useUIPreferencesStore,
  type NarrativeTextSize,
} from '@/state/uiPreferencesStore';

const TEXT_SIZE_OPTIONS: { value: NarrativeTextSize; label: string }[] = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
];

interface NarrativeTextSizeControlProps {
  className?: string;
}

/**
 * Lets the reader pick the narrative text size (Small / Medium / Large).
 * Medium matches the per-theme default. The selection is persisted via
 * uiPreferencesStore and drives `data-narrative-text-size` on the history
 * container, which scales `.text-narrative` through CSS.
 */
export const NarrativeTextSizeControl: React.FC<NarrativeTextSizeControlProps> = ({
  className,
}) => {
  const narrativeTextSize = useUIPreferencesStore(
    (state) => state.narrativeTextSize
  );
  const setNarrativeTextSize = useUIPreferencesStore(
    (state) => state.setNarrativeTextSize
  );

  return (
    <div
      className={['narrative-text-size-control', className]
        .filter(Boolean)
        .join(' ')}
      role="group"
      aria-label="Narrative text size"
    >
      <span className="narrative-text-size-control-label">Text size</span>
      <div className="narrative-text-size-control-options">
        {TEXT_SIZE_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            className="narrative-text-size-control-button"
            aria-pressed={narrativeTextSize === option.value}
            onClick={() => setNarrativeTextSize(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
};
