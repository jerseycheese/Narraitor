import { FallbackContent, ContentSelectionCriteria } from './types';

export class ContentSelector {
  /**
   * Select the most appropriate content based on criteria
   */
  selectContent(
    contentPool: FallbackContent[],
    criteria: ContentSelectionCriteria
  ): FallbackContent | null {
    // Filter by type and theme
    let candidates = contentPool.filter(content =>
      content.type === criteria.type &&
      content.themes.includes(criteria.theme) &&
      !criteria.recentlyUsedIds.includes(content.id)
    );

    // Filter by requirements
    candidates = candidates.filter(content =>
      this.meetsRequirements(content, criteria.tags, criteria.segmentCount)
    );

    if (candidates.length === 0) {
      return null;
    }

    // Score and sort candidates
    const scored = candidates.map(content => ({
      content,
      score: this.scoreContent(content, criteria.tags)
    }));

    scored.sort((a, b) => b.score - a.score);

    // Select using weighted random from top candidates
    const topCandidates = this.getTopCandidates(scored);
    return this.weightedRandomSelect(topCandidates);
  }

  /**
   * Check if content meets all requirements
   */
  meetsRequirements(
    content: FallbackContent,
    contextTags: string[],
    segmentCount: number
  ): boolean {
    if (!content.requirements) {
      return true;
    }

    const { includeTags, excludeTags, minSegments, maxSegments } = content.requirements;

    // Check include tags - must have ALL
    if (includeTags && !includeTags.every(tag => contextTags.includes(tag))) {
      return false;
    }

    // Check exclude tags - must NOT have ANY
    if (excludeTags && excludeTags.some(tag => contextTags.includes(tag))) {
      return false;
    }

    // Check segment count
    if (minSegments !== undefined && segmentCount < minSegments) {
      return false;
    }

    if (maxSegments !== undefined && segmentCount > maxSegments) {
      return false;
    }

    return true;
  }

  /**
   * Score content based on tag matches
   */
  scoreContent(content: FallbackContent, contextTags: string[]): number {
    let score = 0;

    // Each matching tag adds to score
    content.tags.forEach(tag => {
      if (contextTags.includes(tag)) {
        score += 10;
      }
    });

    // Bonus for exact tag set match
    if (content.tags.length === contextTags.length && 
        content.tags.every(tag => contextTags.includes(tag))) {
      score += 20;
    }

    return score;
  }

  /**
   * Get top candidates based on score
   */
  private getTopCandidates(
    scored: Array<{ content: FallbackContent; score: number }>
  ): FallbackContent[] {
    if (scored.length === 0) return [];

    const topScore = scored[0].score;
    const threshold = topScore * 0.8; // Within 80% of top score

    return scored
      .filter(item => item.score >= threshold)
      .map(item => item.content);
  }

  /**
   * Select content using weighted random selection
   */
  private weightedRandomSelect(candidates: FallbackContent[]): FallbackContent {
    if (candidates.length === 1) {
      return candidates[0];
    }

    // Calculate total weight
    const totalWeight = candidates.reduce(
      (sum, content) => sum + (content.weight || 1),
      0
    );

    // Random selection
    let random = Math.random() * totalWeight;
    
    for (const content of candidates) {
      random -= (content.weight || 1);
      if (random <= 0) {
        return content;
      }
    }

    // Fallback to first candidate
    return candidates[0];
  }
}