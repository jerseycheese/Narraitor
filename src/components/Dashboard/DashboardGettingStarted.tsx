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
      <section className="bg-background rounded-lg border p-6 shadow-sm">
        <div className="text-center space-y-4">
          <CheckCircle className="w-12 h-12 text-success mx-auto" aria-hidden="true" />
          <div>
            <h3 className="text-lg font-semibold mb-2">Ready to Continue</h3>
            <p className="text-sm text-muted-foreground mb-4">
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
    <section className="bg-background rounded-lg border p-6 shadow-sm">
      <h2 className="text-lg font-semibold mb-4">Getting Started</h2>

      <div className="space-y-3 mb-6">
        {steps.map((step) => {
          const Icon = step.completed ? CheckCircle : Circle;
          return (
            <div key={step.id} className="flex items-center gap-3">
              <Icon
                className={`w-5 h-5 flex-shrink-0 ${
                  step.completed ? 'text-success' : 'text-muted-foreground'
                }`}
                aria-hidden="true"
              />
              <span
                className={`text-sm ${
                  step.completed ? 'text-muted-foreground line-through' : 'text-foreground'
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
          className="w-full"
        >
          {nextStep.cta}
        </Button>
      )}
    </section>
  );
}
