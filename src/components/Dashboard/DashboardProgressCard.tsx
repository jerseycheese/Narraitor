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
      color: 'bg-primary/10 text-primary border-primary/20'
    },
    {
      label: 'Characters',
      value: metrics.charactersCreated,
      icon: Users,
      color: 'bg-success/10 text-success border-success/20'
    },
    {
      label: 'Sessions',
      value: metrics.sessionsPlayed,
      icon: Play,
      color: 'bg-info/10 text-info border-info/20'
    },
    {
      label: 'Entries',
      value: metrics.narrativeSegments,
      icon: BookOpen,
      color: 'bg-secondary/10 text-secondary border-secondary/20'
    }
  ];

  return (
    <section
      className="bg-background rounded-lg border p-6 shadow-sm"
      aria-labelledby="progress-heading"
      role="region"
      aria-label="Your progress metrics"
    >
      <h2 id="progress-heading" className="text-lg font-semibold mb-4">
        Your Progress
      </h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className={`rounded-lg border p-4 ${stat.color}`}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className="w-5 h-5" aria-hidden="true" />
                <span className="text-2xl font-bold">{stat.value}</span>
              </div>
              <p className="text-sm font-medium">{stat.label}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
