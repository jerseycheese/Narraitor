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
  const allComplete = !nextStep;

  // Hide when all steps completed
  if (allComplete) {
    return (
      <section className="component-dashboard-getting-started component-dashboard-getting-started-complete">
        <div className="dashboard-getting-started-complete-row">
          <CheckCircle aria-hidden="true" className="dashboard-getting-started-complete-icon" />
          <div className="dashboard-getting-started-complete-body">
            <h3>Ready to Continue</h3>
            <p>Your world is set up. Continue your adventure!</p>
            <Button
              onClick={() => onNavigate('/worlds')}
              variant="default"
              size="lg"
            >
              Continue Playing
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="component-dashboard-getting-started">
      <h2>Getting Started</h2>

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
