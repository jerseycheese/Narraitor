'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { worldStore } from '@/state/worldStore';
import { characterStore } from '@/state/characterStore';
import { buildBreadcrumbSegments, type BreadcrumbSegment } from '@/utils/routeUtils';
import { cn } from '@/lib/utils/classNames';

export interface BreadcrumbsProps {
  className?: string;
  separator?: React.ReactNode;
  maxItems?: number;
}

export function Breadcrumbs({ 
  className,
  separator = '→',
  maxItems
}: BreadcrumbsProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { worlds, currentWorldId } = worldStore();
  const { characters } = characterStore();
  
  // Build breadcrumb segments
  const segments = buildBreadcrumbSegments(
    pathname,
    worlds,
    characters,
    currentWorldId
  );
  
  // Handle truncation for mobile
  let displaySegments = segments;
  let showEllipsis = false;
  
  if (maxItems && segments.length > maxItems) {
    showEllipsis = true;
    // Keep the last maxItems segments
    displaySegments = segments.slice(-maxItems);
  }
  
  const handleClick = (e: React.MouseEvent, segment: BreadcrumbSegment) => {
    if (segment.isCurrentPage) {
      e.preventDefault();
      return;
    }
    e.preventDefault();
    router.push(segment.href);
  };
  
  return (
    <nav 
      aria-label="Breadcrumb"
      className={cn('flex items-center space-x-2 text-sm', className)}
    >
      {showEllipsis && (
        <>
          <span 
            data-testid="breadcrumb-ellipsis"
            className="text-gray-400"
          >
            ...
          </span>
          <span className="text-gray-400">{separator}</span>
        </>
      )}
      
      {displaySegments.map((segment, index) => {
        const isLast = index === displaySegments.length - 1;
        const testId = getTestId(segment);
        
        // Handle loading state
        if (segment.label === 'Loading...') {
          return (
            <React.Fragment key={segment.href}>
              <span
                data-testid={testId}
                className="text-gray-400"
              >
                {segment.label}
              </span>
              {!isLast && (
                <span className="text-gray-400">{separator}</span>
              )}
            </React.Fragment>
          );
        }
        
        return (
          <React.Fragment key={segment.href}>
            <Link
              href={segment.href}
              onClick={(e) => handleClick(e, segment)}
              data-testid={testId}
              aria-current={segment.isCurrentPage ? 'page' : undefined}
              className={cn(
                'hover:text-gray-700 transition-colors',
                segment.isCurrentPage 
                  ? 'text-gray-900 font-medium cursor-default' 
                  : 'text-gray-600'
              )}
            >
              {segment.label}
            </Link>
            {!isLast && (
              <span className="text-gray-400">{separator}</span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

/**
 * Get appropriate test ID based on segment type
 */
function getTestId(segment: BreadcrumbSegment): string {
  // Check for loading states
  if (segment.label === 'Loading...') {
    if (segment.href.includes('/world/')) {
      return 'breadcrumb-world-loading';
    }
    if (segment.href.includes('/characters/')) {
      return 'breadcrumb-character-loading';
    }
  }
  
  // Regular test IDs
  if (segment.label === 'Worlds') {
    return 'breadcrumb-home';
  }
  if (segment.href.startsWith('/world/')) {
    return 'breadcrumb-world';
  }
  if (segment.href === '/characters') {
    return 'breadcrumb-characters';
  }
  if (segment.href.startsWith('/characters/') && segment.href !== '/characters/create') {
    return 'breadcrumb-character';
  }
  
  return 'breadcrumb-item';
}