'use client';

import React, { useId, useMemo, useState } from 'react';
import Image from 'next/image';
import { clsx } from 'clsx';
import { GeneratedImage } from '@/types/common.types';
import {
  PRESET_AVATARS,
  PRESET_AVATAR_CATEGORIES,
  PresetAvatarCategory,
  searchPresetAvatars,
} from '@/lib/portraits/presetAvatars';
import { getTimestamp } from '@/lib/utils';
import './PresetAvatarPicker.css';

interface PresetAvatarPickerProps {
  onPreview: (portrait: GeneratedImage) => void;
  selectedUrl?: string | null;
  className?: string;
}

export function PresetAvatarPicker({
  onPreview,
  selectedUrl = null,
  className,
}: PresetAvatarPickerProps) {
  const searchId = useId();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<PresetAvatarCategory | 'all'>('all');

  const avatars = useMemo(
    () => searchPresetAvatars(query, category),
    [query, category]
  );

  return (
    <div className={clsx('component-preset-avatar-picker', className)}>
      <div className="preset-avatar-picker-filters">
        <div className="preset-avatar-picker-search">
          <label htmlFor={searchId}>Search avatars</label>
          <input
            id={searchId}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Try ranger, visor, detective"
          />
        </div>

        <div
          className="preset-avatar-picker-categories"
          role="group"
          aria-label="Filter avatars by category"
        >
          <button
            type="button"
            className={clsx(
              'preset-avatar-picker-category',
              category === 'all' && 'preset-avatar-picker-category-active'
            )}
            aria-pressed={category === 'all'}
            onClick={() => setCategory('all')}
          >
            All
          </button>
          {PRESET_AVATAR_CATEGORIES.map((option) => (
            <button
              key={option.id}
              type="button"
              className={clsx(
                'preset-avatar-picker-category',
                category === option.id && 'preset-avatar-picker-category-active'
              )}
              aria-pressed={category === option.id}
              onClick={() => setCategory(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {avatars.length === 0 ? (
        <p className="preset-avatar-picker-empty">
          No avatars match that search. Try a different word or category.
        </p>
      ) : (
        <ul className="preset-avatar-picker-grid">
          {avatars.map((avatar) => {
            const isSelected = selectedUrl === avatar.url;

            return (
              <li key={avatar.id}>
                <button
                  type="button"
                  className={clsx(
                    'preset-avatar-picker-option',
                    isSelected && 'preset-avatar-picker-option-selected'
                  )}
                  aria-pressed={isSelected}
                  onClick={() =>
                    onPreview({
                      type: 'preset',
                      url: avatar.url,
                      generatedAt: getTimestamp(),
                    })
                  }
                >
                  <Image
                    src={avatar.url}
                    alt=""
                    width={72}
                    height={72}
                    unoptimized
                  />
                  <span className="preset-avatar-picker-option-name">
                    {avatar.name} avatar
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <p className="preset-avatar-picker-count">
        {avatars.length} of {PRESET_AVATARS.length} avatars shown
      </p>
    </div>
  );
}
