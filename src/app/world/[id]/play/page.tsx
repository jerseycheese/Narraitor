'use client';

import React, { useState, useEffect } from 'react';
import { notFound, useParams } from 'next/navigation';
import GameSession from '@/components/GameSession/GameSession';
import { PageLayout } from '@/components/shared/PageLayout';

/**
 * Play page component that initializes a game session with a worldId
 */
export default function PlayPage() {
  const params = useParams();
  const worldId = params?.id as string;
  const [isClient, setIsClient] = useState(false);
  
  // Set isClient to true once component mounts
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // For server rendering, show a simple placeholder
  if (!isClient) {
    return (
      <PageLayout title="" maxWidth="7xl">
        <div className="p-4 text-center">
          <p>Loading game session...</p>
        </div>
      </PageLayout>
    );
  }
  
  // Validate worldId - client-side only
  if (!worldId || worldId.trim() === '') {
    notFound();
  }

  return (
    <PageLayout title="" maxWidth="7xl" className="pb-0">
      <GameSession worldId={worldId} />
    </PageLayout>
  );
}
