'use client';

import React from 'react';
import { CheckCircle, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DashboardGettingStartedProps {
  hasWorlds: boolean;
  hasCharacters: boolean;
  hasSessions: boolean;
  onNavigate: (path: string) => void;
}

export function DashboardGettingStarted({
  hasWorlds,
  hasCharacters,
  hasSessions,
  onNavigate,
}: DashboardGettingStartedProps) {
  const steps = [
    {
      id: 'world',
      label: 'Create a world',
      completed: hasWorlds,
      cta: 'Create Your World',
      path: '/worlds',
    },
    {
      id: 'character',
      label: 'Create a character',
      completed: hasCharacters,
      cta: 'Create a Character',
      path: '/characters',
    },
    {
      id: 'play',
      label: 'Start playing',
      completed: hasSessions,
      cta: 'Start Playing',
      path: '/worlds',
    },
  ];

  const nextStep = steps.find((step) => !step.completed);

  return (
    <section
      className="component-dashboard-getting-started"
      aria-labelledby="getting-started-heading"
    >
      <h2 id="getting-started-heading">Getting Started</h2>

      <ol className="dashboard-getting-started-steps">
        {steps.map((step) => {
          const Icon = step.completed ? CheckCircle : Circle;
          return (
            <li
              key={step.id}
              className={
                'dashboard-getting-started-step' +
                (step.completed ? ' dashboard-getting-started-step-complete' : '')
              }
            >
              <Icon aria-hidden="true" className="dashboard-getting-started-step-icon" />
              <span className="dashboard-getting-started-step-label">{step.label}</span>
            </li>
          );
        })}
      </ol>

      {nextStep && (
        <Button
          onClick={() => onNavigate(nextStep.path)}
          variant="default"
          size="lg"
          className="dashboard-getting-started-cta"
        >
          {nextStep.cta}
        </Button>
      )}
    </section>
  );
}
