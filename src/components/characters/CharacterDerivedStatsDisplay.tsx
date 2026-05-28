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
    <div className="character-detail-derived-list">
      {derivedStats.map((stat) => {
        const percentage =
          stat.maxValue > 0 ? (stat.currentValue / stat.maxValue) * 100 : 0;
        const isDepleted = percentage < 50;
        const isLow = percentage < 75;
        const fillModifier = isDepleted
          ? 'character-detail-derived-stat-fill-depleted'
          : isLow
            ? 'character-detail-derived-stat-fill-low'
            : '';

        return (
          <div
            key={stat.id}
            className="character-detail-derived-stat"
            data-testid={`derived-stat-${stat.name.toLowerCase().replace(/\s+/g, '-')}`}
          >
            <div className="character-detail-derived-stat-head">
              <h3 className="character-detail-derived-stat-name">{stat.name}</h3>
              <div className="character-detail-derived-stat-values">
                <span className="character-detail-derived-stat-current">
                  {stat.currentValue}
                </span>
                <span className="character-detail-derived-stat-max">
                  / {stat.maxValue}
                </span>
              </div>
            </div>

            <div className="character-detail-derived-stat-bar">
              <div
                className={`character-detail-derived-stat-fill ${fillModifier}`.trim()}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>

            {isDepleted && (
              <p className="character-detail-derived-stat-warning">Depleted</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
