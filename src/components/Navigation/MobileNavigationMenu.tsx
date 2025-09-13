'use client';

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useWorldStore } from '@/state/worldStore';
import { useCharacterStore, type Character } from '@/state/characterStore';
import { LogoIcon, LogoText } from '@/components/ui/Logo';
import { Button } from '@/components/ui/button';
import { X, Globe, User, Settings, Check, Play, Plus } from 'lucide-react';

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
  const [mounted, setMounted] = useState(false);
  const startX = useRef<number>(0);
  const startY = useRef<number>(0);

  const currentWorld = currentWorldId ? worlds[currentWorldId] : null;
  const hasWorldsStore = Object.keys(worlds).length > 0;
  const hasWorlds = mounted && hasWorldsStore;

  // Focus management - focus first element when opened
  useEffect(() => {
    if (isOpen && menuRef.current) {
      const firstButton = menuRef.current.querySelector('button') as HTMLButtonElement;
      if (firstButton) {
        firstButton.focus();
      }
    }
  }, [isOpen]);

  // Mark mounted to keep SSR/client markup consistent
  useEffect(() => {
    setMounted(true);
  }, []);

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
          <X className="w-5 h-5" aria-hidden="true" />
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
          <Globe className="w-5 h-5" aria-hidden="true" />
          Worlds
        </Button>

        {/* Only show Characters nav when worlds exist */}
        {/* Always render Characters nav item to keep markup consistent between SSR and client */}
        <Button
          onClick={() => handleNavigation('/characters')}
          variant="ghost"
          className={`w-full min-h-11 flex items-center gap-3 px-4 py-3 text-left text-lg font-medium justify-start ${
            pathname === '/characters' || pathname.startsWith('/characters/') 
              ? 'bg-gray-700 text-white' 
              : 'text-link-nav-dark hover:bg-gray-900'
          } ${!hasWorlds ? 'hidden' : ''}`}
        >
          <User className="w-5 h-5" aria-hidden="true" />
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
          <Settings className="w-5 h-5" aria-hidden="true" />
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
                        ? 'bg-success text-success-foreground hover:bg-success/90' 
                        : 'text-link-nav-dark hover:bg-gray-900'
                    }`}
                  >
                    <div>
                      <div className="font-medium">{world.name}</div>
                      <div className="text-sm opacity-75">{world.genre} • {worldCharacters} characters</div>
                    </div>
                    {world.id === currentWorldId && (
                      <Check className="w-5 h-5 text-white" aria-hidden="true" />
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
              variant="success"
              className="w-full min-h-11 flex items-center justify-center gap-2 px-4 py-3 text-lg font-medium"
           >
              <Play className="w-5 h-5" aria-hidden="true" />
              Play {currentWorld.name}
            </Button>
          ) : Object.keys(worlds).length === 0 ? (
            <Button
              onClick={() => handleNavigation('/worlds/create')}
              className="w-full min-h-11 flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 hover:bg-blue-700 text-white text-lg font-medium"
           >
              <Plus className="w-5 h-5" aria-hidden="true" />
              Create Your First World
            </Button>
          ) : (
            <Button
              onClick={() => handleNavigation('/worlds/create')}
              className="w-full min-h-11 flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 hover:bg-blue-700 text-white text-lg font-medium"
           >
              <Plus className="w-5 h-5" aria-hidden="true" />
              Create New World
            </Button>
          )}
        </div>
      </div>
    </div>
  );
});
