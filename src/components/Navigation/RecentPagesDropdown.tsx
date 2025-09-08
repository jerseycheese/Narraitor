'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useNavigationStore } from '@/state/navigationStore';
import { useNavigationLoadingContext } from '@/components/shared/NavigationLoadingProvider';
import { Button } from '@/components/ui/button';
import { formatRelativeTime, capitalize } from '@/lib/utils';

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
export function RecentPagesDropdown({ className = '' }: RecentPagesDropdownProps) {
  const [showRecentPages, setShowRecentPages] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { navigateWithLoading } = useNavigationLoadingContext();
  
  const { 
    currentPath, 
    history, 
    preferences,
    removeFromHistory 
  } = useNavigationStore();

  // Mark mounted to avoid SSR/client markup differences on first paint
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowRecentPages(false);
      }
    };
    
    if (showRecentPages) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
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
    .filter(entry => entry.path !== currentPath)
    .slice(0, preferences.maxRecentPages);

  // Don't show if no recent pages
  if (recentPages.length === 0) {
    return null;
  }

  const handleNavigateToPage = (path: string, title?: string) => {
    setShowRecentPages(false);
    navigateWithLoading(path, title ? `Loading ${title}...` : 'Loading...');
  };

  const handleRemoveFromHistory = (path: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    removeFromHistory(path);
  };

  /**
   * Format page title for display
   */
  const formatPageTitle = (entry: typeof recentPages[0]): string => {
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
      .map(segment => capitalize(segment.replace(/-/g, ' ')))
      .join(' › ');
  };

  /**
   * Format timestamp for display using our centralized formatter
   */
  const formatTimestamp = (timestamp: string): string => {
    return formatRelativeTime(timestamp);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <Button
        onClick={() => setShowRecentPages(!showRecentPages)}
        className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-900 hover:bg-gray-700 rounded-md transition-colors text-gray-300 hover:text-white"
        aria-label="Recent pages"
        variant="ghost"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="hidden sm:inline">Recent</span>
        <span className="text-xs bg-gray-700 px-2 py-0.5 rounded-full">
          {recentPages.length}
        </span>
      </Button>
      
      {showRecentPages && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg z-50 py-1 max-h-96 overflow-y-auto border">
          <div className="px-4 py-2 border-b border-gray-200 bg-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900">Recent Pages</h3>
              <span className="text-xs text-gray-500">{recentPages.length} pages</span>
            </div>
          </div>
          
          {recentPages.map((entry, index) => (
            <div
              key={`${entry.path}-${entry.timestamp}`}
              className="group relative"
            >
              <div className="flex items-center">
                <Button
                  onClick={() => handleNavigateToPage(entry.path, entry.title)}
                  className="flex-1 text-left px-4 py-3 hover:bg-gray-100 transition-colors"
                  aria-label={`Navigate to ${formatPageTitle(entry)}`}
                  variant="ghost"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                      {formatPageTitle(entry)}
                    </div>
                    <div className="text-sm text-gray-500 truncate">
                      {formatPathDisplay(entry.path)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {formatTimestamp(entry.timestamp)}
                    </div>
                  </div>
                </Button>
                
                {/* Remove button - now a sibling, not nested */}
                <Button
                  onClick={(e) => handleRemoveFromHistory(entry.path, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-all mr-4"
                  aria-label={`Remove ${formatPageTitle(entry)} from history`}
                  variant="ghost"
                  size="icon"
                >
                  <svg className="w-4 h-4 text-gray-500 hover:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              </div>
              
              {index < recentPages.length - 1 && (
                <div className="border-b border-gray-100 mx-4" />
              )}
            </div>
          ))}
          
          {recentPages.length > 0 && (
            <div className="border-t border-gray-200 mt-1 pt-1">
              <Link
                href="/recent"
                className="w-full text-left px-4 py-3 hover:bg-gray-100 transition-colors flex items-center gap-2 text-link-nav text-sm"
                onClick={() => setShowRecentPages(false)}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                View all recent pages
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
