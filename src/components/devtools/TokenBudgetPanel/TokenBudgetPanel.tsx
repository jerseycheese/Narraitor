'use client';

import React, { useState, useCallback } from 'react';
import { DevToolsSection } from '../shared/DevToolsSection';
import { Button } from '@/components/ui/button';
import {
  TokenBudgetManager,
  RequestBudget,
  DEFAULT_ALLOCATIONS,
  DEFAULT_TOTAL_BUDGET,
  ComponentPriority,
  BudgetSummary,
  ComponentStatus,
} from '@/lib/promptContext/tokenBudgetManager';

interface TokenBudgetPanelProps {
  className?: string;
}

const priorityLabels: Record<ComponentPriority, string> = {
  [ComponentPriority.CRITICAL]: 'CRITICAL',
  [ComponentPriority.HIGH]: 'HIGH',
  [ComponentPriority.MEDIUM]: 'MEDIUM',
  [ComponentPriority.LOW]: 'LOW',
};

const priorityColors: Record<ComponentPriority, string> = {
  [ComponentPriority.CRITICAL]: 'bg-red-100 text-red-800 border-red-200',
  [ComponentPriority.HIGH]: 'bg-orange-100 text-orange-800 border-orange-200',
  [ComponentPriority.MEDIUM]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  [ComponentPriority.LOW]: 'bg-gray-100 text-gray-600 border-gray-200',
};

