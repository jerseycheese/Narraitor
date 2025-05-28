import { NarrativeContext } from '@/types/narrative.types';
import { World } from '@/types/world.types';
import { FallbackContent, ContentSelectionCriteria } from './types';
import { ContentSelector } from './ContentSelector';
import { fallbackContentRepository } from './content';

export class FallbackContentManager {
  private contentSelector: ContentSelector;
  private recentlyUsedIds: Set<string>;
  private maxHistorySize = 10;

  constructor() {
    this.contentSelector = new ContentSelector();
    this.recentlyUsedIds = new Set();
  }

  /**
   * Get appropriate fallback content based on context
   */
  getContent(
    type: string,
    context: NarrativeContext,
    world: World
  ): FallbackContent | null {
    const criteria: ContentSelectionCriteria = {
      type,
      theme: world.theme,
      tags: context.currentTags || [],
      segmentCount: context.previousSegments?.length || 0,
      recentlyUsedIds: Array.from(this.recentlyUsedIds)
    };

    const content = this.contentSelector.selectContent(
      fallbackContentRepository,
      criteria
    );

    if (content) {
      this.addToHistory(content.id);
    }

    return content;
  }

  /**
   * Check if content exists for a theme
   */
  hasContent(theme: string): boolean {
    return fallbackContentRepository.some(content => 
      content.themes.includes(theme)
    );
  }

  /**
   * Get count of available content for theme and type
   */
  getContentCount(theme: string, type: string): number {
    return fallbackContentRepository.filter(content =>
      content.themes.includes(theme) && content.type === type
    ).length;
  }

  /**
   * Clear usage history
   */
  clearUsageHistory(): void {
    this.recentlyUsedIds.clear();
  }

  /**
   * Add content ID to usage history
   */
  private addToHistory(id: string): void {
    this.recentlyUsedIds.add(id);
    
    // Maintain max history size
    if (this.recentlyUsedIds.size > this.maxHistorySize) {
      const firstId = this.recentlyUsedIds.values().next().value;
      if (firstId !== undefined) {
        this.recentlyUsedIds.delete(firstId);
      }
    }
  }
}