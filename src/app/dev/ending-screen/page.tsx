'use client';

import React, { useEffect, useState } from 'react';
import { EndingScreen } from '@/components/GameSession/EndingScreen';
import { useNarrativeStore } from '@/state/narrativeStore';
import { useCharacterStore } from '@/state/characterStore';
import { useWorldStore } from '@/state/worldStore';
import type { StoryEnding } from '@/types/narrative.types';

export default function EndingScreenTestPage() {
  const { setCurrentEnding } = useNarrativeStore();
  const { createCharacter } = useCharacterStore();
  const { createWorld } = useWorldStore();

  // Mock character data (without id, createdAt, updatedAt)
  const mockCharacterData = {
    name: 'Aria Stormblade',
    description: 'A seasoned warrior seeking redemption',
    worldId: 'test-world-456',
    level: 10,
    isPlayer: true,
    attributes: [],
    skills: [],
    background: {
      history: 'A seasoned warrior seeking redemption',
      personality: 'Brave and honorable',
      goals: ['Defeat the dark lord and restore peace'],
      fears: ['Losing those she protects'],
      physicalDescription: 'Tall and strong with weathered features',
      relationships: [],
      isKnownFigure: false,
    },
    portrait: {
      type: 'placeholder' as const,
      url: null
    },
    status: {
      health: 100,
      maxHealth: 100,
      conditions: []
    },
    inventory: {
      characterId: '', // Will be set after creation
      items: [],
      capacity: 20,
      categories: []
    }
  };

  // Mock world data (without id, createdAt, updatedAt)
  const mockWorldData = {
    name: 'Eldoria',
    description: 'A realm where magic and technology coexist',
    theme: 'High Fantasy',
    attributes: [],
    skills: [],
    settings: {
      maxAttributes: 6,
      maxSkills: 8,
      attributePointPool: 27,
      skillPointPool: 20,
    }
  };

  // Mock ending templates for different tones
  const mockEndings: Record<string, StoryEnding> = {
    triumphant: {
      id: 'ending-triumphant',
      sessionId: 'test-session-123',
      characterId: 'test-char-123',
      worldId: 'test-world-456',
      type: 'story-complete',
      tone: 'triumphant',
      epilogue: `As the sun set over the kingdom of Eldoria, Aria Stormblade stood atop the highest tower of the royal castle, her sword finally at rest. The dark lord had fallen, his shadow armies scattered to the winds, and peace had returned to the realm.

The scars of battle marked both the land and its people, but they were healing. In the distance, she could see farmers returning to their fields, merchants reopening their shops, and children playing in the streets once more. The long nightmare was over.

Aria smiled as she felt the weight of her destiny finally lifting from her shoulders. She had found the redemption she sought, not in the glory of victory, but in the simple joy of seeing her people safe and free.`,
      characterLegacy: `Aria Stormblade would be remembered not just as the warrior who defeated the dark lord, but as the hero who chose mercy over vengeance. Tales of her final confrontation would be sung for generations - how she offered her fallen enemy a chance at redemption, even in his darkest hour.

Her name became synonymous with honor and courage throughout Eldoria. Young warriors would train in her footsteps, and her teachings about finding strength in compassion would shape the kingdom's values for centuries to come.`,
      worldImpact: `The defeat of the dark lord marked the beginning of a new golden age for Eldoria. With the shadow of evil lifted, the realm flourished like never before. Magic and technology advanced hand in hand, creating wonders that benefited all citizens, not just the privileged few.

The alliances forged during the dark times grew stronger, uniting neighboring kingdoms in lasting peace. Eldoria became a beacon of hope for other realms struggling against their own darkness, proving that even the deepest shadows could be overcome through courage and unity.`,
      timestamp: new Date(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      achievements: [
        'Dragon Slayer',
        'Savior of Eldoria', 
        'Peacekeeper',
        'Master Warrior',
        'Hero of the Realm'
      ],
      playTime: 7200 // 2 hours
    },
    bittersweet: {
      id: 'ending-bittersweet',
      sessionId: 'test-session-123',
      characterId: 'test-char-123',
      worldId: 'test-world-456',
      type: 'story-complete',
      tone: 'bittersweet',
      epilogue: `Victory came at a great cost. As Aria stood among the ruins of the final battle, she counted the friends who would not see this new dawn. The dark lord was defeated, but the price of peace weighed heavily on her heart.

She had saved the kingdom, but lost pieces of herself along the way. The innocent girl who had first taken up her sword was gone, replaced by a warrior who understood that some battles leave scars that never truly heal.

Yet as she watched the sunrise paint the sky in brilliant colors, Aria found hope. The world would remember the fallen, honor their sacrifice, and build something beautiful from the ashes of war.`,
      characterLegacy: `Aria Stormblade's legacy was complex - a hero who saved the world but carried the weight of necessary sacrifices. Her story became a lesson about the true cost of heroism, teaching that courage isn't the absence of pain, but the choice to act despite it.

Veterans of the war would seek her counsel, finding in her someone who understood their struggles. Her quiet moments of grief became as legendary as her moments of triumph, showing that true strength included the willingness to feel deeply.`,
      worldImpact: `Eldoria's victory ushered in an era of somber prosperity. The kingdom rebuilt stronger than before, but never forgot the price of freedom. Monuments to the fallen stood in every city, and their stories were woven into the very fabric of the new society.

The realm's approach to conflict changed forever. Diplomacy became the first choice, not the last, as leaders remembered the devastating cost of the shadow war and vowed to never let such darkness take root again.`,
      timestamp: new Date(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      achievements: [
        'Pyrrhic Victory',
        'The Burden Bearer',
        'Last Stand Hero',
        'Keeper of Memory',
        'Guardian of Peace'
      ],
      playTime: 5400 // 1.5 hours
    },
    hopeful: {
      id: 'ending-hopeful',
      sessionId: 'test-session-123',
      characterId: 'test-char-123',
      worldId: 'test-world-456',
      type: 'story-complete',
      tone: 'hopeful',
      epilogue: `The dark lord's defeat was only the beginning. As his shadow lifted from the land, Aria discovered that the true magic of Eldoria wasn't in ancient spells or mighty weapons - it was in the connections between people, the bonds that had grown stronger in the darkness.

Standing before the assembled citizens of the realm, she made a choice that surprised everyone, including herself. She laid down her sword and picked up a teacher's staff, choosing to guide the next generation rather than rule them.

"Our greatest victories," she announced to the cheering crowd, "are not the enemies we defeat, but the friends we lift up along the way." The future stretched before them, bright with possibility and rich with the promise of adventures yet to come.`,
      characterLegacy: `Aria Stormblade's greatest achievement wasn't defeating the dark lord - it was showing an entire kingdom how to grow beyond their need for heroes. She became the realm's first Teacher-Guardian, establishing schools where young people learned not just to fight, but to dream, create, and build.

Her methods spread to other kingdoms, sparking a renaissance of learning and growth. The warrior who had saved one world became the teacher who helped countless others save themselves, proving that the most powerful magic is the ability to inspire others to greatness.`,
      worldImpact: `Eldoria blossomed into an age of unprecedented prosperity and creativity. With Aria's guidance, the kingdom became known throughout the land as a place where anyone could come to learn, grow, and discover their own potential.

The realm's approach to challenges shifted from combat to collaboration. Problems that once would have required heroes to solve were instead addressed by communities working together, creating solutions that were both more effective and more lasting than any sword could provide.`,
      timestamp: new Date(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      achievements: [
        'Kingdom\'s Teacher',
        'Hope Bringer',
        'Future Builder',
        'Community Creator',
        'Inspiration to All'
      ],
      playTime: 9000 // 2.5 hours
    }
  };

  // Initialize stores with mock data
  useEffect(() => {
    const worldId = createWorld(mockWorldData);
    const characterData = { ...mockCharacterData, worldId };
    characterData.inventory.characterId = ''; // Will be set by createCharacter
    const characterId = createCharacter(characterData);
    
    // Store the created IDs for use in mock endings
    setCreatedIds({ characterId, worldId });
  }, [createCharacter, createWorld, mockCharacterData, mockWorldData]);

  // Track created IDs
  const [createdIds, setCreatedIds] = useState<{characterId: string, worldId: string} | null>(null);

  const handleTestEnding = (tone: string) => {
    if (!createdIds) return;
    
    const ending = mockEndings[tone];
    if (ending) {
      // Update the ending with the actual created IDs
      const updatedEnding = {
        ...ending,
        characterId: createdIds.characterId,
        worldId: createdIds.worldId
      };
      setCurrentEnding(updatedEnding);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Test Controls */}
      <div className="bg-white shadow-sm border-b p-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">EndingScreen Test Harness</h1>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => handleTestEnding('triumphant')}
              className="px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600"
            >
              Test Triumphant
            </button>
            <button
              onClick={() => handleTestEnding('bittersweet')}
              className="px-4 py-2 bg-violet-500 text-white rounded hover:bg-violet-600"
            >
              Test Bittersweet
            </button>
            <button
              onClick={() => handleTestEnding('hopeful')}
              className="px-4 py-2 bg-emerald-500 text-white rounded hover:bg-emerald-600"
            >
              Test Hopeful
            </button>
            <button
              onClick={() => setCurrentEnding(null)}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Clear Ending
            </button>
          </div>
        </div>
      </div>

      {/* EndingScreen Component */}
      <EndingScreen />
    </div>
  );
}