'use client';

import React from 'react';
import Image from 'next/image';
import { QuickPlay } from '@/components/QuickPlay';
import { SSRClientOnly } from '@/components/shared/SSRClientOnly';
import { useWorldStore } from '@/state/worldStore';
import { useCharacterStore } from '@/state/characterStore';

export default function HomePage() {
  const { worlds } = useWorldStore();
  const { characters } = useCharacterStore();
  
  // Check if user has any existing data - if so, they don't need the "How It Works" tutorial
  const hasExistingData = Object.keys(worlds).length > 0 || Object.keys(characters).length > 0;
  
  return (
    <main className="min-h-screen py-6 sm:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          {/* Logo */}
          <div className="mb-0 flex justify-center">
            <Image 
              src="/narraitor-logo.svg" 
              alt="Narraitor Logo" 
              width={160}
              height={160}
              className="w-32 h-32 md:w-40 md:h-40"
            />
          </div>
          <h1 className="text-5xl text-gray-900">
            <span className="font-light">Narr</span><span className="font-bold">ai</span><span className="font-light">tor</span>
          </h1>
        </div>

        {/* Quick Play Section */}
        <div className="bg-gray-100 rounded-xl p-4 sm:p-8">
          <SSRClientOnly>
            <QuickPlay />
          </SSRClientOnly>
        </div>

        {/* How it Works - render after hydration to avoid SSR/client mismatch */}
        <SSRClientOnly>
          {!hasExistingData ? (
            <div className="mt-12 text-center">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                How It Works
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <div className="text-3xl font-bold text-blue-700 mb-2">1</div>
                  <h3 className="font-medium text-gray-900 mb-1">Build Your World</h3>
                  <p className="text-sm text-gray-700">
                    Create or generate unique worlds with custom rules and settings
                  </p>
                </div>
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <div className="text-3xl font-bold text-blue-700 mb-2">2</div>
                  <h3 className="font-medium text-gray-900 mb-1">Create Characters</h3>
                  <p className="text-sm text-gray-700">
                    Design or generate playable characters that fit your world
                  </p>
                </div>
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <div className="text-3xl font-bold text-blue-700 mb-2">3</div>
                  <h3 className="font-medium text-gray-900 mb-1">Start Playing</h3>
                  <p className="text-sm text-gray-700">
                    Make choices and shape your story
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </SSRClientOnly>
      </div>
    </main>
  );
}
