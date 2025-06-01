import { NarrativeSegment } from '@/types/narrative.types';

interface PrioritizedElement {
  type: string;
  content: string;
  priority: number;
}

export class NarrativeContextManager {
  private segments: NarrativeSegment[] = [];
  private maxSegments: number = 10;

  addSegment(segment: NarrativeSegment): void {
    this.segments.push(segment);
    
    // Keep only recent segments
    if (this.segments.length > this.maxSegments) {
      this.segments.shift();
    }
  }

  getOptimizedContext(maxTokens: number): string {
    if (this.segments.length === 0) {
      return '';
    }

    // Simple token estimation: 1 token ≈ 4 characters
    const estimateTokens = (text: string) => Math.ceil(text.length / 4);
    
    const contextParts: string[] = [];
    let currentTokens = 0;
    
    // Add segments from most recent to oldest
    for (let i = this.segments.length - 1; i >= 0; i--) {
      const segment = this.segments[i];
      const segmentText = `[${segment.type}] ${segment.content}`;
      const segmentTokens = estimateTokens(segmentText);
      
      if (currentTokens + segmentTokens <= maxTokens) {
        contextParts.unshift(segmentText);
        currentTokens += segmentTokens;
      } else {
        break;
      }
    }
    
    return contextParts.join('\n\n');
  }

  getPrioritizedElements(): PrioritizedElement[] {
    const elements: PrioritizedElement[] = [];
    
    this.segments.forEach((segment) => {
      // Calculate priority based on various factors
      let priority = 1;
      
      // Recent segments have higher priority
      const index = this.segments.indexOf(segment);
      priority += (index / this.segments.length) * 5;
      
      // Plot-critical tags increase priority
      if (segment.metadata?.tags?.includes('plot-critical')) {
        priority += 10;
      }
      
      // Main character mentions increase priority
      if (segment.metadata?.characterIds?.includes('main-char')) {
        priority += 5;
      }
      
      elements.push({
        type: segment.type,
        content: segment.content,
        priority
      });
    });
    
    return elements.sort((a, b) => b.priority - a.priority);
  }

  clear(): void {
    this.segments = [];
  }
}