'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useWorldStore } from '@/state/worldStore';
import { useCharacterStore } from '@/state/characterStore';
import { useSessionStore } from '@/state/sessionStore';
import { buildBreadcrumbSegments, type BreadcrumbSegment } from '@/utils/routeUtils';
import { cn } from '@/lib/utils/classNames';
import { useNavigationFlow } from '@/hooks/useNavigationFlow';

export interface BreadcrumbsProps {
  className?: string;
  separator?: React.ReactNode;
  maxItems?: number;
  showNextStep?: boolean;
}

export function Breadcrumbs({ 
  className,
  separator = '→',
  maxItems,
  showNextStep = false
}: BreadcrumbsProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { worlds, currentWorldId } = useWorldStore();
  const { characters } = useCharacterStore();
  const { initializeSession } = useSessionStore();
  const { getNextStep } = useNavigationFlow();
  
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
      
      {/* Next Step Guidance */}
      {showNextStep && renderNextStepGuidance()}
    </nav>
  );
  
  function renderNextStepGuidance() {
    const nextStep = getNextStep();
    if (!nextStep) return null;

    if (nextStep.action === 'start-game' && nextStep.characterId) {
      const character = characters[nextStep.characterId];
      return (
        <div className="ml-4 flex items-center">
          <span className="text-gray-400 mr-2">{separator}</span>
          <span className="text-sm text-gray-600 mr-2">Next: Start Playing</span>
          <button
            onClick={() => {
              if (currentWorldId && nextStep.characterId) {
                initializeSession(currentWorldId, nextStep.characterId, () => {
                  router.push('/play');
                });
              }
            }}
            className="text-sm px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
          >
            Play as {character?.name}
          </button>
        </div>
      );
    }

    if (nextStep.action === 'select-character' && Object.values(characters).filter(c => c.worldId === currentWorldId).length > 0) {
      return (
        <div className="ml-4 flex items-center">
          <span className="text-gray-400 mr-2">{separator}</span>
          <span className="text-sm text-gray-600 mr-2">Next: Start Playing</span>
          <button
            onClick={() => {
              const firstCharacter = Object.values(characters).find(c => c.worldId === currentWorldId);
              if (currentWorldId && firstCharacter) {
                initializeSession(currentWorldId, firstCharacter.id, () => {
                  router.push('/play');
                });
              }
            }}
            className="text-sm px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          >
            Quick Start
          </button>
        </div>
      );
    }

    return (
      <div className="ml-4 flex items-center">
        <span className="text-gray-400 mr-2">{separator}</span>
        <span className="text-sm text-gray-600 mr-2">Next: {nextStep.label}</span>
        <Link
          href={nextStep.href}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          {nextStep.action === 'create-world' && 'Create Your First World'}
          {nextStep.action === 'create-character' && 'Create Character'}
          {nextStep.action === 'select-world' && 'Browse Worlds'}
          {nextStep.action === 'select-character' && 'View Characters'}
        </Link>
      </div>
    );
  }
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
