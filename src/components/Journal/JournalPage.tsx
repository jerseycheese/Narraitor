'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { BookOpen } from 'lucide-react';
import { BackNavigation } from '@/components/shared/BackNavigation';
import { PageLayout } from '@/components/shared/PageLayout';
import { Hero } from '@/components/shared/Hero';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useJournalStore } from '@/state/journalStore';
import { useWorldStore } from '@/state/worldStore';
import { useSessionStore } from '@/state/sessionStore';
import { EntityID } from '@/types/common.types';
import { JournalEntry } from '@/types/journal.types';
import { useShallow } from 'zustand/react/shallow';
import { clsx } from 'clsx';
import { getGenreLabel } from '@/lib/constants/genres';
import { readString, writeString } from '@/lib/utils/browserStorage';
import { selectSessionEntries } from '@/lib/journal/journalSelectors';
import { JournalEntryDetail } from './JournalEntryDetail';
import { JournalEntryList } from './JournalEntryList';
import { JournalViewToggle, type JournalViewMode } from './JournalViewToggle';

// JournalTable pulls @tanstack/react-table but only renders in table view; the
// page defaults to the list/detail layout, so load it on demand.
const JournalTable = dynamic(
  () => import('./JournalTable').then((m) => ({ default: m.JournalTable })),
  { ssr: false }
);

interface JournalPageProps {
  worldId: string;
}

