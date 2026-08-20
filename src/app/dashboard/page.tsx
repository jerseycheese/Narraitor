'use client';

import React from 'react';
import { DashboardHome } from '@/components/Dashboard';
import { SSRClientOnly } from '@/components/shared/SSRClientOnly';

/**
 * App home. Lives here rather than at / so the public Landing page can own the
 * root route; first-time users still get GuidedFirstTimeExperience via
 * DashboardHome.
 */
export default function DashboardPage() {
  return (
    <div className="home-dashboard">
      <SSRClientOnly>
        <DashboardHome />
      </SSRClientOnly>
    </div>
  );
}
