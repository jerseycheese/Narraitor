'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { NarrativeDisplay } from '@/components/Narrative/NarrativeDisplay';
import { useNPCStore } from '@/state/npcStore';
import { NarrativeSegment } from '@/types/narrative.types';
import { getTimestamp } from '@/lib/utils';

export default function DialogueTestPage() {
  const { createNPC, getAll, reset } = useNPCStore();
  const [npcIds, setNpcIds] = useState<{ gandalf: string; aragorn: string; frodo: string }>({
    gandalf: '',
    aragorn: '',
    frodo: '',
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Clear any existing NPCs and create test NPCs
    reset();

    const gandalfId = createNPC({
      name: 'Gandalf',
      description: 'A wise wizard',
      worldId: 'test-world',
      avatarUrl: 'https://i.pravatar.cc/150?img=68',
    });

    const aragornId = createNPC({
      name: 'Aragorn',
      description: 'A ranger and future king',
      worldId: 'test-world',
      avatarUrl: 'https://i.pravatar.cc/150?img=12',
    });

    const frodoId = createNPC({
      name: 'Frodo',
      description: 'A brave hobbit',
      worldId: 'test-world',
    });

    setNpcIds({
      gandalf: gandalfId,
      aragorn: aragornId,
      frodo: frodoId,
    });
  }, [createNPC, reset]);

  if (!mounted) {
    return <div className="p-8">Loading...</div>;
  }

  const allNPCs = getAll();

  // Test segments
  const dialogueWithGandalf: NarrativeSegment = {
    id: 'seg-1',
    content: 'You shall not pass! This foe is beyond any of you. Run!',
    type: 'dialogue',
    sessionId: 'test-session',
    worldId: 'test-world',
    timestamp: new Date(),
    createdAt: getTimestamp(),
    updatedAt: getTimestamp(),
    metadata: {
      tags: ['dialogue', 'dramatic'],
      speakerId: npcIds.gandalf,
    },
  };

  const dialogueWithAragorn: NarrativeSegment = {
    id: 'seg-2',
    content: 'A day may come when the courage of men fails, but it is not this day! This day we fight!',
    type: 'dialogue',
    sessionId: 'test-session',
    worldId: 'test-world',
    timestamp: new Date(),
    createdAt: getTimestamp(),
    updatedAt: getTimestamp(),
    metadata: {
      tags: ['dialogue', 'inspiring'],
      speakerId: npcIds.aragorn,
    },
  };

  const dialogueWithFrodo: NarrativeSegment = {
    id: 'seg-3',
    content: 'I wish it need not have happened in my time. So do all who live to see such times. But that is not for them to decide.',
    type: 'dialogue',
    sessionId: 'test-session',
    worldId: 'test-world',
    timestamp: new Date(),
    createdAt: getTimestamp(),
    updatedAt: getTimestamp(),
    metadata: {
      tags: ['dialogue', 'contemplative'],
      speakerId: npcIds.frodo,
    },
  };

  const dialogueWithoutSpeaker: NarrativeSegment = {
    id: 'seg-4',
    content: 'A mysterious voice echoes from the shadows...',
    type: 'dialogue',
    sessionId: 'test-session',
    worldId: 'test-world',
    timestamp: new Date(),
    createdAt: getTimestamp(),
    updatedAt: getTimestamp(),
    metadata: {
      tags: ['dialogue', 'mysterious'],
    },
  };

  const sceneSegment: NarrativeSegment = {
    id: 'seg-5',
    content: 'The fellowship gathers in the great hall of Rivendell. Elrond calls the meeting to order as representatives from all free peoples take their seats.',
    type: 'scene',
    sessionId: 'test-session',
    worldId: 'test-world',
    timestamp: new Date(),
    createdAt: getTimestamp(),
    updatedAt: getTimestamp(),
    metadata: {
      tags: ['scene', 'gathering'],
    },
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">NPC Dialogue Display Test</h1>
        <p className="text-gray-600 mb-8">Testing issue #770 - NPC dialogue with speaker information</p>

        {/* NPC Debug Info */}
        <div className="mb-8 p-4 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">NPCs in Store ({allNPCs.length})</h2>
          <div className="space-y-2">
            {allNPCs.map((npc) => (
              <div key={npc.id} className="p-2 bg-gray-50 rounded flex items-center gap-2">
                {npc.avatarUrl && (
                  <Image
                    src={npc.avatarUrl}
                    alt={npc.name}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                )}
                <div>
                  <div className="font-medium">{npc.name}</div>
                  <div className="text-xs text-gray-500">ID: {npc.id}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Test Cases */}
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-2 text-gray-700">
              Test 1: Dialogue with Speaker + Avatar (Gandalf)
            </h2>
            <NarrativeDisplay segment={dialogueWithGandalf} />
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2 text-gray-700">
              Test 2: Dialogue with Speaker + Avatar (Aragorn)
            </h2>
            <NarrativeDisplay segment={dialogueWithAragorn} />
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2 text-gray-700">
              Test 3: Dialogue with Speaker, No Avatar (Frodo)
            </h2>
            <NarrativeDisplay segment={dialogueWithFrodo} />
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2 text-gray-700">
              Test 4: Dialogue without Speaker Info
            </h2>
            <NarrativeDisplay segment={dialogueWithoutSpeaker} />
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2 text-gray-700">
              Test 5: Regular Scene (No Dialogue)
            </h2>
            <NarrativeDisplay segment={sceneSegment} />
          </div>
        </div>
      </div>
    </div>
  );
}
