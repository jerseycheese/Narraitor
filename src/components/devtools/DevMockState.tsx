'use client';

import React, { useEffect } from 'react';

/**
 * DevMockState Component
 * 
 * This component is a placeholder for initializing mock state data.
 * In a real implementation, it would add test data to stores.
 * 
 * It doesn't render anything, just serves as a mounting point.
 */
export const DevMockState: React.FC = () => {
  // Only run in development mode and client-side
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // For test purposes, we would initialize mock data here
      // But to avoid type issues during build, we've simplified this component
      console.log('DevMockState component mounted in development mode');
    }
  }, []);

  // This component doesn't render anything
  return null;
};

