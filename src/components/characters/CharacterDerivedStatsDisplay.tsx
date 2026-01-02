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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {derivedStats.map((stat) => {
        const percentage =
          stat.maxValue > 0 ? (stat.currentValue / stat.maxValue) * 100 : 0;
        const isDepleted = percentage < 50;
        const isLow = percentage < 75;

        return (
          <div
            key={stat.id}
            className="flex flex-col p-4 rounded-lg border bg-card"
            data-testid={`derived-stat-${stat.name.toLowerCase().replace(/\s+/g, '-')}`}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-medium text-card-foreground">{stat.name}</h3>
            </div>

            <div className="flex items-baseline gap-2">
              <span
                className={`text-2xl font-bold ${
                  isDepleted
                    ? 'text-destructive'
                    : isLow
                      ? 'text-orange-500'
                      : 'text-card-foreground'
                }`}
              >
                {stat.currentValue}
              </span>
              <span className="text-muted-foreground">/ {stat.maxValue}</span>
            </div>

            {/* Progress bar */}
            <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  isDepleted
                    ? 'bg-destructive'
                    : isLow
                      ? 'bg-orange-500'
                      : 'bg-primary'
                }`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>

            {/* Depletion warning */}
            {isDepleted && (
              <p className="mt-2 text-sm text-destructive">Depleted</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
