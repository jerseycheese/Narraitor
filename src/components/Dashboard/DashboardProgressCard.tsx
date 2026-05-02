'use client';

import React from 'react';
import { Globe, Users, Play, BookOpen } from 'lucide-react';
import type { DashboardMetrics } from '@/types/dashboard.types';

interface DashboardProgressCardProps {
  metrics: DashboardMetrics;
}

export function DashboardProgressCard({ metrics }: DashboardProgressCardProps) {
  const stats = [
    {
      label: 'Worlds',
      value: metrics.worldsCreated,
      icon: Globe,
    },
    {
      label: 'Characters',
      value: metrics.charactersCreated,
      icon: Users,
    },
    {
      label: 'Sessions',
      value: metrics.sessionsPlayed,
      icon: Play,
    },
    {
      label: 'Entries',
      value: metrics.narrativeSegments,
      icon: BookOpen,
    },
  ];

  return (
    <section
      className="component-dashboard-progress-card"
      aria-labelledby="progress-heading"
      role="region"
    >
      <h2 id="progress-heading">Your Progress</h2>

      <div className="dashboard-progress-stats">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="dashboard-progress-stat">
              <div className="dashboard-progress-stat-value">
                <Icon aria-hidden="true" />
                <span>{stat.value}</span>
              </div>
              <p className="dashboard-progress-stat-label">{stat.label}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
