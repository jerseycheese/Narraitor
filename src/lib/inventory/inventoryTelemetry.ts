import Logger from '@/lib/utils/logger';

const inventoryTelemetryLogger = new Logger('InventoryPersistence');

interface GuardSanitizedContext {
  characterId: string;
  reason: 'non-array' | 'invalid-entries';
  removedCount: number;
}

interface StateResetContext {
  reason: 'schema-reset' | 'corrupted-state';
  characterCount: number;
}

export const logInventoryGuardSanitized = (context: GuardSanitizedContext): void => {
  inventoryTelemetryLogger.info('Inventory guard sanitized payload', context);
};

const logInventoryStateReset = (context: StateResetContext): void => {
  inventoryTelemetryLogger.warn('Inventory persistence reset applied', context);
};
