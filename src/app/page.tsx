'use client';

import React from 'react';
import Image from 'next/image';
import { DashboardHome } from '@/components/Dashboard';
import { SSRClientOnly } from '@/components/shared/SSRClientOnly';

export default function HomePage() {
  return (
    <main className="flex items-center justify-center py-6 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Visually hidden H1 for accessibility */}
        <h1 className="sr-only">Narraitor - Interactive Storytelling Game</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 items-start">
          {/* Left Column - Dashboard Content (2/3 width) */}
          <div className="order-2 lg:order-1 lg:col-span-2">
            <SSRClientOnly>
              <DashboardHome />
            </SSRClientOnly>
          </div>

          {/* Right Column - Logo and Branding (1/3 width) */}
          <div className="order-1 lg:order-2 lg:col-span-1 text-center">
            <div className="flex flex-col items-center">
              <Image
                src="/narraitor-logo.svg"
                alt="Narraitor Logo"
                width={240}
                height={240}
                className="w-40 h-40 md:w-60 md:h-60 mb-6"
              />
              <h2 className="text-6xl md:text-7xl text-foreground mb-4">
                <span className="font-light">Narr</span><span className="font-bold">ai</span><span className="font-light">tor</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-md">
                Interactive storytelling in any universe you can imagine
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
