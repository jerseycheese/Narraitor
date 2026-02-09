'use client';

import React, { useCallback, useMemo } from 'react';
import { World } from '@/types/world.types';
import { WorldAttributesList } from './WorldAttributesList';
import { WorldSkillsList } from './WorldSkillsList';
import { WorldSettingsDisplay } from './WorldSettingsDisplay';
import { ToneSettingsDisplay } from './ToneSettingsDisplay';
import { WorldImageDisplay } from './WorldImageDisplay';
import { WorldInfoSection } from './WorldInfoSection';
import { useNPCStore } from '@/state/npcStore';

const EMPTY_NPC_IDS: string[] = [];

interface WorldDetailsDisplayProps {
  world: World;
  showDescription?: boolean;
  showSettings?: boolean;
  showToneSettings?: boolean;
  showImageDetails?: boolean;
  showInfo?: boolean;
}

export function WorldDetailsDisplay({
  world,
  showDescription = true,
  showSettings = true,
  showToneSettings = true,
  showImageDetails = true,
  showInfo = true
}: WorldDetailsDisplayProps) {
  const npcIds = useNPCStore(
    useCallback(
      (state) => state.worldNpcs[world.id] ?? EMPTY_NPC_IDS,
      [world.id]
    )
  );
  const npcsById = useNPCStore((state) => state.npcs);

  const worldNpcs = useMemo(() => {
    if (!npcIds || npcIds === EMPTY_NPC_IDS || npcIds.length === 0) {
      return [];
    }

    return npcIds
      .map((id) => npcsById[id])
      .filter((npc): npc is NonNullable<typeof npcsById[string]> => Boolean(npc));
  }, [npcIds, npcsById]);

  return (
    <>
      {showDescription && (
        <section  aria-labelledby="world-description-heading">
          <h2 id="world-description-heading" >
            About this world
          </h2>
          <div className="prose prose-gray dark:prose-invert">
            <p>{world.description}</p>
          </div>
        </section>
      )}

      {worldNpcs.length > 0 && (
        <section  aria-labelledby="world-npcs-heading">
          <h2 id="world-npcs-heading" >
            Characters you may meet
          </h2>
          <p >
            These NPCs were generated alongside <span >{world.name}</span> and will appear in narrative scenes for this world.
          </p>
          <ul >
            {worldNpcs.map((npc) => (
              <li key={npc.id} >
                {npc.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={npc.avatarUrl}
                    alt={npc.name}
                    
                    loading="lazy"
                  />
                ) : (
                  <div >
                    {npc.name
                      .split('')
                      .map((segment) => segment[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>
                )}
                <div >
                  <p >{npc.name}</p>
                  <p >{npc.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
      
      <WorldAttributesList attributes={world.attributes} />
      <WorldSkillsList skills={world.skills} attributes={world.attributes} />

      {showSettings && <WorldSettingsDisplay settings={world.settings} />}
      {showToneSettings && <ToneSettingsDisplay toneSettings={world.toneSettings} />}
      {showImageDetails && <WorldImageDisplay image={world.image} />}
      {showInfo && <WorldInfoSection world={world} />}
    </>
  );
}
