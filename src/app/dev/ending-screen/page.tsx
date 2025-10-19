'use client';

import React, { useEffect, useState } from 'react';
import { EndingScreen } from '@/components/GameSession/EndingScreen';
import { useNarrativeStore } from '@/state/narrativeStore';
import { useCharacterStore } from '@/state/characterStore';
import { useWorldStore } from '@/state/worldStore';
import type { StoryEnding } from '@/types/narrative.types';
import { getTimestamp } from '@/lib/utils';
import { ensureWorldNpcRoster } from '@/lib/services/worldCreationService';

// Move mock data outside component to prevent re-creation
const MOCK_CHARACTER_DATA = {
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

// Move mock world data outside component to prevent re-creation
const MOCK_WORLD_DATA = {
    name: 'Eldoria',
    description: 'A realm where magic and technology coexist',
    genre: 'fantasy',
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
const MOCK_ENDINGS: Record<string, StoryEnding> = {
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
      createdAt: getTimestamp(),
      updatedAt: getTimestamp(),
      achievements: [
        'Dragon Slayer',
        'Savior of Eldoria', 
        'Peacekeeper',
        'Master Warrior',
        'Hero of the Realm'
      ],
      playTime: 7200 // 2 hours
    },
    tragic: {
      id: 'ending-tragic',
      sessionId: 'test-session-123',
      characterId: 'test-char-123',
      worldId: 'test-world-456',
      type: 'story-complete',
      tone: 'tragic',
      epilogue: `The price of victory was everything. As Aria struck the killing blow against the dark lord, she felt her own life force being drawn away - the ancient magic demanded a soul for a soul, a truth the prophecies had hidden in their cryptic verses.

She collapsed beside her fallen enemy, her strength ebbing like the tide. Around her, the shadow armies crumbled to dust, and the cursed lands began to heal. The kingdom was saved, but its savior would not live to see the peace she had bought with her blood.

With her final breath, Aria whispered a prayer for those she was leaving behind. The sunrise broke over a free Eldoria, painting the sky in colors that seemed to honor her sacrifice. The darkness was gone forever, but so was the light she had carried within her.`,
      characterLegacy: `Aria Stormblade became Eldoria's greatest martyr, her sacrifice inspiring generations to come. Her tomb in the capital became a place of pilgrimage, where people came to remember that freedom's price is often paid by those who will never enjoy it.

Her story was told to children as both inspiration and warning - that heroism sometimes demands everything, but that such sacrifice is what separates the truly great from the merely ambitious. Schools were built in her name, teaching that service to others is the highest calling.`,
      worldImpact: `Eldoria emerged from the shadow war transformed by sacrifice. The kingdom became a realm where selflessness was the highest virtue, where leaders were chosen not for their ambition but for their willingness to serve others before themselves.

A new order rose from the ashes, one dedicated to ensuring that no future hero would have to pay the price that Aria paid. The realm's scholars worked tirelessly to find ways to break such cruel magics, vowing that her sacrifice would be the last of its kind.`,
      timestamp: new Date(),
      createdAt: getTimestamp(),
      updatedAt: getTimestamp(),
      achievements: [
        'Ultimate Sacrifice',
        'Martyr of Eldoria',
        'Soul-Price Payer',
        'The Final Light',
        'Eternal Guardian'
      ],
      playTime: 5400 // 1.5 hours
    },
    mysterious: {
      id: 'ending-mysterious',
      sessionId: 'test-session-123',
      characterId: 'test-char-123',
      worldId: 'test-world-456',
      type: 'story-complete',
      tone: 'mysterious',
      epilogue: `The final battle ended not with clash of steel, but with whispered words in an ancient tongue. As the dark lord fell, his form began to shimmer and fade, revealing something impossible - he bore Aria's own face, twisted by shadow and time.

"You understand now," he gasped with his final breath. "We are two sides of the same coin, forged in different fires."

Aria felt reality shift around her as memories that weren't her own flooded her mind. The victory was complete, but the truth it revealed opened doors to questions she wasn't sure she wanted answered. The prophecy spoke of a chosen one, but it never mentioned what happened after the choosing was done.`,
      characterLegacy: `The full truth of Aria Stormblade's destiny remained shrouded in mystery. Some claimed she ascended to become a guardian between worlds. Others whispered that she ventured into the spaces between realities, seeking answers to the riddle of her existence.

Her legend grew in the telling, becoming more myth than history. What was certain was that her sacrifice had meaning beyond the simple defeat of evil - she had stepped into a larger pattern, one that touched the very foundations of existence itself.`,
      worldImpact: `Eldoria prospered, but the kingdom was forever changed by mysteries that Aria's victory had unveiled. Ancient texts were studied with new urgency, and scholars detected patterns in history that suggested cycles repeating across millennia.

The realm became a center of learning for those seeking to understand the deeper mysteries of existence. What had seemed like a simple tale of good versus evil revealed itself as one thread in an incomprehensible tapestry that spanned worlds and ages.`,
      timestamp: new Date(),
      createdAt: getTimestamp(),
      updatedAt: getTimestamp(),
      achievements: [
        'Paradox Resolver',
        'Walker Between Worlds',
        'Truth Seeker',
        'Pattern Breaker',
        'Guardian of Mysteries'
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
      createdAt: getTimestamp(),
      updatedAt: getTimestamp(),
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

export default function EndingScreenTestPage() {
  const { createWorld } = useWorldStore();
  const { createCharacter } = useCharacterStore();
  const { setCurrentEnding } = useNarrativeStore();

  // Track created IDs
  const [createdIds, setCreatedIds] = useState<{characterId: string, worldId: string} | null>(null);

  // Initialize stores with mock data
  useEffect(() => {
    const worldId = createWorld(MOCK_WORLD_DATA);
    void ensureWorldNpcRoster(worldId);
    const characterData = { ...MOCK_CHARACTER_DATA, worldId };
    characterData.inventory.characterId = ''; // Will be set by createCharacter
    const characterId = createCharacter(characterData);
    
    // Store the created IDs for use in mock endings
    setCreatedIds({ characterId, worldId });
  }, [createCharacter, createWorld]);

  const handleTestEnding = (tone: string) => {
    if (!createdIds) return;
    
    const ending = MOCK_ENDINGS[tone];
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
    <div className="min-h-screen bg-gray-100">
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
              onClick={() => handleTestEnding('tragic')}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Test Tragic
            </button>
            <button
              onClick={() => handleTestEnding('mysterious')}
              className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800"
            >
              Test Mysterious
            </button>
            <button
              onClick={() => handleTestEnding('hopeful')}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Test Hopeful
            </button>
            <button
              onClick={() => setCurrentEnding(null)}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-700"
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
