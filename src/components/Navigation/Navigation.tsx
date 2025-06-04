'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { worldStore } from '@/state/worldStore';
import { characterStore } from '@/state/characterStore';
import { Breadcrumbs } from './Breadcrumbs';
import { LogoIcon, LogoText } from '@/components/ui/Logo';

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentWorldId, worlds, setCurrentWorld } = worldStore();
  const { characters } = characterStore();
  const [showWorldSwitcher, setShowWorldSwitcher] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const currentWorld = currentWorldId ? worlds[currentWorldId] : null;
  const worldCharacterCount = Object.values(characters).filter(
    char => char.worldId === currentWorldId
  ).length;
  
  // Check if we should show breadcrumbs
  const shouldShowBreadcrumbs = pathname !== '/' && pathname !== '/worlds';
  
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
    // Navigate to the selected world's view page
    router.push(`/world/${worldId}`);
  };
  
  // Don't show navigation on dev pages
  if (pathname.startsWith('/dev')) {
    return null;
  }
  
  return (
    <>
      <nav className="bg-gray-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left side - Main navigation */}
            <div className="flex items-center space-x-4">
              <Link 
                href="/" 
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <LogoIcon size="small" className="brightness-0 invert" />
                <LogoText size="sm" className="text-white" />
              </Link>
              
              <div className="hidden sm:flex items-center space-x-1 ml-8">
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
              </div>
            </div>
            
            {/* Right side - Quick actions and current context */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* World Switcher Dropdown */}
              {Object.keys(worlds).length > 0 && (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setShowWorldSwitcher(!showWorldSwitcher)}
                    className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-800 hover:bg-gray-700 rounded-md transition-colors"
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
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg z-50 py-1 max-h-96 overflow-y-auto">
                      {Object.values(worlds).map(world => {
                        const worldCharacters = Object.values(characters).filter(
                          char => char.worldId === world.id
                        ).length;
                        
                        return (
                          <button
                            key={world.id}
                            onClick={() => handleWorldSwitch(world.id)}
                            className={`w-full text-left px-4 py-3 hover:bg-gray-100 transition-colors flex items-center justify-between ${
                              world.id === currentWorldId ? 'bg-green-50 border-l-4 border-green-500' : ''
                            }`}
                          >
                            <div>
                              <div className="font-medium text-gray-900">{world.name}</div>
                              <div className="text-sm text-gray-500">{world.theme} • {worldCharacters} characters</div>
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
                          href="/world/create"
                          className="w-full text-left px-4 py-3 hover:bg-gray-100 transition-colors flex items-center gap-2 text-blue-600 hover:text-blue-700"
                          onClick={() => setShowWorldSwitcher(false)}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Create New World
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {currentWorld && (
                <Link 
                  href={`/world/${currentWorld.id}/play`}
                  className="hidden sm:inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md transition-colors"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Play
                </Link>
              )}
              {!currentWorld && Object.keys(worlds).length === 0 && (
                <Link 
                  href="/world/create" 
                  className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
                >
                  Create Your First World
                </Link>
              )}
            </div>
          </div>
          
          {/* Mobile menu hint */}
          <div className="sm:hidden py-2 border-t border-gray-800">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <Link href="/worlds" className="hover:text-gray-300">
                  Worlds
                </Link>
                <Link href="/characters" className="hover:text-gray-300">
                  Characters
                </Link>
              </div>
              {currentWorld && (
                <Link href={`/world/${currentWorld.id}/play`} className="text-indigo-400 hover:text-indigo-300">
                  ▶ Play
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>
      
      {/* Breadcrumbs */}
      {shouldShowBreadcrumbs && (
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
            <Breadcrumbs className="sm:hidden" maxItems={2} />
            <Breadcrumbs className="hidden sm:flex" />
          </div>
        </div>
      )}
    </>
  );
}