function formatTokens(tokens: number): string {
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}k`;
  }
  return String(tokens);
}

function getUsageBarColor(used: number, allocated: number): string {
  if (allocated === 0) return 'bg-gray-300';
  const ratio = used / allocated;
  if (ratio > 1) return 'bg-red-500';
  if (ratio > 0.9) return 'bg-orange-500';
  if (ratio > 0.7) return 'bg-yellow-500';
  return 'bg-green-500';
}

export function TokenBudgetPanel({ className }: TokenBudgetPanelProps) {
  const [budget, setBudget] = useState<RequestBudget | null>(null);
  const [summary, setSummary] = useState<BudgetSummary | null>(null);
  const [componentStatuses, setComponentStatuses] = useState<ComponentStatus[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);

  const initializeBudget = useCallback(() => {
    const manager = new TokenBudgetManager();
    const newBudget = manager.createBudget(DEFAULT_ALLOCATIONS, DEFAULT_TOTAL_BUDGET);
    setBudget(newBudget);
    updateStatuses(newBudget);
  }, []);

  const updateStatuses = (currentBudget: RequestBudget) => {
    const statuses = DEFAULT_ALLOCATIONS.map((alloc) =>
      currentBudget.getComponentStatus(alloc.componentId)
    );
    setComponentStatuses(statuses);
    setSummary(currentBudget.getSummary());
  };

  const simulateUsage = useCallback(() => {
    if (!budget) return;

    setIsSimulating(true);

    // Simulate realistic usage patterns
    const simulatedUsage: Record<string, number> = {
      'base-template': 280,
      'character-context': 180,
      'recent-narrative': 1100,
      'goals': 250,
      'tone-settings': 350,
      'lore-context': 650,
      'inventory': 160,
      'personalization': 720,
      'item-instructions': 180,
      'examples': 150,
    };

    for (const [componentId, usage] of Object.entries(simulatedUsage)) {
      budget.recordUsage(componentId, usage);
    }

    updateStatuses(budget);
    setIsSimulating(false);
  }, [budget]);

  const simulateOverBudget = useCallback(() => {
    if (!budget) return;

    setIsSimulating(true);

    // Simulate over-budget scenario
    const overBudgetUsage: Record<string, number> = {
      'base-template': 450,
      'character-context': 350,
      'recent-narrative': 1800,
      'goals': 500,
      'tone-settings': 550,
      'lore-context': 1200,
      'inventory': 250,
      'personalization': 1200,
      'item-instructions': 350,
      'examples': 380,
    };

    for (const [componentId, usage] of Object.entries(overBudgetUsage)) {
      budget.recordUsage(componentId, usage);
    }

    updateStatuses(budget);
    setIsSimulating(false);
  }, [budget]);

  const resetBudget = useCallback(() => {
    initializeBudget();
  }, [initializeBudget]);

  return (
    <div className={`token-budget-panel space-y-4 ${className || ''}`}>
      <DevToolsSection title="Token Budget Manager">
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={initializeBudget}
              variant="outline"
              size="sm"
              disabled={isSimulating}
            >
              Initialize Budget
            </Button>
            <Button
              onClick={simulateUsage}
              variant="outline"
              size="sm"
              disabled={!budget || isSimulating}
            >
              Simulate Normal Usage
            </Button>
            <Button
              onClick={simulateOverBudget}
              variant="outline"
              size="sm"
              disabled={!budget || isSimulating}
            >
              Simulate Over Budget
            </Button>
            <Button
              onClick={resetBudget}
              variant="outline"
              size="sm"
              disabled={!budget || isSimulating}
            >
              Reset
            </Button>
          </div>

          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              <div className="bg-blue-50 p-2 rounded border border-blue-200">
                <div className="text-xs text-blue-600 font-medium">Total Budget</div>
                <div className="text-lg font-bold text-blue-900">
                  {formatTokens(summary.totalBudget)}
                </div>
              </div>
              <div className="bg-green-50 p-2 rounded border border-green-200">
                <div className="text-xs text-green-600 font-medium">Allocated</div>
                <div className="text-lg font-bold text-green-900">
                  {formatTokens(summary.totalAllocated)}
                </div>
              </div>
              <div className="bg-purple-50 p-2 rounded border border-purple-200">
                <div className="text-xs text-purple-600 font-medium">Used</div>
                <div className="text-lg font-bold text-purple-900">
                  {formatTokens(summary.totalUsed)}
                </div>
              </div>
              <div
                className={`p-2 rounded border ${
                  summary.componentsOverBudget > 0
                    ? 'bg-red-50 border-red-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div
                  className={`text-xs font-medium ${
                    summary.componentsOverBudget > 0 ? 'text-red-600' : 'text-gray-600'
                  }`}
                >
                  Over Budget
                </div>
                <div
                  className={`text-lg font-bold ${
                    summary.componentsOverBudget > 0 ? 'text-red-900' : 'text-gray-900'
                  }`}
                >
                  {summary.componentsOverBudget} components
                </div>
              </div>
            </div>
          )}
        </div>
      </DevToolsSection>

      {componentStatuses.length > 0 && (
        <DevToolsSection title="Component Allocations">
          <div className="space-y-2">
            {componentStatuses.map((status) => (
              <div
                key={status.componentId}
                className={`p-2 rounded border ${
                  status.overBudget ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{status.componentId}</span>
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded border ${
                        priorityColors[status.priority]
                      }`}
                    >
                      {priorityLabels[status.priority]}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatTokens(status.used)} / {formatTokens(status.allocated)}
                    {status.overBudget && (
                      <span className="text-red-600 ml-1">
                        (+{formatTokens(status.overage)})
                      </span>
                    )}
                  </div>
                </div>
                <div className="h-2 bg-gray-200 rounded overflow-hidden">
                  <div
                    className={`h-full transition-all ${getUsageBarColor(
                      status.used,
                      status.allocated
                    )}`}
                    style={{
                      width: `${Math.min(100, (status.used / status.allocated) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </DevToolsSection>
      )}

      {budget && summary && summary.componentsOverBudget > 0 && (
        <DevToolsSection title="Degradation Plan">
          <div className="space-y-2">
            {budget.getDegradationPlan().suggestions.map((suggestion) => (
              <div
                key={suggestion.componentId}
                className="p-2 bg-amber-50 rounded border border-amber-200"
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium text-sm">{suggestion.componentId}</span>
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded border ${
                      priorityColors[suggestion.priority]
                    }`}
                  >
                    {priorityLabels[suggestion.priority]}
                  </span>
                </div>
                <div className="text-xs text-amber-700 mt-1">
                  Reduce from {formatTokens(suggestion.currentUsage)} to{' '}
                  {formatTokens(suggestion.suggestedLimit)} (
                  -{formatTokens(suggestion.reduction)} tokens)
                </div>
              </div>
            ))}
            <div className="text-sm text-amber-800 font-medium mt-2">
              Total overage: {formatTokens(budget.getDegradationPlan().totalOverage)} tokens
            </div>
          </div>
        </DevToolsSection>
      )}

      {!budget && (
        <div className="text-center text-gray-500 py-8">
          Click &quot;Initialize Budget&quot; to start tracking token allocations
        </div>
      )}
    </div>
  );
}

export default TokenBudgetPanel;
