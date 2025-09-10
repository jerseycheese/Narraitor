'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWorldStore } from '@/state/worldStore';
import { useCharacterStore, type Character } from '@/state/characterStore';
import { useNavigationLoadingContext } from '@/components/shared/NavigationLoadingProvider';
import { useMobileNavigation } from '@/hooks/useMobileNavigation';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { Breadcrumbs } from './Breadcrumbs';
import dynamic from 'next/dynamic';
import { SSRClientOnly } from '@/components/shared/SSRClientOnly';
// Render RecentPagesDropdown only on the client to avoid SSR/client mismatches
const RecentPagesDropdown = dynamic(() => import('./RecentPagesDropdown').then(m => ({ default: m.RecentPagesDropdown })), { ssr: false });
import { MobileNavigationMenu } from './MobileNavigationMenu';
import { LogoIcon, LogoText } from '@/components/ui/Logo';
import { Button } from '@/components/ui/button';
import { X, Menu, Globe, ChevronDown, Check, Plus, Play } from 'lucide-react';

/**
 * Navigation - Main application navigation component
 * 
 * Provides the primary navigation bar with logo, main navigation links,
 * world switcher dropdown, and contextual action buttons. Automatically
 * adapts based on current route and available worlds/characters.
 * 
 * Features:
 * - Responsive design with mobile-friendly layout
 * - World switcher dropdown with character counts
 * - Contextual play button when world is selected
 * - Breadcrumb navigation for deeper pages
 * - Automatic current world and character tracking
 * 
 * @returns The main navigation component with header and breadcrumbs
 * 
 * @example
 * // Used in root layout - no props needed
 * <Navigation />
 */
