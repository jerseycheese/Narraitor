'use client';

import React from 'react';
import { clsx } from 'clsx';
import { useSessionStore } from '@/state/sessionStore';
import { useNarrativeStore } from '@/state/narrativeStore';
import { useWorldThreadStore } from '@/state/worldThreadStore';
import { isOverdue, turnsSinceWorldMoved } from '@/lib/narrative/worldClock';
import type { WorldThread } from '@/types/worldThread.types';
import './WorldClockSection.css';

const RECENT_CLOSED_LIMIT = 5;
const EMPTY_IDS: string[] = [];

const formatTurnSpan = (thread: WorldThread): string => {
  const parts = [`opened t${thread.openedAtTurn}`, `moved t${thread.lastAdvancedAtTurn}`];
  if (thread.dueByTurn !== undefined) parts.push(`due t${thread.dueByTurn}`);
  return parts.join(', ');
};

const OpenThreadRow = ({ thread, currentTurn }: { thread: WorldThread; currentTurn: number }) => {
  const overdue = isOverdue(thread, currentTurn);
  return (
    <li
      className={clsx('world-clock-section-thread', overdue && 'is-overdue')}
      data-testid="world-clock-open-thread"
      data-overdue={overdue}
    >
      <span className="world-clock-section-kind">[{thread.kind}]</span>{' '}
      <span className="world-clock-section-summary">{thread.summary}</span>{' '}
      <span className="world-clock-section-turns">({formatTurnSpan(thread)})</span>
      {overdue && <span className="world-clock-section-overdue-mark"> overdue</span>}
    </li>
  );
};

const ClosedThreadRow = ({ thread }: { thread: WorldThread }) => (
  <li className="world-clock-section-thread is-closed" data-testid="world-clock-closed-thread">
    <span className="world-clock-section-kind">[{thread.kind}]</span>{' '}
    <span className="world-clock-section-summary">{thread.summary}</span>{' '}
    <span className="world-clock-section-turns">
      ({thread.status} t{thread.lastAdvancedAtTurn}
      {thread.resolution ? `: ${thread.resolution}` : ''})
    </span>
  </li>
);

/**
 * WorldClockSection
 *
 * Dev-only read of the world clock's ledger for the current session: what the
 * story still owes the player, what has come due, and how long since anything
 * moved. Read-only; the ledger is written by the post-segment extraction, so
 * this view can lag the newest turn by one until that reconciles.
 */
export const WorldClockSection = () => {
  const sessionId = useSessionStore((state) => state.id);
  const currentTurn = useNarrativeStore(
    (state) => (sessionId ? state.sessionSegments[sessionId]?.length ?? 0 : 0)
  );
  // Subscribe to the raw slices rather than calling the selector methods so the
  // section re-renders when the ledger moves; the methods read get() and would
  // otherwise return a fresh array every render.
  const threadsById = useWorldThreadStore((state) => state.threads);
  const sessionThreadIds = useWorldThreadStore((state) =>
    sessionId ? state.sessionThreads[sessionId] ?? EMPTY_IDS : EMPTY_IDS
  );
  const hasLedger = useWorldThreadStore((state) =>
    sessionId ? state.hasSessionLedger(sessionId) : false
  );

  if (!sessionId || !hasLedger) {
    return (
      <div className="world-clock-section" data-testid="devtools-world-clock-section">
        <p className="world-clock-section-empty" data-testid="world-clock-empty">
          No ledger for this session yet.
        </p>
      </div>
    );
  }

  const sessionThreads = sessionThreadIds
    .map((id) => threadsById[id])
    .filter((thread): thread is WorldThread => Boolean(thread));
  const openThreads = sessionThreads.filter((thread) => thread.status === 'open');
  const overdueCount = openThreads.filter((thread) => isOverdue(thread, currentTurn)).length;
  const recentClosed = sessionThreads
    .filter((thread) => thread.status !== 'open')
    .slice(-RECENT_CLOSED_LIMIT)
    .reverse();
  const sinceMoved = turnsSinceWorldMoved(sessionThreads, currentTurn);

  return (
    <div className="world-clock-section" data-testid="devtools-world-clock-section">
      <p className="world-clock-section-summary-line" data-testid="world-clock-summary">
        Turn {currentTurn}: {openThreads.length} open, {overdueCount} overdue, world last
        moved {sinceMoved} turns ago
      </p>

      <h5 className="world-clock-section-subheading">Open threads</h5>
      {openThreads.length > 0 ? (
        <ul className="world-clock-section-list" data-testid="world-clock-open-list">
          {openThreads.map((thread) => (
            <OpenThreadRow key={thread.id} thread={thread} currentTurn={currentTurn} />
          ))}
        </ul>
      ) : (
        <p className="world-clock-section-empty">Nothing open.</p>
      )}

      {recentClosed.length > 0 && (
        <>
          <h5 className="world-clock-section-subheading">Recently closed</h5>
          <ul className="world-clock-section-list" data-testid="world-clock-closed-list">
            {recentClosed.map((thread) => (
              <ClosedThreadRow key={thread.id} thread={thread} />
            ))}
          </ul>
        </>
      )}
    </div>
  );
};
