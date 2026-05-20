import { normalizeText, NORM_NAME } from '@/lib/utils';
import type { InventoryItem } from '@/types/inventory.types';
import type { ItemLossReason, LostItemMetadata } from '@/types/narrative.types';

const LOSS_REASON_PATTERNS: Array<{ reason: ItemLossReason; pattern: RegExp }> = [
  { reason: 'consumed', pattern: /\b(drink|drank|consume|consumed|eat|ate|used up|use up|spent)\b/i },
  { reason: 'delivered', pattern: /\b(deliver|delivered|hand over|handed over|turn in|turned in|give to|gave to)\b/i },
  { reason: 'stolen', pattern: /\b(stolen|steal|stole|pickpocket|snatched)\b/i },
  { reason: 'destroyed', pattern: /\b(destroy|destroyed|shatter|shattered|break|broke|broken|ruined)\b/i },
  { reason: 'sold', pattern: /\b(sell|sold|trade|traded)\b/i },
  { reason: 'gifted', pattern: /\b(gift|gifted|presented)\b/i },
  { reason: 'sacrificed', pattern: /\b(sacrifice|sacrificed|offer|offered)\b/i },
  { reason: 'dropped', pattern: /\b(drop|dropped|discard|discarded|toss|tossed|throw|threw|throw away|abandon|abandoned|leave behind|left behind|lose|lost)\b/i },
];

const normalizeForMatch = (value: string): string =>
  normalizeText(value, NORM_NAME).toLowerCase();

const detectLossReason = (text: string): ItemLossReason | undefined => {
  for (const entry of LOSS_REASON_PATTERNS) {
    if (entry.pattern.test(text)) {
      return entry.reason;
    }
  }
  return undefined;
};

export const inferItemsLostFromNarrative = (
  content: string,
  inventory: InventoryItem[]
): LostItemMetadata[] => {
  if (!content || inventory.length === 0) {
    return [];
  }

  const normalizedContent = normalizeForMatch(content);
  const reason = detectLossReason(normalizedContent);

  if (!reason) {
    return [];
  }

  return inventory
    .filter((item) => {
      const normalizedName = normalizeForMatch(item.name);
      return normalizedName.length > 1 && normalizedContent.includes(normalizedName);
    })
    .map((item) => ({
      name: item.name,
      quantity: item.stackable ? 1 : item.quantity ?? 1,
      lossReason: reason,
    }));
};
