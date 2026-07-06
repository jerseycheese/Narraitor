'use client';

import React from 'react';
import { DashboardHome } from '@/components/Dashboard';
import { SSRClientOnly } from '@/components/shared/SSRClientOnly';

export default function HomePage() {
  return (
    <div className="home-dashboard">
      <SSRClientOnly>
        <DashboardHome />
      </SSRClientOnly>
    </div>
  );
}
