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
        <section className="bg-background rounded-lg border p-6 mb-6 shadow-sm" aria-labelledby="world-description-heading">
          <h2 id="world-description-heading" className="text-2xl font-semibold mb-4">
            About this world
          </h2>
          <div className="prose prose-gray dark:prose-invert">
            <p>{world.description}</p>
          </div>
        </section>
      )}

      {worldNpcs.length > 0 && (
        <section className="bg-background rounded-lg border p-6 mb-6 shadow-sm" aria-labelledby="world-npcs-heading">
          <h2 id="world-npcs-heading" className="text-2xl font-semibold mb-4">
            Characters you may meet
          </h2>
          <p className="text-muted-foreground mb-4">
            These NPCs were generated alongside <span className="font-semibold">{world.name}</span> and will appear in narrative scenes for this world.
          </p>
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {worldNpcs.map((npc) => (
              <li key={npc.id} className="flex items-start gap-3 rounded-lg border bg-muted/40 p-3 shadow-sm">
                {npc.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={npc.avatarUrl}
                    alt={npc.name}
                    className="h-12 w-12 flex-shrink-0 rounded-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-muted-foreground/20 text-sm font-semibold text-muted-foreground">
                    {npc.name
                      .split(' ')
                      .map((segment) => segment[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">{npc.name}</p>
                  <p className="text-sm text-muted-foreground leading-snug">{npc.description}</p>
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
