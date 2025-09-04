'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { useWorldStore } from '@/state/worldStore';
import { useCharacterStore, type Character } from '@/state/characterStore';
import { LogoIcon, LogoText } from '@/components/ui/Logo';
import { Button } from '@/components/ui/button';

interface MobileNavigationMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
}

/**
 * MobileNavigationMenu - Full-screen mobile navigation overlay
 * 
 * Provides a touch-friendly navigation experience for mobile devices with:
 * - Full-screen overlay design
 * - Touch targets minimum 44px (accessibility compliant)
 * - Smooth animations and gestures
 * - Focus management and keyboard navigation
 * - World switcher and quick actions
 * 
 * @param isOpen - Whether the mobile menu is currently open
 * @param onClose - Callback to close the menu
 * @param onNavigate - Callback for navigation with loading states
 */
export const MobileNavigationMenu = React.memo(function MobileNavigationMenu({ isOpen, onClose, onNavigate }: MobileNavigationMenuProps) {
  const pathname = usePathname();
  const { currentWorldId, worlds, setCurrentWorld } = useWorldStore();
  const { characters } = useCharacterStore();
  const menuRef = useRef<HTMLDivElement>(null);
  const startX = useRef<number>(0);
  const startY = useRef<number>(0);

  const currentWorld = currentWorldId ? worlds[currentWorldId] : null;

  // Focus management - focus first element when opened
  useEffect(() => {
    if (isOpen && menuRef.current) {
      const firstButton = menuRef.current.querySelector('button') as HTMLButtonElement;
      if (firstButton) {
        firstButton.focus();
      }
    }
  }, [isOpen]);

  // Touch gesture handling for swipe to close (memoized)
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!startX.current || !startY.current) return;

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    
    const diffX = startX.current - currentX;
    const diffY = startY.current - currentY;

    // Only close on significant horizontal swipe (left to right)
    if (Math.abs(diffX) > Math.abs(diffY) && diffX > 100) {
      onClose();
    }
  }, [onClose]);

  const handleTouchEnd = useCallback(() => {
    startX.current = 0;
    startY.current = 0;
  }, []);

  const handleNavigation = useCallback((path: string) => {
    onNavigate(path);
    onClose();
  }, [onNavigate, onClose]);

  const handleWorldSwitch = useCallback((worldId: string) => {
    setCurrentWorld(worldId);
    onNavigate(`/worlds/${worldId}`);
    onClose();
  }, [setCurrentWorld, onNavigate, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 z-50 bg-gray-900 text-white transform transition-transform duration-300 ease-in-out"
      role="navigation"
      aria-label="Mobile navigation"
      ref={menuRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header with close button */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <LogoIcon size="small" className="brightness-0 invert" />
          <LogoText size="sm" className="text-white" />
        </div>
        <Button
          onClick={onClose}
          variant="ghost"
          size="icon"
          className="min-h-11 min-w-11 text-white hover:bg-gray-700"
          aria-label="Close menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </Button>
      </div>

      {/* Main navigation items */}
      <div className="flex-1 px-4 py-6 space-y-2">
        <Button
          onClick={() => handleNavigation('/worlds')}
          variant="ghost"
          className={`w-full min-h-11 flex items-center gap-3 px-4 py-3 text-left text-lg font-medium justify-start ${
            pathname === '/worlds' || pathname.startsWith('/worlds/') 
              ? 'bg-gray-700 text-white' 
              : 'text-link-nav-dark hover:bg-gray-900'
          }`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Worlds
        </Button>

        <Button
          onClick={() => handleNavigation('/characters')}
          variant="ghost"
          className={`w-full min-h-11 flex items-center gap-3 px-4 py-3 text-left text-lg font-medium justify-start ${
            pathname === '/characters' || pathname.startsWith('/characters/') 
              ? 'bg-gray-700 text-white' 
              : 'text-link-nav-dark hover:bg-gray-900'
          }`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Characters
        </Button>

        <Button
          onClick={() => handleNavigation('/settings')}
          variant="ghost"
          className={`w-full min-h-11 flex items-center gap-3 px-4 py-3 text-left text-lg font-medium justify-start ${
            pathname === '/settings' 
              ? 'bg-gray-700 text-white' 
              : 'text-link-nav-dark hover:bg-gray-900'
          }`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Settings
        </Button>

        {/* World switcher section */}
        {Object.keys(worlds).length > 0 && (
          <div className="pt-4 mt-4 border-t border-gray-700">
            <h3 className="px-4 text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
              Worlds
            </h3>
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {Object.values(worlds).map(world => {
                const worldCharacters = (Object.values(characters) as Character[]).filter(
                  char => char.worldId === world.id
                ).length;
                
                return (
                  <Button
                    key={world.id}
                    onClick={() => handleWorldSwitch(world.id)}
                    variant="ghost"
                    className={`w-full min-h-11 flex items-center justify-between px-4 py-3 text-left ${
                      world.id === currentWorldId 
                        ? 'bg-green-500 text-white hover:bg-green-700' 
                        : 'text-link-nav-dark hover:bg-gray-900'
                    }`}
                  >
                    <div>
                      <div className="font-medium">{world.name}</div>
                      <div className="text-sm opacity-75">{world.genre} • {worldCharacters} characters</div>
                    </div>
                    {world.id === currentWorldId && (
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </Button>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div className="pt-4 mt-4 border-t border-gray-700">
          {currentWorld ? (
            <Button
              onClick={() => handleNavigation(`/worlds/${currentWorld.id}/play`)}
              className="w-full min-h-11 flex items-center justify-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-700 text-white text-lg font-medium"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Play {currentWorld.name}
            </Button>
          ) : Object.keys(worlds).length === 0 ? (
            <Button
              onClick={() => handleNavigation('/worlds/create')}
              className="w-full min-h-11 flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 hover:bg-blue-700 text-white text-lg font-medium"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create Your First World
            </Button>
          ) : (
            <Button
              onClick={() => handleNavigation('/worlds/create')}
              className="w-full min-h-11 flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 hover:bg-blue-700 text-white text-lg font-medium"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create New World
            </Button>
          )}
        </div>
      </div>
    </div>
  );
});