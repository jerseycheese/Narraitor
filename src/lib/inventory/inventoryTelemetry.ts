import Logger from '@/lib/utils/logger';

const inventoryTelemetryLogger = new Logger('InventoryPersistence');

interface GuardSanitizedContext {
  characterId: string;
  reason: 'non-array' | 'invalid-entries';
  removedCount: number;
}

export const logInventoryGuardSanitized = (context: GuardSanitizedContext): void => {
  inventoryTelemetryLogger.info('Inventory guard sanitized payload', context);
};
