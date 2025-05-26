'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { worldStore } from '@/state/worldStore';
import { characterStore } from '@/state/characterStore';

export function Navigation() {
  const pathname = usePathname();
  const { currentWorldId, worlds } = worldStore();
  const { characters } = characterStore();
  
  const currentWorld = currentWorldId ? worlds[currentWorldId] : null;
  const worldCharacterCount = Object.values(characters).filter(
    char => char.worldId === currentWorldId
  ).length;
  
  // Don't show navigation on dev pages
  if (pathname.startsWith('/dev')) {
    return null;
  }
  
  return (
    <nav className="bg-gray-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side - Main navigation */}
          <div className="flex items-center space-x-4">
            <Link 
              href="/" 
              className="text-xl font-bold hover:text-gray-300 transition-colors"
            >
              Narraitor
            </Link>
            
            <div className="hidden sm:flex items-center space-x-1 ml-8">
              <Link 
                href="/worlds" 
                className={`px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors ${
                  pathname === '/worlds' || pathname.startsWith('/world/') ? 'bg-gray-800' : ''
                }`}
              >
                Worlds
              </Link>
              
              {currentWorld && (
                <>
                  <span className="text-gray-500 mx-1">→</span>
                  <Link 
                    href="/characters" 
                    className={`px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors ${
                      pathname.startsWith('/characters') ? 'bg-gray-800' : ''
                    }`}
                  >
                    Characters
                    {worldCharacterCount > 0 && (
                      <span className="ml-2 text-xs bg-gray-700 px-2 py-1 rounded-full">
                        {worldCharacterCount}
                      </span>
                    )}
                  </Link>
                </>
              )}
            </div>
          </div>
          
          {/* Right side - Quick actions and current context */}
          <div className="flex items-center space-x-4">
            {currentWorld && (
              <>
                <Link 
                  href="/characters/create" 
                  className="hidden sm:inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md transition-colors"
                >
                  <span className="mr-1">+</span>
                  New Character
                </Link>
                <div className="hidden md:block text-sm text-gray-400">
                  <span className="text-gray-500">Current world:</span>{' '}
                  <span className="text-gray-300">{currentWorld.name}</span>
                </div>
              </>
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
            <Link href="/worlds" className="hover:text-gray-300">
              Worlds
            </Link>
            {currentWorld && (
              <>
                <Link href="/characters" className="hover:text-gray-300">
                  Characters ({worldCharacterCount})
                </Link>
                <Link href="/characters/create" className="text-green-400 hover:text-green-300">
                  + New Character
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
