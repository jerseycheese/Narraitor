import type { InventoryItem } from '@/types/inventory.types';
import { estimateTokenCount } from './tokenUtils';
import { safeTrim, truncate } from '@/lib/utils';

const DEFAULT_TOKEN_LIMIT = 180;
const MAX_LISTED_ITEMS = 8;
const DESCRIPTION_LIMIT = 80;

const CATEGORY_PRIORITY: Record<string, number> = {
  'quest-items': 6,
  equipment: 5,
  weapons: 4,
  armor: 4,
  'magical-items': 4,
  tools: 3,
  consumables: 2,
  'currency-valuables': 2,
  valuables: 2,
  documents: 1,
  personal: 1,
  miscellaneous: 0,
};

export interface InventoryContextOptions {
  tokenLimit?: number;
  equippedItemIds?: string[];
}

export interface InventoryContextResult {
  context: string;
  tokenCount: number;
  includedItemIds: string[];
  truncatedCount: number;
}

function getLatestAcquisitionDate(item: InventoryItem): number {
  const history = item.acquisitionHistory;
  if (!history || history.length === 0) {
    return 0;
  }

  const lastRecord = history[history.length - 1];
  const dateValue = new Date(lastRecord.acquiredAt ?? '').getTime();
  return Number.isNaN(dateValue) ? 0 : dateValue;
}

function formatAcquisitionLine(item: InventoryItem): string | null {
  const history = item.acquisitionHistory;
  if (!history || history.length === 0) {
    return null;
  }

  const latest = history[history.length - 1];
  const method = latest.method ? latest.method : null;
  const date = latest.acquiredAt ? latest.acquiredAt.slice(0, 10) : null;
  const quantity = latest.quantity ?? item.quantity;

  const parts: string[] = [];

  if (method) {
    parts.push(`acquired via ${method}`);
  }

  if (date) {
    parts.push(`on ${date}`);
  }

  if (quantity && quantity !== item.quantity) {
    parts.push(`${quantity} in latest acquisition`);
  }

  if (parts.length === 0) {
    return null;
  }

  return parts.join(' ');
}

function formatInventoryLine(
  item: InventoryItem,
  isEquipped: boolean
): string {
  const statusPrefix = isEquipped ? '[Equipped] ' : '';
  const quantityLabel = item.quantity > 1 ? `qty ${item.quantity}` : 'qty 1';
  const categoryLabel = item.categoryId || 'miscellaneous';
  const acquisitionInfo = formatAcquisitionLine(item);
  const description = safeTrim(item.description);

  const metadataParts = [`${categoryLabel}`, quantityLabel];
  if (acquisitionInfo) {
    metadataParts.push(acquisitionInfo);
  }

  let line = `- ${statusPrefix}${item.name} (${metadataParts.join(', ')})`;

  if (description) {
    line += ` — ${truncate(description, DESCRIPTION_LIMIT)}`;
  }

  return line;
}

function computeItemScore(item: InventoryItem, equippedSet: Set<string>): number {
  let score = 0;

  if (equippedSet.has(item.id)) {
    score += 100;
  }

  const categoryScore = CATEGORY_PRIORITY[item.categoryId] ?? 1;
  score += categoryScore * 10;

  const history = item.acquisitionHistory;
  if (history && history.length > 0) {
    const latest = history[history.length - 1];
    const acquiredAt = latest.acquiredAt ? new Date(latest.acquiredAt) : null;
    if (acquiredAt && !Number.isNaN(acquiredAt.getTime())) {
      const hoursSince =
        (Date.now() - acquiredAt.getTime()) / (1000 * 60 * 60);
      if (hoursSince < 24) {
        score += 20;
      } else if (hoursSince < 72) {
        score += 10;
      }
    }
  }

  if (item.quantity === 1) {
    score += 5;
  }

  if (safeTrim(item.description).length > 20) {
    score += 5;
  }

  return score;
}

