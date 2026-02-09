'use client';

import React from 'react';
import Image from 'next/image';
import { DashboardHome } from '@/components/Dashboard';
import { SSRClientOnly } from '@/components/shared/SSRClientOnly';

export default function HomePage() {
  return (
    <main >
      <div >
        {/* Visually hidden H1 for accessibility */}
        <h1 >Narraitor - Interactive Storytelling Game</h1>

        <div >
          {/* Left Column - Dashboard Content (2/3 width) */}
          <div >
            <SSRClientOnly>
              <DashboardHome />
            </SSRClientOnly>
          </div>

          {/* Right Column - Logo and Branding (1/3 width) */}
          <div >
            <div >
              <Image
                src="/narraitor-logo.svg"
                alt="Narraitor Logo"
                width={240}
                height={240}
                
              />
              <h2 >
                <span >Narr</span><span >ai</span><span >tor</span>
              </h2>
              <p >
                Interactive storytelling in any universe you can imagine
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
