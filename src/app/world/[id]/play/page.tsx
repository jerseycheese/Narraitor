'use client';

import React, { useState, useEffect } from 'react';
import { notFound, useParams } from 'next/navigation';
import GameSession from '@/components/GameSession/GameSession';

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
      <div className="play-page-container">
        <div className="p-4 text-center">
          <p>Loading game session...</p>
        </div>
      </div>
    );
  }
  
  // Validate worldId - client-side only
  if (!worldId || worldId.trim() === '') {
    notFound();
  }

  return (
    <div className="play-page-container">
      <GameSession worldId={worldId} />
    </div>
  );
}
