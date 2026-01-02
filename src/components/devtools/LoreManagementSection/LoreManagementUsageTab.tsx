import React from 'react';
import { Button } from '@/components/ui/button';
import type { LoreFact, LoreCategory, LoreUsageEvent, LoreUsageStats } from '@/types/lore.types';

interface LoreManagementUsageTabProps {
  usageSummary: {
    totalFacts: number;
    usedFacts: number;
    totalMentions: number;
    lastUsedAt?: string;
  };
  usageRows: Array<{ fact: LoreFact; stats: LoreUsageStats }>;
  usageEvents: LoreUsageEvent[];
  categoryColors: Record<LoreCategory, string>;
  onClearUsage: () => void;
}

export const LoreManagementUsageTab: React.FC<LoreManagementUsageTabProps> = ({
  usageSummary,
  usageRows,
  usageEvents,
  categoryColors,
  onClearUsage,
}) => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <div className="text-sm font-semibold text-gray-900">Usage Summary</div>
      <Button variant="outline" size="sm" onClick={onClearUsage}>
        Clear Usage
      </Button>
    </div>

    <div className="grid grid-cols-2 gap-2 text-xs text-gray-700">
      <div>Total Facts: {usageSummary.totalFacts}</div>
      <div>Used in Prompts: {usageSummary.usedFacts}</div>
      <div>Total Mentions: {usageSummary.totalMentions}</div>
      <div>
        Last Used: {usageSummary.lastUsedAt ? new Date(usageSummary.lastUsedAt).toLocaleString() : 'Never'}
      </div>
    </div>

    <div className="space-y-2">
      <div className="text-sm font-semibold text-gray-900">Facts by Usage</div>
      {usageRows.length === 0 ? (
        <div className="text-xs text-gray-500">No lore facts found for this filter.</div>
      ) : (
        <div className="max-h-64 overflow-y-auto space-y-2">
          {usageRows.map(({ fact, stats }) => (
            <div key={fact.id} className="rounded border border-gray-200 bg-white p-2 text-xs">
              <div className={`font-medium ${categoryColors[fact.category]}`}>
                {fact.category}: {fact.key}
              </div>
              <div className="text-gray-700">{fact.value}</div>
              <div className="text-gray-500 mt-1">
                Used: {stats.usageCount} · Mentions: {stats.mentionCount}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>

    <div className="space-y-2">
      <div className="text-sm font-semibold text-gray-900">Recent Usage Events</div>
      {usageEvents.length === 0 ? (
        <div className="text-xs text-gray-500">No usage events recorded yet.</div>
      ) : (
        <div className="max-h-56 overflow-y-auto space-y-2">
          {usageEvents.map((event) => (
            <div key={event.id} className="rounded border border-gray-200 bg-white p-2 text-xs">
              <div className="font-medium text-gray-900">
                {event.eventType === 'context' ? 'Context Used' : 'Mentioned'} · {event.source}
              </div>
              <div className="text-gray-600">
                {new Date(event.timestamp).toLocaleString()} · {event.factIds.length} fact(s)
              </div>
              {event.responseExcerpt && (
                <div className="text-gray-700 italic mt-1">
                  &ldquo;{event.responseExcerpt}&rdquo;
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);