export function Navigation() {
  const pathname = usePathname();
  const { currentWorldId, worlds, setCurrentWorld } = useWorldStore();
  const { characters } = useCharacterStore();
  const { navigateWithLoading } = useNavigationLoadingContext();
  const { isMenuOpen, isMobile, closeMenu, toggleMenu } = useMobileNavigation();
  const [showWorldSwitcher, setShowWorldSwitcher] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  
  const currentWorld = currentWorldId ? worlds[currentWorldId] : null;
  const hasWorldsStore = Object.keys(worlds).length > 0;
  const worldCharacterCount = (Object.values(characters) as Character[]).filter(
    char => char.worldId === currentWorldId
  ).length;
  // Ensure first client render matches server by deferring store-driven visibility until after mount
  const hasWorlds = mounted && hasWorldsStore;
  
  // Check if we should show breadcrumbs
  const shouldShowBreadcrumbs = pathname !== '/' && pathname !== '/worlds';
  
  // Keyboard shortcuts for navigation
  useKeyboardShortcuts([
    {
      key: 'Escape',
      action: () => {
        if (showWorldSwitcher) {
          setShowWorldSwitcher(false);
        }
        if (isMenuOpen) {
          closeMenu();
        }
      },
      description: 'Close open menus and dropdowns'
    }
  ], true);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowWorldSwitcher(false);
      }
    };
    
    if (showWorldSwitcher) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showWorldSwitcher]);
  
  // Mark mounted after first client render
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const handleWorldSwitch = (worldId: string) => {
    setCurrentWorld(worldId);
    setShowWorldSwitcher(false);
    // Navigate to the selected world's view page with loading state
    const worldName = worlds[worldId]?.name || 'world';
    navigateWithLoading(`/worlds/${worldId}`, `Loading ${worldName}...`);
  };
  
  // Don't show navigation on dev pages
  if (pathname.startsWith('/dev')) {
    return null;
  }
  
  return (
    <>
      <nav className="bg-gray-900 text-white shadow-lg" role="banner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left side - Logo and mobile menu button */}
            <div className="flex items-center space-x-4">
              {/* Mobile menu button */}
              {isMobile && (
                <Button
                  onClick={toggleMenu}
                  variant="ghost"
                  size="icon"
                  className="md:hidden min-h-11 min-w-11 bg-gray-900 hover:bg-gray-700 text-white"
                  aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                  aria-expanded={isMenuOpen}
                >
                  {isMenuOpen ? (
                    <X className="w-6 h-6" aria-hidden="true" />
                  ) : (
                    <Menu className="w-6 h-6" aria-hidden="true" />
                  )}
                </Button>
              )}
              
              <Link 
                href="/" 
                className="flex items-center gap-2 hover:opacity-90 transition-opacity"
              >
                <LogoIcon size="small" className="brightness-0 invert" />
                <LogoText size="sm" className="text-white" />
              </Link>
              
              {/* Desktop navigation */}
              <div className="hidden md:flex items-center space-x-1 ml-8" data-testid="desktop-navigation">
                <Link 
                  href="/worlds" 
                  data-navigation
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    pathname === '/worlds' || pathname.startsWith('/worlds/') ? 'text-white hover:text-gray-300' : 'text-link-nav-dark'
                  }`}
                >
                  Worlds
                </Link>
                {/* Always render Characters link to keep server/client markup consistent */}
                <Link 
                  href="/characters" 
                  data-navigation
                  aria-disabled={!hasWorlds}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    pathname === '/characters' || pathname.startsWith('/characters/') ? 'text-white hover:text-gray-300' : 'text-link-nav-dark'
                  } ${!hasWorlds ? 'hidden' : ''}`}
                >
                  Characters
                </Link>
                <Link 
                  href="/settings" 
                  data-navigation
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    pathname === '/settings' ? 'text-white hover:text-gray-300' : 'text-link-nav-dark'
                  }`}
                >
                  Settings
                </Link>
              </div>
            </div>
            
            {/* Right side - Quick actions and current context (hidden on mobile) */}
            <div className="hidden md:flex items-center gap-2 sm:gap-4">
              {/* World Switcher Dropdown */}
              {hasWorlds && (
                <div className="relative" ref={dropdownRef}>
                  <Button
                    onClick={() => setShowWorldSwitcher(!showWorldSwitcher)}
                    variant="ghost"
                    className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-900 hover:bg-gray-700 text-gray-300 hover:text-white rounded-md transition-colors h-auto"
                  >
                    <Globe className="w-4 h-4" aria-hidden="true" />
                    <span className="hidden sm:inline">
                      {currentWorld ? currentWorld.name : 'Select World'}
                    </span>
                    {currentWorld && worldCharacterCount > 0 && (
                      <span className="text-xs bg-gray-700 hover:bg-gray-700 text-white hover:text-white px-2 py-0.5 rounded-full">
                        {worldCharacterCount}
                      </span>
                    )}
                    <ChevronDown className="w-4 h-4" aria-hidden="true" />
                  </Button>
                  
                  {showWorldSwitcher && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg z-50 py-1 max-h-96 overflow-y-auto">
                      {Object.values(worlds).map(world => {
                        const worldCharacters = (Object.values(characters) as Character[]).filter(
                          char => char.worldId === world.id
                        ).length;
                        
                        return (
                          <Button
                            key={world.id}
                            onClick={() => handleWorldSwitch(world.id)}
                            variant="ghost"
                            className={`w-full text-left px-4 py-3 hover:bg-gray-100 transition-colors flex items-center justify-between h-auto ${
                              world.id === currentWorldId ? 'bg-green-50 border-l-4 border-green-500' : ''
                            }`}
                          >
                            <div>
                              <div className="font-medium text-gray-900">{world.name}</div>
                              <div className="text-sm text-gray-500">{world.genre} • {worldCharacters} characters</div>
                            </div>
                            {world.id === currentWorldId && (
                              <Check className="w-5 h-5 text-green-500" aria-hidden="true" />
                            )}
                          </Button>
                        );
                      })}
                      
                      <div className="border-t border-gray-200 mt-1 pt-1">
                        <Link
                          href="/worlds"
                          className="w-full text-left px-4 py-3 hover:bg-gray-100 transition-colors flex items-center gap-2 text-link-nav"
                          onClick={() => setShowWorldSwitcher(false)}
                        >
                          <Plus className="w-5 h-5" aria-hidden="true" />
                          Create a world
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Recent Pages Dropdown - mount after SSR-matched elements to avoid hydration diff */}
              <SSRClientOnly>
                <RecentPagesDropdown />
              </SSRClientOnly>
              
              {/* Quick actions - render after hydration to keep SSR stable */}
              <SSRClientOnly>
                {currentWorld ? (
                  <Button 
                    type="button"
                    onClick={() => navigateWithLoading(`/worlds/${currentWorld.id}/play`, `Starting ${currentWorld.name}...`)}
                    className="hidden sm:inline-flex items-center bg-green-500 hover:bg-green-700 text-white text-sm font-medium"
                  >
                    <Play className="w-4 h-4 mr-1" aria-hidden="true" />
                    Play
                  </Button>
                ) : (!hasWorldsStore ? (
                  <Button 
                    type="button"
                    onClick={() => navigateWithLoading('/worlds/create', 'Setting up world creation...')}
                    className="inline-flex items-center bg-blue-500 hover:bg-blue-700 text-white text-sm font-medium"
                  >
                    Create Your First World
                  </Button>
                ) : null)}
              </SSRClientOnly>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation Menu */}
      <MobileNavigationMenu 
        isOpen={isMenuOpen}
        onClose={closeMenu}
        onNavigate={navigateWithLoading}
      />
      
      {/* Breadcrumbs - render after hydration to keep SSR/client markup identical */}
      {shouldShowBreadcrumbs && (
        <div className="bg-gray-100 border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
            <SSRClientOnly>
              <Breadcrumbs className="sm:hidden" maxItems={2} />
            </SSRClientOnly>
            <SSRClientOnly>
              <Breadcrumbs className="hidden sm:flex" />
            </SSRClientOnly>
          </div>
        </div>
      )}
    </>
  );
}
