'use client';

import React from 'react';
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
import { cn } from '@/lib/utils';
import { getGenreLabel } from '@/lib/constants/genres';
import { JournalEntryDetail } from './JournalEntryDetail';
import { JournalEntryList } from './JournalEntryList';
import { JournalEmptyState } from './JournalEmptyState';
import { Search } from 'lucide-react';

interface JournalPageProps {
  worldId: string;
}

export const JournalPage: React.FC<JournalPageProps> = ({ worldId }) => {
  const PAGE_SIZE = 20;
  const sessionId = useSessionStore((state) => state.id);
  const characterId = useSessionStore((state) => state.characterId);
  const world = useWorldStore((state) => state.worlds[worldId]);
  const {
    getSessionEntriesWithCharacter,
    markAsRead,
    error: journalError,
    loading: journalLoading,
  } = useJournalStore();

  const [selectedEntryId, setSelectedEntryId] = React.useState<EntityID | null>(null);
  const [viewMode, setViewMode] = React.useState<'list' | 'detail'>('list');
  const [visibleCount, setVisibleCount] = React.useState(PAGE_SIZE);
  const [searchQuery, setSearchQuery] = React.useState('');
  const detailRef = React.useRef<HTMLDivElement | null>(null);

  const entries = sessionId
    ? getSessionEntriesWithCharacter(sessionId, characterId)
    : [];

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredEntries = React.useMemo(() => {
    if (!normalizedQuery) {
      return entries;
    }

    return entries.filter((entry) => {
      const tagsText = entry.metadata.tags?.join(' ') ?? '';
      const relatedText = entry.relatedEntities
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

  const selectedEntry = selectedEntryId
    ? filteredEntries.find((entry) => entry.id === selectedEntryId) || null
    : null;

  React.useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [PAGE_SIZE, sessionId, normalizedQuery]);

  React.useEffect(() => {
    if (selectedEntryId && !selectedEntry) {
      setSelectedEntryId(null);
      setViewMode('list');
    }
  }, [selectedEntryId, selectedEntry]);

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
          variant="centered"
          className="text-amber-700"
        />
      );
    }

    if (journalLoading) {
      return (
        <div className="rounded-lg border border-warning/30 bg-background dark:bg-white p-6">
          <LoadingState
            variant="skeleton"
            size="md"
            message="Loading journal entries..."
            skeletonLines={6}
            className="w-full"
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
          className="bg-white"
        />
      );
    }

    return (
      <div className="flex-1 min-h-0 overflow-hidden rounded-lg border border-warning/30 bg-background dark:bg-white flex flex-col md:flex-row">
        {entries.length === 0 ? (
          <JournalEmptyState />
        ) : (
          <>
            <div
              className={cn(
                'w-full md:w-80 border-b md:border-b-0 md:border-r border-amber-500 min-h-0 flex-col',
                viewMode === 'list' ? 'flex' : 'hidden',
                'md:flex'
              )}
              data-testid="journal-list-pane"
            >
              <div className="p-4 border-b border-amber-500 bg-amber-50 flex items-center justify-between">
                <h2 className="font-semibold text-amber-900">Entries</h2>
              </div>
              <div className="p-4 border-b border-amber-500 bg-amber-50">
                <label htmlFor="journal-search" className="sr-only">
                  Search journal entries
                </label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-amber-600" aria-hidden="true" />
                  <Input
                    id="journal-search"
                    type="search"
                    placeholder="Search entries"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              {filteredEntries.length === 0 ? (
                <div className="flex-1 p-4 text-sm text-amber-700">
                  No entries match your search.
                </div>
              ) : (
                <JournalEntryList
                  entries={visibleEntries}
                  selectedEntryId={selectedEntryId}
                  onEntrySelect={handleEntrySelect}
                />
              )}
              {canLoadMore && (
                <div className="p-4 border-t border-amber-500 bg-amber-50">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="w-full"
                    onClick={() => setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, entries.length))}
                  >
                    Load more
                  </Button>
                </div>
              )}
            </div>

            <div
              className={cn(
                'flex-1 min-h-0 bg-white md:w-[28rem] xl:w-[32rem] flex-col',
                viewMode === 'detail' ? 'flex' : 'hidden',
                'md:flex'
              )}
              data-testid="journal-detail-pane"
            >
              {selectedEntry ? (
                <div className="p-4 md:p-6 h-full" ref={detailRef} tabIndex={-1}>
                  <JournalEntryDetail
                    entry={selectedEntry}
                    showBackButton={viewMode === 'detail'}
                    onBack={() => setViewMode('list')}
                  />
                </div>
              ) : (
                <div className="p-6 h-full flex items-center justify-center">
                  <div className="text-center text-amber-500">
                    <div className="flex justify-center mb-4">
                      <BookOpen className="w-10 h-10 text-amber-300" aria-hidden="true" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">Select an Entry</h3>
                    <p className="text-sm">
                      Choose an entry from the list to view its complete content
                    </p>
                  </div>
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
      className="pb-0 journal-page"
    >
      {world && (
        <div className="mb-6">
          <Hero
            title={pageTitle}
            image={world.image?.url ? {
              url: world.image.url,
              alt: `${world.name} world`
            } : undefined}
            theme={(world.genre as 'fantasy' | 'sci-fi' | 'modern' | 'historical' | 'horror' | 'mystery' | 'western' | 'cyberpunk' | 'other') || 'default'}
            subtitle={world.genre ? getGenreLabel(world.genre) : undefined}
            height="h-20 sm:h-24"
            titleElement="h1"
          />
        </div>
      )}

      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <BackNavigation href={`/worlds/${worldId}/play`} label="Back to Play" />
        {showEntrySummary && (
          <span className="text-sm text-amber-700">{entrySummary}</span>
        )}
      </div>
      {renderContent()}
    </PageLayout>
  );
};
