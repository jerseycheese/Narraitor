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
      color: ''
    },
    {
      label: 'Characters',
      value: metrics.charactersCreated,
      icon: Users,
      color: ''
    },
    {
      label: 'Sessions',
      value: metrics.sessionsPlayed,
      icon: Play,
      color: ''
    },
    {
      label: 'Entries',
      value: metrics.narrativeSegments,
      icon: BookOpen,
      color: ''
    }
  ];

  return (
    <section
      className="component-dashboard-progress-card"
      aria-labelledby="progress-heading"
      role="region"
    >
      <h2 id="progress-heading" >
        Your Progress
      </h2>

      <div >
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className={`${stat.color}`}
            >
              <div >
                <Icon  aria-hidden="true" />
                <span >{stat.value}</span>
              </div>
              <p >{stat.label}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
