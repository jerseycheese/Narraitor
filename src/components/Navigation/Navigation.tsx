'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWorldStore } from '@/state/worldStore';
import { useCharacterStore } from '@/state/characterStore';
import { useNavigationLoadingContext } from '@/components/shared/NavigationLoadingProvider';
import { useMobileNavigation } from '@/hooks/useMobileNavigation';
import { 
  useKeyboardNavigation, 
  useEnhancedKeyboardShortcuts, 
  useEscapeKey,
  useScreenReader 
} from '@/hooks/useKeyboardShortcuts';
import { Breadcrumbs } from './Breadcrumbs';
import { RecentPagesDropdown } from './RecentPagesDropdown';
import { MobileNavigationMenu } from './MobileNavigationMenu';
import { LogoIcon, LogoText } from '@/components/ui/Logo';
import { Button } from '@/components/ui/button';
import { KeyboardShortcutsHelp } from '@/components/KeyboardShortcutsHelp';

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
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  
  const { announce } = useScreenReader();
  
  const currentWorld = currentWorldId ? worlds[currentWorldId] : null;
  const worldCharacterCount = Object.values(characters).filter(
    char => char.worldId === currentWorldId
  ).length;
  
  // Check if we should show breadcrumbs
  const shouldShowBreadcrumbs = pathname !== '/' && pathname !== '/worlds';
  
  // Keyboard navigation setup
  const { containerRef } = useKeyboardNavigation({
    containerRef: navRef,
    enableArrowKeys: true,
    enableTabLoop: true,
    enableEscapeClose: true
  });

  // Global navigation shortcuts
  useEnhancedKeyboardShortcuts([
    {
      shortcut: {
        key: 'w',
        altKey: true,
        description: 'Navigate to Worlds page',
        category: 'navigation'
      },
      handler: () => {
        navigateWithLoading('/worlds', 'Loading Worlds...');
        announce('Navigating to Worlds page');
      }
    },
    {
      shortcut: {
        key: 'c',
        altKey: true,
        description: 'Navigate to Characters page',
        category: 'navigation'
      },
      handler: () => {
        navigateWithLoading('/characters', 'Loading Characters...');
        announce('Navigating to Characters page');
      }
    },
    {
      shortcut: {
        key: 's',
        altKey: true,
        description: 'Navigate to Settings page',
        category: 'navigation'
      },
      handler: () => {
        navigateWithLoading('/settings', 'Loading Settings...');
        announce('Navigating to Settings page');
      }
    },
    {
      shortcut: {
        key: 'h',
        altKey: true,
        description: 'Open keyboard shortcuts help',
        category: 'navigation'
      },
      handler: () => {
        setShowKeyboardHelp(true);
        announce('Opening keyboard shortcuts help');
      }
    }
  ], [navigateWithLoading, announce]);

  // Close dropdowns with Escape
  useEscapeKey(() => {
    if (showWorldSwitcher) {
      setShowWorldSwitcher(false);
      announce('World switcher closed');
    } else if (isMenuOpen) {
      closeMenu();
      announce('Mobile menu closed');
    }
  }, showWorldSwitcher || isMenuOpen);

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
  
  const handleWorldSwitch = (worldId: string) => {
    setCurrentWorld(worldId);
    setShowWorldSwitcher(false);
    // Navigate to the selected world's view page with loading state
    const worldName = worlds[worldId]?.name || 'world';
    navigateWithLoading(`/world/${worldId}`, `Loading ${worldName}...`);
    announce(`Switched to ${worldName} world`);
  };
  
  // Don't show navigation on dev pages
  if (pathname.startsWith('/dev')) {
    return null;
  }
  
  return (
    <>
      <nav 
        ref={navRef}
        className="bg-gray-900 text-white shadow-lg" 
        role="banner"
        aria-label="Main navigation"
      >
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
                  className="md:hidden min-h-11 min-w-11 bg-gray-800 hover:bg-gray-700 text-white"
                  aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                  aria-expanded={isMenuOpen}
                >
                  {isMenuOpen ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  )}
                </Button>
              )}
              
              <Link 
                href="/" 
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <LogoIcon size="small" className="brightness-0 invert" />
                <LogoText size="sm" className="text-white" />
              </Link>
              
              {/* Desktop navigation */}
              <div className="hidden md:flex items-center space-x-1 ml-8" data-testid="desktop-navigation">
                <Link 
                  href="/worlds" 
                  className={`px-3 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors ${
                    pathname === '/worlds' || pathname.startsWith('/world/') ? 'text-white' : ''
                  }`}
                >
                  Worlds
                </Link>
                <Link 
                  href="/characters" 
                  className={`px-3 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors ${
                    pathname === '/characters' || pathname.startsWith('/characters/') ? 'text-white' : ''
                  }`}
                >
                  Characters
                </Link>
                <Link 
                  href="/settings" 
                  className={`px-3 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors ${
                    pathname === '/settings' ? 'text-white' : ''
                  }`}
                >
                  Settings
                </Link>
              </div>
            </div>
            
            {/* Right side - Quick actions and current context (hidden on mobile) */}
            <div className="hidden md:flex items-center gap-2 sm:gap-4">
              {/* Recent Pages Dropdown */}
              <RecentPagesDropdown />
              
              {/* World Switcher Dropdown */}
              {Object.keys(worlds).length > 0 && (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setShowWorldSwitcher(!showWorldSwitcher)}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowDown' || e.key === 'Enter') {
                        e.preventDefault();
                        setShowWorldSwitcher(true);
                        // Focus first world option when opened
                        setTimeout(() => {
                          const firstOption = dropdownRef.current?.querySelector('button[data-world-option]') as HTMLButtonElement;
                          firstOption?.focus();
                        }, 50);
                      }
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-800 hover:bg-gray-700 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                    aria-expanded={showWorldSwitcher}
                    aria-haspopup="true"
                    aria-label={`Current world: ${currentWorld ? currentWorld.name : 'Select World'}. Click to open world switcher`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="hidden sm:inline">
                      {currentWorld ? currentWorld.name : 'Select World'}
                    </span>
                    {currentWorld && worldCharacterCount > 0 && (
                      <span className="text-xs bg-gray-700 px-2 py-0.5 rounded-full">
                        {worldCharacterCount}
                      </span>
                    )}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {showWorldSwitcher && (
                    <div 
                      className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg z-50 py-1 max-h-96 overflow-y-auto"
                      role="menu"
                      aria-label="World switcher menu"
                    >
                      {Object.values(worlds).map((world, index) => {
                        const worldCharacters = Object.values(characters).filter(
                          char => char.worldId === world.id
                        ).length;
                        
                        return (
                          <button
                            key={world.id}
                            data-world-option
                            onClick={() => handleWorldSwitch(world.id)}
                            onKeyDown={(e) => {
                              const worldButtons = Array.from(dropdownRef.current?.querySelectorAll('button[data-world-option]') || []);
                              const currentIndex = worldButtons.indexOf(e.currentTarget);
                              
                              if (e.key === 'ArrowDown') {
                                e.preventDefault();
                                const nextIndex = currentIndex < worldButtons.length - 1 ? currentIndex + 1 : 0;
                                (worldButtons[nextIndex] as HTMLButtonElement)?.focus();
                              } else if (e.key === 'ArrowUp') {
                                e.preventDefault();
                                const prevIndex = currentIndex > 0 ? currentIndex - 1 : worldButtons.length - 1;
                                (worldButtons[prevIndex] as HTMLButtonElement)?.focus();
                              } else if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleWorldSwitch(world.id);
                              } else if (e.key === 'Escape') {
                                e.preventDefault();
                                setShowWorldSwitcher(false);
                                // Return focus to the trigger button
                                const trigger = dropdownRef.current?.querySelector('button[aria-haspopup]') as HTMLButtonElement;
                                trigger?.focus();
                              }
                            }}
                            className={`w-full text-left px-4 py-3 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none transition-colors flex items-center justify-between ${
                              world.id === currentWorldId ? 'bg-green-50 border-l-4 border-green-500' : ''
                            }`}
                            role="menuitem"
                            aria-label={`Switch to ${world.name} world. ${world.genre} genre, ${worldCharacters} characters${world.id === currentWorldId ? '. Currently selected' : ''}`}
                          >
                            <div>
                              <div className="font-medium text-gray-900">{world.name}</div>
                              <div className="text-sm text-gray-500">{world.genre} • {worldCharacters} characters</div>
                            </div>
                            {world.id === currentWorldId && (
                              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </button>
                        );
                      })}
                      
                      <div className="border-t border-gray-200 mt-1 pt-1">
                        <Link
                          href="/worlds"
                          className="w-full text-left px-4 py-3 hover:bg-gray-100 transition-colors flex items-center gap-2 text-blue-600 hover:text-blue-700"
                          onClick={() => setShowWorldSwitcher(false)}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Create a world
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {currentWorld && (
                <button 
                  type="button"
                  onClick={() => navigateWithLoading(`/world/${currentWorld.id}/play`, `Starting ${currentWorld.name}...`)}
                  className="hidden sm:inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md transition-colors"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Play
                </button>
              )}
              {!currentWorld && Object.keys(worlds).length === 0 && (
                <button 
                  type="button"
                  onClick={() => navigateWithLoading('/world/create', 'Setting up world creation...')}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
                >
                  Create Your First World
                </button>
              )}
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
      
      {/* Breadcrumbs */}
      {shouldShowBreadcrumbs && (
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
            <Breadcrumbs className="sm:hidden" maxItems={2} />
            <Breadcrumbs className="hidden sm:flex" />
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Help Dialog */}
      <KeyboardShortcutsHelp 
        isOpen={showKeyboardHelp}
        onClose={() => setShowKeyboardHelp(false)}
      />
    </>
  );
}
