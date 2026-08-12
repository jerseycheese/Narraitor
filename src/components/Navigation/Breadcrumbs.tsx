'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Globe, User, Users } from 'lucide-react';
import { useWorldStore } from '@/state/worldStore';
import { useCharacterStore, type Character } from '@/state/characterStore';
import { useSessionStore } from '@/state/sessionStore';
import {
  buildBreadcrumbSegments,
  type BreadcrumbSegment,
} from '@/utils/routeUtils';
import { useNavigationFlow } from '@/hooks/useNavigationFlow';
import { Button } from '@/components/ui/button';

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
  showNextStep = false,
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
    <nav aria-label="Breadcrumb" className={`breadcrumbs-nav ${className || ''}`}>
      {showEllipsis && (
        <>
          <span className="breadcrumbs-item" data-testid="breadcrumb-ellipsis">...</span>
          <span className="breadcrumbs-separator">{separator}</span>
        </>
      )}

      {displaySegments.map((segment, index) => {
        const isLast = index === displaySegments.length - 1;
        const testId = getTestId(segment);

        // Handle loading state
        if (segment.label === 'Loading...') {
          return (
            <React.Fragment key={segment.href}>
              <span className="breadcrumbs-item" data-testid={testId}>
                {getSegmentIcon(segment)}
                <span className="breadcrumbs-label">{segment.label}</span>
              </span>
              {!isLast && <span className="breadcrumbs-separator">{separator}</span>}
            </React.Fragment>
          );
        }

        return (
          <React.Fragment key={segment.href}>
            <Link
              href={segment.href}
              onClick={(e) => handleClick(e, segment)}
              className="breadcrumbs-item"
              data-testid={testId}
              aria-current={segment.isCurrentPage ? 'page' : undefined}
            >
              {getSegmentIcon(segment)}
              <span className="breadcrumbs-label">{segment.label}</span>
            </Link>
            {!isLast && <span className="breadcrumbs-separator">{separator}</span>}
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
        <div>
          <span>{separator}</span>
          <span>Next: Start Playing</span>
          <Button
            onClick={() => {
              if (currentWorldId && nextStep.characterId) {
                initializeSession(currentWorldId, nextStep.characterId, () => {
                  router.push('/play');
                });
              }
            }}
            variant="success"
            size="sm"
          >
            Play as {character?.name}
          </Button>
        </div>
      );
    }

    if (
      nextStep.action === 'select-character' &&
      (Object.values(characters) as Character[]).filter(
        (c) => c.worldId === currentWorldId
      ).length > 0
    ) {
      return (
        <div>
          <span>{separator}</span>
          <span>Next: Start Playing</span>
          <Button
            onClick={() => {
              const firstCharacter = (
                Object.values(characters) as Character[]
              ).find((c) => c.worldId === currentWorldId);
              if (currentWorldId && firstCharacter) {
                initializeSession(currentWorldId, firstCharacter.id, () => {
                  router.push('/play');
                });
              }
            }}
            variant="default"
            size="sm"
          >
            Quick Start
          </Button>
        </div>
      );
    }

    return (
      <div>
        <span>{separator}</span>
        <span>Next: {nextStep.label}</span>
        <Link href={nextStep.href}>
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
    if (segment.href.includes('/worlds/')) {
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
  if (segment.href.startsWith('/worlds/')) {
    return 'breadcrumb-world';
  }
  if (segment.href === '/characters') {
    return 'breadcrumb-characters';
  }
  if (
    segment.href.startsWith('/characters/') &&
    segment.href !== '/characters/create'
  ) {
    return 'breadcrumb-character';
  }

  return 'breadcrumb-item';
}

/**
 * Get appropriate icon component based on segment type
 * @param segment - The breadcrumb segment to get an icon for
 * @returns React node containing the appropriate icon or null if no icon should be shown
 */
function getSegmentIcon(segment: BreadcrumbSegment): React.ReactNode {
  // Home/Root segments
  if (segment.label === 'Worlds') {
    return <Home data-testid="icon-home" aria-hidden="true" />;
  }

  // World segments
  if (segment.href.startsWith('/worlds/')) {
    return <Globe data-testid="icon-globe" aria-hidden="true" />;
  }

  // Characters list page (multiple people)
  if (segment.href === '/characters') {
    return <Users data-testid="icon-users" aria-hidden="true" />;
  }

  // Individual character page (single person)
  if (
    segment.href.startsWith('/characters/') &&
    segment.href !== '/characters/create'
  ) {
    return <User data-testid="icon-user" aria-hidden="true" />;
  }

  // No icon for other segments
  return null;
}
