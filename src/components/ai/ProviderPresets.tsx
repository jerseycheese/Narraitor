import React from 'react';
import { clsx } from 'clsx';
import { PROVIDER_PRESETS } from '@/lib/ai/presets';
import type { ProviderPreset } from '@/types/provider.types';
import './provider-config.css';

interface ProviderPresetsProps {
  selectedId: string | null;
  onSelect: (preset: ProviderPreset) => void;
  className?: string;
}

const presetPendingNote = (preset: ProviderPreset) =>
  preset.note ? `Coming soon - ${preset.note}` : 'Coming soon';

/**
 * Grid of popular providers. Only the ones that work in this release are
 * selectable; the rest are shown but disabled so players can see what's coming.
 */
export function ProviderPresets({ selectedId, onSelect, className }: ProviderPresetsProps) {
  return (
    <div className={clsx('component-provider-presets', className)}>
      {PROVIDER_PRESETS.map((preset) => (
        <button
          key={preset.id}
          type="button"
          className="provider-preset"
          data-selected={selectedId === preset.id}
          disabled={!preset.available}
          onClick={() => onSelect(preset)}
          aria-pressed={selectedId === preset.id}
        >
          <span className="provider-preset-name">{preset.name}</span>
          <span className="provider-preset-note">
            {preset.available
              ? preset.note ?? preset.defaultModel
              : presetPendingNote(preset)}
          </span>
        </button>
      ))}
    </div>
  );
}