export const JournalPage: React.FC<JournalPageProps> = ({ worldId }) => {
  const PAGE_SIZE = 10;
  const sessionId = useSessionStore((state) => state.id);
  const characterId = useSessionStore((state) => state.characterId);
  const world = useWorldStore((state) => state.worlds[worldId]);
  const {
    markAsRead,
    error: journalError,
    loading: journalLoading,
  } = useJournalStore();

  const [selectedEntryId, setSelectedEntryId] = React.useState<EntityID | null>(
    null
  );
  const [viewMode, setViewMode] = React.useState<'list' | 'detail'>('list');
  const [visibleCount, setVisibleCount] = React.useState(PAGE_SIZE);
  const [searchQuery, setSearchQuery] = React.useState('');
  const detailRef = React.useRef<HTMLDivElement | null>(null);

  // Display mode (list/detail cards vs. sortable table), persisted like the
  // character list screen (useEffect restore, not a lazy useState initializer
  // — that would read localStorage during the server render too and hydrate
  // mismatched against the client's first pass).
  const [displayMode, setDisplayMode] = React.useState<JournalViewMode>('list');

  React.useEffect(() => {
    const saved = readString('local', 'journal-view-mode');
    if (saved === 'list' || saved === 'table') {
      setDisplayMode(saved);
    }
  }, []);

  const handleDisplayModeChange = (mode: JournalViewMode) => {
    setDisplayMode(mode);
    writeString('local', 'journal-view-mode', mode);
  };

  const entries = useJournalStore(
    useShallow((state) => selectSessionEntries(state, sessionId, characterId))
  );

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredEntries = React.useMemo(() => {
    if (!normalizedQuery) {
      return entries;
    }

    return entries.filter((entry) => {
      const tagsText = entry.metadata.tags?.join(' ') ?? '';
      const relatedText =
        entry.relatedEntities
          ?.map((entity) => `${entity.type} ${entity.name}`)
          .join(' ') ?? '';
      const haystack = [
        entry.title,
        entry.content,
        entry.detailedContent,
        tagsText,
        relatedText,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [entries, normalizedQuery]);

  // Table view gets the full, unfiltered entry set (it has its own search
  // and type filter — see JournalTable), so selection has to resolve against
  // that same set. Resolving against filteredEntries here would mean a row
  // excluded by a stale list-view search query opens the wrong entry (or an
  // empty detail pane) when clicked in table view.
  const selectionPool = displayMode === 'table' ? entries : filteredEntries;
  const firstEntryId = selectionPool[0]?.id ?? null;
  const resolvedSelectedEntryId = React.useMemo(
    () =>
      selectedEntryId &&
      selectionPool.some((entry) => entry.id === selectedEntryId)
        ? selectedEntryId
        : null,
    [selectionPool, selectedEntryId]
  );

  const activeSelectedEntryId = resolvedSelectedEntryId ?? firstEntryId;
  const selectedEntry = activeSelectedEntryId
    ? selectionPool.find((entry) => entry.id === activeSelectedEntryId) ||
      null
    : null;

  React.useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [PAGE_SIZE, sessionId, normalizedQuery]);

  React.useEffect(() => {
    if (selectedEntry && detailRef.current) {
      detailRef.current.focus();
    }
  }, [selectedEntry]);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && viewMode === 'detail') {
        setViewMode('list');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode]);

  const handleEntrySelect = (entry: JournalEntry) => {
    setSelectedEntryId(entry.id);
    setViewMode('detail');
    if (!entry.isRead) {
      markAsRead(entry.id);
    }
  };

  const entrySummary = !sessionId
    ? 'No active session'
    : entries.length
      ? `${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}`
      : 'No entries yet';
  const showEntrySummary = !!sessionId;
  const pageTitle = world ? `Journal in ${world.name}` : 'Journal';
  const visibleEntries = filteredEntries.slice(0, visibleCount);
  const canLoadMore = filteredEntries.length > visibleCount;

  const renderContent = () => {
    if (!sessionId) {
      return (
        <EmptyState
          title="No active session"
          description="Start or resume a session to view its journal entries."
        />
      );
    }

    if (journalLoading) {
      return (
        <div>
          <LoadingState
            variant="skeleton"
            message="Loading journal entries..."
            skeletonLines={6}
          />
        </div>
      );
    }

    if (journalError) {
      return (
        <ErrorDisplay
          variant="section"
          severity="warning"
          title={journalError.title}
          message={journalError.message}
        />
      );
    }

    return (
      <div
        className={clsx(
          'journal-content',
          displayMode === 'table' && 'journal-content-table'
        )}
      >
        {entries.length === 0 ? (
          <div className="journal-empty-state">
            <EmptyState
              title="This journal awaits its first entry"
              description="Updates will appear here as things unfold"
            />
          </div>
        ) : (
          <>
            <div
              className={clsx(
                'journal-list-pane',
                viewMode === 'list' ? '' : 'hidden',
                displayMode === 'table' && 'journal-list-pane-table'
              )}
              data-testid="journal-list-pane"
            >
              <div className="journal-list-header">
                <h2>Entries</h2>
                <JournalViewToggle
                  mode={displayMode}
                  onModeChange={handleDisplayModeChange}
                />
              </div>
              {displayMode === 'table' ? (
                <JournalTable
                  entries={entries}
                  selectedEntryId={activeSelectedEntryId}
                  onEntrySelect={handleEntrySelect}
                />
              ) : (
                <>
                  <div className="journal-search-wrapper">
                    <Input
                      id="journal-search"
                      type="search"
                      placeholder="Search entries..."
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      aria-label="Search entries"
                    />
                  </div>
                  {filteredEntries.length === 0 ? (
                    <div>No entries match your search.</div>
                  ) : (
                    <JournalEntryList
                      entries={visibleEntries}
                      selectedEntryId={activeSelectedEntryId}
                      onEntrySelect={handleEntrySelect}
                    />
                  )}
                  {canLoadMore && (
                    <div className="journal-load-more">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          setVisibleCount((prev) =>
                            Math.min(prev + PAGE_SIZE, entries.length)
                          )
                        }
                      >
                        Load more
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>

            <div
              className={clsx(
                'journal-detail-pane',
                viewMode === 'detail' ? '' : 'hidden'
              )}
              data-testid="journal-detail-pane"
            >
              {selectedEntry ? (
                <div ref={detailRef} tabIndex={-1}>
                  <JournalEntryDetail
                    entry={selectedEntry}
                    showBackButton={viewMode === 'detail'}
                    onBack={() => setViewMode('list')}
                  />
                </div>
              ) : (
                <div className="journal-detail-empty">
                  <div>
                    <BookOpen aria-hidden="true" />
                  </div>
                  <h3>Select an Entry</h3>
                  <p>
                    Choose an entry from the list to view its complete content
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <PageLayout
      title={world ? undefined : pageTitle}
      description={world ? undefined : entrySummary}
      className="journal-page"
    >
      {world && (
        <div className="journal-hero">
          <Hero
            title={pageTitle}
            image={
              world.image?.url
                ? {
                    url: world.image.url,
                    alt: `${world.name} world`,
                  }
                : undefined
            }
            subtitle={world.genre ? getGenreLabel(world.genre) : undefined}
            titleElement="h1"
          />
        </div>
      )}

      <div className="journal-nav">
        <BackNavigation href={`/worlds/${worldId}/play`} label="Back to Play" />
        {showEntrySummary && <span>{entrySummary}</span>}
      </div>
      {renderContent()}
    </PageLayout>
  );
};
