'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { worldStore } from '@/state/worldStore';
import { World } from '@/types/world.types';

export default function GameSessionPage() {
  const params = useParams();
  const worldId = params?.id as string;
  const [world, setWorld] = useState<World | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!worldId) {
      setError('No world ID provided');
      setLoading(false);
      return;
    }
    
    try {
      const { worlds, setCurrentWorld } = worldStore.getState();
      const worldData = worlds[worldId];
      
      if (!worldData) {
        setError(`World with ID ${worldId} not found`);
        setLoading(false);
        return;
      }
      
      // Set as current world
      setCurrentWorld(worldId);
      setWorld(worldData);
      setLoading(false);
    } catch (error) {
      console.error('Error loading world data:', error);
      setError('Error loading world data');
      setLoading(false);
    }
  }, [worldId]);
  
  if (loading) {
    return (
      <div data-testid="game-session-loading">
        Loading game session...
      </div>
    );
  }
  
  if (error) {
    return (
      <div data-testid="game-session-error">
        Error: {error}
      </div>
    );
  }
  
  if (!world) {
    return (
      <div data-testid="game-session-not-found">
        World not found
      </div>
    );
  }
  
  return (
    <div data-testid="game-session-container">
      <h1 data-testid="game-session-title">
        Playing: {world.name}
      </h1>
      <p data-testid="game-session-description">
        {world.description}
      </p>
      <p data-testid="game-session-theme">
        Theme: {world.theme}
      </p>
    </div>
  );
}
