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
  onNavigate
}: DashboardGettingStartedProps) {
  const steps = [
    {
      id: 'world',
      label: 'Create a world',
      completed: hasWorlds,
      cta: 'Create Your World',
      path: '/worlds'
    },
    {
      id: 'character',
      label: 'Create a character',
      completed: hasCharacters,
      cta: 'Create a Character',
      path: '/characters'
    },
    {
      id: 'play',
      label: 'Start playing',
      completed: hasSessions,
      cta: 'Start Playing',
      path: '/worlds'
    }
  ];

  const nextStep = steps.find((step) => !step.completed);
  const allComplete = !nextStep;

  // Hide when all steps completed
  if (allComplete) {
    return (
      <section className="component-dashboard-getting-started">
        <div >
          <CheckCircle  aria-hidden="true" />
          <div>
            <h3 >Ready to Continue</h3>
            <p >
              Your world is set up. Continue your adventure!
            </p>
            <Button onClick={() => onNavigate('/worlds')} variant="default" size="lg">
              Continue Playing
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="component-dashboard-getting-started">
      <h2 >Getting Started</h2>

      <div >
        {steps.map((step) => {
          const Icon = step.completed ? CheckCircle : Circle;
          return (
            <div key={step.id} >
              <Icon
                className={`${
                  step.completed ? '' : ''
                }`}
                aria-hidden="true"
              />
              <span
                className={`${
                  step.completed ? '' : ''
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {nextStep && (
        <Button
          onClick={() => onNavigate(nextStep.path)}
          variant="default"
          size="lg"
          
        >
          {nextStep.cta}
        </Button>
      )}
    </section>
  );
}