function sortInventoryItems(
  items: InventoryItem[],
  equippedSet: Set<string>
): InventoryItem[] {
  return [...items].sort((a, b) => {
    const aScore = computeItemScore(a, equippedSet);
    const bScore = computeItemScore(b, equippedSet);
    if (aScore !== bScore) {
      return bScore - aScore;
    }

    const aRecency = getLatestAcquisitionDate(a);
    const bRecency = getLatestAcquisitionDate(b);
    if (aRecency !== bRecency) {
      return bRecency - aRecency;
    }

    if (a.quantity !== b.quantity) {
      return b.quantity - a.quantity;
    }

    return a.name.localeCompare(b.name);
  });
}

export function buildInventoryContext(
  items: InventoryItem[],
  options: InventoryContextOptions = {}
): InventoryContextResult {
  const tokenLimit = options.tokenLimit ?? DEFAULT_TOKEN_LIMIT;
  const equippedIds = new Set(options.equippedItemIds ?? []);
  const sortedItems = sortInventoryItems(items, equippedIds);
  const header = '## Inventory Summary';
  const resultLines: string[] = [];
  const includedIds: string[] = [];

  let tokenCount = estimateTokenCount(header);
  let truncatedCount = 0;

  // Optimistically add items until we hit token limit or max items
  for (let index = 0; index < sortedItems.length; index += 1) {
    const item = sortedItems[index];

    if (includedIds.length >= MAX_LISTED_ITEMS) {
      truncatedCount = sortedItems.length - includedIds.length;
      break;
    }

    const isEquipped = equippedIds.has(item.id);
    const line = formatInventoryLine(item, isEquipped);
    const lineTokens = estimateTokenCount(line);

    // Try adding the item optimistically
    const wouldExceedLimit = tokenCount + lineTokens > tokenLimit;

    // Always include at least one item, even if it exceeds limit slightly
    if (resultLines.length === 0) {
      resultLines.push(line);
      includedIds.push(item.id);
      tokenCount += lineTokens;
      if (wouldExceedLimit && sortedItems.length > 1) {
        truncatedCount = sortedItems.length - 1;
        break;
      }
      continue;
    }

    // For subsequent items, check if adding would exceed limit
    if (wouldExceedLimit) {
      // We need to truncate - figure out how many items remain
      truncatedCount = sortedItems.length - includedIds.length;

      // Build the summary line
      const summaryLine = `+ ${truncatedCount} more items not shown to stay within token limits.`;
      const summaryTokens = estimateTokenCount(summaryLine);

      // Check if summary fits with current items
      if (tokenCount + summaryTokens <= tokenLimit) {
        // Summary fits - we're done
        resultLines.push(summaryLine);
        tokenCount += summaryTokens;
        break;
      }

      // Summary doesn't fit - remove items from end until it does
      while (resultLines.length > 1 && tokenCount + summaryTokens > tokenLimit) {
        const removedLine = resultLines.pop()!;
        const removedId = includedIds.pop()!;
        const removedTokens = estimateTokenCount(removedLine);
        tokenCount -= removedTokens;
        truncatedCount += 1;
      }

      // Update summary with new count and add it
      const finalSummary = `+ ${truncatedCount} more items not shown to stay within token limits.`;
      const finalSummaryTokens = estimateTokenCount(finalSummary);
      resultLines.push(finalSummary);
      tokenCount += finalSummaryTokens;
      break;
    }

    // Item fits without exceeding limit - add it
    resultLines.push(line);
    includedIds.push(item.id);
    tokenCount += lineTokens;
  }

  if (includedIds.length === 0) {
    return {
      context: `${header}\n- No notable inventory items recorded.`,
      tokenCount: estimateTokenCount(`${header}\n- No notable inventory items recorded.`),
      includedItemIds: [],
      truncatedCount: sortedItems.length,
    };
  }

  const context = `${header}\n${resultLines.join('\n')}`;

  return {
    context,
    tokenCount,
    includedItemIds: includedIds,
    truncatedCount,
  };
}
