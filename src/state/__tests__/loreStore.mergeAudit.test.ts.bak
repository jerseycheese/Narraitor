import { describe, it, expect } from '@jest/globals';
import { act, renderHook } from '@testing-library/react';
import { useLoreStore } from '../loreStore';
import { generateLoreKey } from '../loreStore.helpers';
import type { EntityID } from '@/types/common.types';

describe('loreStore merge audit', () => {
  it('logs merges and updates related entity references', () => {
    const worldId: EntityID = 'world-merge' as EntityID;
    const { result } = renderHook(() => useLoreStore());

    act(() => {
      result.current.clearFacts(worldId);
    });

    let primaryId: EntityID = '' as EntityID;
    let secondaryId: EntityID = '' as EntityID;
    let referenceId: EntityID = '' as EntityID;

    act(() => {
      primaryId = result.current.addFact(
        generateLoreKey(worldId, 'character', 'Lyra'),
        'Lyra',
        'characters',
        'manual',
        worldId,
        undefined,
        { importance: 'high' }
      );

      secondaryId = result.current.addFact(
        generateLoreKey(worldId, 'character', 'Lira'),
        'Lira',
        'characters',
        'manual',
        worldId,
        undefined,
        { importance: 'low' }
      );

      referenceId = result.current.addFact(
        generateLoreKey(worldId, 'event', 'Lira battle'),
        'Lira battle',
        'events',
        'manual',
        worldId,
        undefined,
        { relatedEntities: ['Lira'] }
      );
    });

    act(() => {
      result.current.mergeFacts(primaryId, secondaryId);
    });

    const updatedReference = result.current.getById(referenceId);
    expect(updatedReference?.metadata?.relatedEntities).toContain('Lyra');
    expect(updatedReference?.metadata?.relatedEntities).not.toContain('Lira');

    const auditLog = result.current.getMergeAuditLog();
    expect(auditLog).toHaveLength(1);
    expect(auditLog[0].primaryId).toBe(primaryId);
    expect(auditLog[0].secondaryId).toBe(secondaryId);
    expect(auditLog[0].referencesUpdated).toBe(1);
    expect(auditLog[0].aliasesAdded).toContain('Lira');
  });
});
