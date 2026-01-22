'use client';

import React from 'react';
import { useSessionStore } from '@/state/sessionStore';
import { TutorialPhase } from '@/types/tutorial.types';
import { cn } from '@/lib/utils/classNames';
import { CheckCircle2, Circle } from 'lucide-react';

const PHASE_LABELS: Record<TutorialPhase, string> = {
  intro: 'Introduction',
  worldCreation: 'World Creation',
  worldGeneration: 'World Generation',
  characterCreation: 'Character Creation',
  firstPlay: 'First Session',
};

const PHASES: TutorialPhase[] = ['intro', 'worldCreation', 'worldGeneration', 'characterCreation', 'firstPlay'];

interface TutorialProgressWidgetProps {
  variant?: 'floating' | 'menu';
  className?: string;
}

export function TutorialProgressWidget({
  variant = 'floating',
  className = '',
}: TutorialProgressWidgetProps) {
  const { tutorialProgress } = useSessionStore();
  const [isExpanded, setIsExpanded] = React.useState(variant !== 'floating');

  const phaseStates = PHASES.map((phase) => {
    const data = tutorialProgress.phases[phase];
    return {
      phase,
      data,
      isFinished: data.completed || data.skipped,
    };
  });

  // Don't show if all relevant phases are completed or skipped
  const allFinished = phaseStates.every(({ isFinished }) => isFinished);
  if (allFinished) return null;

  const finishedCount = phaseStates.filter(({ isFinished }) => isFinished).length;
  const progressValue = (finishedCount / phaseStates.length) * 100;

  const ProgressRing = ({ size = 40 }: { size?: number }) => (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="w-full h-full transform -rotate-90">
        <circle
          cx="50%"
          cy="50%"
          r="16"
          stroke="currentColor"
          strokeWidth="4"
          fill="transparent"
          className="text-gray-200"
        />
        <circle
          cx="50%"
          cy="50%"
          r="16"
          stroke="currentColor"
          strokeWidth="4"
          fill="transparent"
          strokeDasharray={100}
          strokeDashoffset={100 - progressValue}
          className="text-primary"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">
        {finishedCount}/{PHASES.length}
      </span>
    </div>
  );

  if (variant === 'menu') {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="space-y-3">
          {phaseStates.map(({ phase, data, isFinished }) => {
            const isSkipped = data.skipped;
            return (
              <div key={phase} className="flex items-center gap-3">
                {isFinished ? (
                  <CheckCircle2 className={cn('w-4 h-4', isSkipped ? 'text-gray-400' : 'text-green-500')} />
                ) : (
                  <Circle className="w-4 h-4 text-gray-300" />
                )}
                <span className={cn(
                  'text-xs',
                  isFinished ? 'text-gray-400 line-through' : 'text-gray-700'
                )}>
                  {PHASE_LABELS[phase]}
                  {isSkipped && <span className="ml-1 text-[10px] no-underline">(skipped)</span>}
                </span>
              </div>
            );
          })}
        </div>

        <div>
          <div className="flex justify-between text-[10px] text-gray-500 mb-1">
            <span>Progress</span>
            <span>{Math.round(progressValue)}%</span>
          </div>
          <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300" 
              style={{ width: `${progressValue}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        'fixed bottom-6 left-6 z-50 transition-all duration-300 ease-in-out',
        'bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden',
        isExpanded ? 'w-64' : 'w-12 h-12 flex items-center justify-center cursor-pointer',
        className
      )}
      onClick={() => {
        if (!isExpanded) setIsExpanded(true);
      }}
    >
      {!isExpanded ? (
        <ProgressRing />
      ) : (
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <ProgressRing size={32} />
              <h3 className="font-bold text-sm">Tutorial Progress</h3>
            </div>
            {variant === 'floating' && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(false);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            )}
          </div>
          
          <div className="space-y-3">
            {phaseStates.map(({ phase, data, isFinished }) => {
              const isSkipped = data.skipped;
              return (
                <div key={phase} className="flex items-center gap-3">
                  {isFinished ? (
                    <CheckCircle2 className={cn('w-4 h-4', isSkipped ? 'text-gray-400' : 'text-green-500')} />
                  ) : (
                    <Circle className="w-4 h-4 text-gray-300" />
                  )}
                  <span className={cn(
                    'text-xs',
                    isFinished ? 'text-gray-400 line-through' : 'text-gray-700'
                  )}>
                    {PHASE_LABELS[phase]}
                    {isSkipped && <span className="ml-1 text-[10px] no-underline">(skipped)</span>}
                  </span>
                </div>
              );
            })}
          </div>
          
          <div className="mt-4">
            <div className="flex justify-between text-[10px] text-gray-500 mb-1">
              <span>Progress</span>
              <span>{Math.round(progressValue)}%</span>
            </div>
            <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300" 
                style={{ width: `${progressValue}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
