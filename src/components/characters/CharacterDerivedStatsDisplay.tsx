'use client';

import React from 'react';
import { DerivedStat } from '@/types/character.types';

interface CharacterDerivedStatsDisplayProps {
  derivedStats: DerivedStat[];
}

export function CharacterDerivedStatsDisplay({
  derivedStats,
}: CharacterDerivedStatsDisplayProps) {
  if (!derivedStats || derivedStats.length === 0) {
    return null;
  }

  return (
    <div>
      {derivedStats.map((stat) => {
        const percentage =
          stat.maxValue > 0 ? (stat.currentValue / stat.maxValue) * 100 : 0;
        const isDepleted = percentage < 50;
        const isLow = percentage < 75;

        return (
          <div
            key={stat.id}
            
            data-testid={`derived-stat-${stat.name.toLowerCase().replace(/\s+/g, '-')}`}
          >
            <div>
              <h3>{stat.name}</h3>
            </div>

            <div>
              <span
                className={`${
                  isDepleted
                    ? ''
                    : isLow
                      ? ''
                      : ''
                }`}
              >
                {stat.currentValue}
              </span>
              <span>/ {stat.maxValue}</span>
            </div>

            {/* Progress bar */}
            <div>
              <div
                className={`${
                  isDepleted
                    ? ''
                    : isLow
                      ? ''
                      : ''
                }`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>

            {/* Depletion warning */}
            {isDepleted && (
              <p>Depleted</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
