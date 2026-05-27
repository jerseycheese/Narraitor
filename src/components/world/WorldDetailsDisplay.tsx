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
  showInfo = true,
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
      .filter((npc): npc is NonNullable<(typeof npcsById)[string]> =>
        Boolean(npc)
      );
  }, [npcIds, npcsById]);

  return (
    <div className="world-detail-sections">
      {showDescription && (
        <section
          className="world-detail-section"
          aria-labelledby="world-description-heading"
        >
          <h2 id="world-description-heading">About this world</h2>
          <div>
            <p>{world.description}</p>
          </div>
        </section>
      )}

      {worldNpcs.length > 0 && (
        <section
          className="world-detail-section world-detail-npcs"
          aria-labelledby="world-npcs-heading"
        >
          <h2 id="world-npcs-heading">Characters you may meet</h2>
          <p className="world-detail-npcs-lede">
            These NPCs were generated alongside <span>{world.name}</span> and
            will appear in narrative scenes for this world.
          </p>
          <ul className="world-detail-npcs-grid">
            {worldNpcs.map((npc) => (
              <li key={npc.id} className="world-detail-npc">
                {npc.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    className="world-detail-npc-avatar"
                    src={npc.avatarUrl}
                    alt={npc.name}
                    loading="lazy"
                  />
                ) : (
                  <div className="world-detail-npc-avatar world-detail-npc-avatar-fallback" aria-hidden="true">
                    {npc.name
                      .split(' ')
                      .map((segment) => segment[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>
                )}
                <div className="world-detail-npc-meta">
                  <p className="world-detail-npc-name">{npc.name}</p>
                  <p className="world-detail-npc-description">{npc.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <WorldAttributesList attributes={world.attributes} />
      <WorldSkillsList skills={world.skills} attributes={world.attributes} />

      {showSettings && <WorldSettingsDisplay settings={world.settings} />}
      {showToneSettings && (
        <ToneSettingsDisplay toneSettings={world.toneSettings} />
      )}
      {showImageDetails && <WorldImageDisplay image={world.image} />}
      {showInfo && <WorldInfoSection world={world} />}
    </div>
  );
}
