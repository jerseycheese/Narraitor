'use client';

import React from 'react';
import Image from 'next/image';
import { DashboardHome } from '@/components/Dashboard';
import { SSRClientOnly } from '@/components/shared/SSRClientOnly';

export default function HomePage() {
  return (
    <>
      <div className="home-hero">
        <Image
          src="/narraitor-logo.svg"
          alt="Narraitor"
          width={120}
          height={120}
          className="home-hero-logo"
          priority
        />
        <h1 className="home-hero-title">Narraitor</h1>
        <p className="home-hero-tagline">
          Interactive storytelling in any universe you can imagine
        </p>
      </div>

      <div className="home-dashboard">
        <SSRClientOnly>
          <DashboardHome />
        </SSRClientOnly>
      </div>
    </>
  );
}
