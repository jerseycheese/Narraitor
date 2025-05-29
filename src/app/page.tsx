'use client';

import React from 'react';
import { QuickPlay } from '@/components/QuickPlay';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-100 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Narraitor
          </h1>
          <p className="text-xl text-gray-600">
            Your AI-powered narrative adventure awaits
          </p>
        </div>

        {/* Quick Play Section */}
        <div className="bg-gray-50 rounded-xl p-8">
          <QuickPlay />
        </div>

        {/* How it Works - Brief Guide */}
        <div className="mt-12 text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="text-3xl font-bold text-blue-600 mb-2">1</div>
              <h3 className="font-medium text-gray-900 mb-1">Choose a World</h3>
              <p className="text-sm text-gray-600">
                Select from templates or create your own unique setting
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="text-3xl font-bold text-blue-600 mb-2">2</div>
              <h3 className="font-medium text-gray-900 mb-1">Create a Character</h3>
              <p className="text-sm text-gray-600">
                Design your hero with attributes and backstory
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="text-3xl font-bold text-blue-600 mb-2">3</div>
              <h3 className="font-medium text-gray-900 mb-1">Start Playing</h3>
              <p className="text-sm text-gray-600">
                Make choices and shape your story with AI
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}