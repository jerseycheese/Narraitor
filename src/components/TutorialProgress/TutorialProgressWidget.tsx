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

const PHASES: TutorialPhase[] = ['worldCreation', 'characterCreation', 'firstPlay'];

export function TutorialProgressWidget() {
  const { tutorialProgress } = useSessionStore();
  const [isExpanded, setIsExpanded] = React.useState(false);

  // Don't show if all relevant phases are completed
  const allCompleted = PHASES.every(p => tutorialProgress.phases[p].completed);
  if (allCompleted) return null;

  const completedCount = PHASES.filter(p => tutorialProgress.phases[p].completed).length;
  const progressValue = (completedCount / PHASES.length) * 100;

  return (
    <div 
      className={cn(
        "fixed bottom-6 left-6 z-50 transition-all duration-300 ease-in-out",
        "bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden",
        isExpanded ? "w-64" : "w-12 h-12 flex items-center justify-center cursor-pointer"
      )}
      onClick={() => !isExpanded && setIsExpanded(true)}
    >
      {!isExpanded ? (
        <div className="relative">
          <svg className="w-10 h-10 transform -rotate-90">
            <circle
              cx="20"
              cy="20"
              r="16"
              stroke="currentColor"
              strokeWidth="4"
              fill="transparent"
              className="text-gray-200"
            />
            <circle
              cx="20"
              cy="20"
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
            {completedCount}/{PHASES.length}
          </span>
        </div>
      ) : (
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-sm">Tutorial Progress</h3>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(false);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
          
          <div className="space-y-3">
            {PHASES.map((phase) => {
              const isCompleted = tutorialProgress.phases[phase].completed;
              return (
                <div key={phase} className="flex items-center gap-3">
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <Circle className="w-4 h-4 text-gray-300" />
                  )}
                  <span className={cn(
                    "text-xs",
                    isCompleted ? "text-gray-400 line-through" : "text-gray-700"
                  )}>
                    {PHASE_LABELS[phase]}
                  </span>
                </div>
              );
            })}
          </div>
          
          <div className="mt-4">
            <div className="flex justify-between text-[10px] text-gray-500 mb-1">
              <span>Overall Progress</span>
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