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
  <div>
    <div>
      <div>Usage Summary</div>
      <Button variant="outline" size="sm" onClick={onClearUsage}>
        Clear Usage
      </Button>
    </div>

    <div>
      <div>Total Facts: {usageSummary.totalFacts}</div>
      <div>Used in Prompts: {usageSummary.usedFacts}</div>
      <div>Total Mentions: {usageSummary.totalMentions}</div>
      <div>
        Last Used: {usageSummary.lastUsedAt ? new Date(usageSummary.lastUsedAt).toLocaleString() : 'Never'}
      </div>
    </div>

    <div>
      <div>Facts by Usage</div>
      {usageRows.length === 0 ? (
        <div>No lore facts found for this filter.</div>
      ) : (
        <div>
          {usageRows.map(({ fact, stats }) => (
            <div key={fact.id} >
              <div className={`${categoryColors[fact.category]}`}>
                {fact.category}: {fact.key}
              </div>
              <div>{fact.value}</div>
              <div>
                Used: {stats.usageCount} · Mentions: {stats.mentionCount}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>

    <div>
      <div>Recent Usage Events</div>
      {usageEvents.length === 0 ? (
        <div>No usage events recorded yet.</div>
      ) : (
        <div>
          {usageEvents.map((event) => (
            <div key={event.id} >
              <div>
                {event.eventType === 'context' ? 'Context Used' : 'Mentioned'} · {event.source}
              </div>
              <div>
                {new Date(event.timestamp).toLocaleString()} · {event.factIds.length} fact(s)
              </div>
              {event.responseExcerpt && (
                <div>
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
