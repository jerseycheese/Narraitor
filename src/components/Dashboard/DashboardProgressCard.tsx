'use client';

import React from 'react';
import type { DashboardMetrics } from '@/types/dashboard.types';

interface DashboardProgressCardProps {
  metrics: DashboardMetrics;
}

export function DashboardProgressCard({ metrics }: DashboardProgressCardProps) {
  const stats = [
    { label: 'Worlds', value: metrics.worldsCreated },
    { label: 'Characters', value: metrics.charactersCreated },
    { label: 'Sessions', value: metrics.sessionsPlayed },
    { label: 'Entries', value: metrics.narrativeSegments },
  ];

  return (
    <section
      className="component-dashboard-progress-card"
      aria-labelledby="progress-heading"
      role="region"
    >
      <h2 id="progress-heading">Your Progress</h2>

      <div className="dashboard-progress-stats">
        {stats.map((stat) => (
          <div key={stat.label} className="dashboard-progress-stat">
            <span className="dashboard-progress-stat-label">{stat.label}</span>
            <span className="dashboard-progress-stat-value">{stat.value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
