'use client';

import { useState, useRef, useEffect } from 'react';
import { useNavigationStore } from '@/state/navigationStore';
import { useNavigationLoadingContext } from '@/components/shared/NavigationLoadingProvider';
import { Button } from '@/components/ui/button';
import { Clock, X } from 'lucide-react';
import { formatRelativeTime, capitalize } from '@/lib/utils';
import {
  headerDropdownHeaderClass,
  headerDropdownItemClass,
  headerDropdownMenuClass,
  headerDropdownTriggerClass,
} from './navigationDropdownStyles';

interface RecentPagesDropdownProps {
  className?: string;
}

/**
 * RecentPagesDropdown - Displays recently visited pages in a dropdown
 *
 * Features:
 * - Shows recent navigation history from navigation store
 * - Provides quick access to recently visited pages
 * - Responsive design with mobile-friendly layout
 * - Integrates with navigation loading states
 * - Automatically filters out current page
 *
 * @param className - Optional CSS classes for styling
 * @returns Dropdown component with recent pages
 */
export function RecentPagesDropdown({
  className = '',
}: RecentPagesDropdownProps) {
  const [showRecentPages, setShowRecentPages] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { navigateWithLoading } = useNavigationLoadingContext();

  const { currentPath, history, preferences, removeFromHistory } =
    useNavigationStore();

  // Mark mounted to avoid SSR/client markup differences on first paint
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowRecentPages(false);
      }
    };

    if (showRecentPages) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showRecentPages]);

  // During SSR/first client render, avoid rendering to keep markup stable
  if (!mounted) {
    return null;
  }

  // Don't show if recent pages are disabled in preferences
  if (!preferences.showRecentPages) {
    return null;
  }

  // Filter out current page and get recent pages
  const recentPages = history
    .filter((entry) => entry.path !== currentPath)
    .slice(0, preferences.maxRecentPages);

  // Don't show if no recent pages
  if (recentPages.length === 0) {
    return null;
  }

  const handleNavigateToPage = (path: string, title?: string) => {
    setShowRecentPages(false);
    navigateWithLoading(path, title ? `Loading${title}...` : 'Loading...');
  };

  const handleRemoveFromHistory = (path: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    removeFromHistory(path);
  };

  /**
   * Format page title for display
   */
  const formatPageTitle = (entry: (typeof recentPages)[0]): string => {
    if (entry.title && entry.title !== 'Narraitor') {
      return entry.title.replace(' - Narraitor', '');
    }

    // Fallback to generating title from path
    const segments = entry.path.split('/').filter(Boolean);
    if (segments.length === 0) return 'Home';

    const lastSegment = segments[segments.length - 1];
    return capitalize(lastSegment.replace(/-/g, ' '));
  };

  /**
   * Format path for display (breadcrumb-style)
   */
  const formatPathDisplay = (path: string): string => {
    const segments = path.split('/').filter(Boolean);
    if (segments.length === 0) return '/';

    return segments
      .map((segment) => capitalize(segment.replace(/-/g, ' ')))
      .join(' › ');
  };

  /**
   * Format timestamp for display using our centralized formatter
   */
  const formatTimestamp = (timestamp: string): string => {
    return formatRelativeTime(timestamp);
  };

  return (
    <div className={`${className}`} ref={dropdownRef}>
      <Button
        onClick={() => setShowRecentPages(!showRecentPages)}
        className={headerDropdownTriggerClass}
        aria-label="Recent pages"
        variant="ghost"
      >
        <Clock aria-hidden="true" />
        <span>Recent</span>
        <span>{recentPages.length}</span>
      </Button>

      {showRecentPages && (
        <div className={`${headerDropdownMenuClass}`}>
          <div className={headerDropdownHeaderClass}>
            <div>
              <h3>Recent Pages</h3>
              <span>{recentPages.length} pages</span>
            </div>
          </div>

          {recentPages.map((entry, index) => (
            <div key={`${entry.path}-${entry.timestamp}`}>
              <div>
                <Button
                  onClick={() => handleNavigateToPage(entry.path, entry.title)}
                  className={`${headerDropdownItemClass}`}
                  aria-label={`Navigate to ${formatPageTitle(entry)}`}
                  variant="ghost"
                >
                  <div>
                    <div>{formatPageTitle(entry)}</div>
                    <div>{formatPathDisplay(entry.path)}</div>
                    <div>{formatTimestamp(entry.timestamp)}</div>
                  </div>
                </Button>

                {/* Remove button - now a sibling, not nested */}
                <Button
                  onClick={(e) => handleRemoveFromHistory(entry.path, e)}
                  aria-label={`Remove ${formatPageTitle(entry)} from history`}
                  variant="ghost"
                  size="icon"
                >
                  <X aria-hidden="true" />
                </Button>
              </div>

              {index < recentPages.length - 1 && <div />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
