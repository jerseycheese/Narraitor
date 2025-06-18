// src/lib/ai/skillDetectionService.ts

export interface SkillInfo {
  id: string;
  name: string;
  description?: string;
}

export interface DetectedSkill {
  skillId: string;
  skillName: string;
  confidence: number;
  reasoning: string;
  suggestedDifficulty: number;
}

export interface SkillDetectionResult {
  detectedSkills: DetectedSkill[];
  error?: string;
}

/**
 * Service for AI-based skill detection from custom player actions
 */
export class SkillDetectionService {
  private static instance: SkillDetectionService;
  private cache = new Map<string, SkillDetectionResult>();
  private readonly cacheTimeout = 5 * 60 * 1000; // 5 minutes

  static getInstance(): SkillDetectionService {
    if (!SkillDetectionService.instance) {
      SkillDetectionService.instance = new SkillDetectionService();
    }
    return SkillDetectionService.instance;
  }

  /**
   * Detect skills required for a custom action using AI
   */
  async detectSkills(
    text: string, 
    availableSkills: SkillInfo[]
  ): Promise<SkillDetectionResult> {
    if (!text.trim()) {
      return { detectedSkills: [] };
    }

    // Check cache first
    const cacheKey = this.getCacheKey(text, availableSkills);
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await fetch('/api/ai/detect-skills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text.trim(),
          availableSkills
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          detectedSkills: [],
          error: errorData.error || `HTTP ${response.status}`
        };
      }

      const result: SkillDetectionResult = await response.json();
      
      // Cache the result
      this.cache.set(cacheKey, result);
      
      // Clear cache after timeout
      setTimeout(() => {
        this.cache.delete(cacheKey);
      }, this.cacheTimeout);

      return result;

    } catch (error) {
      console.error('Skill detection error:', error);
      return {
        detectedSkills: [],
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  /**
   * Generate cache key for text and skills
   */
  private getCacheKey(text: string, skills: SkillInfo[]): string {
    const skillIds = skills.map(s => s.id).sort().join(',');
    return `${text.toLowerCase().trim()}|${skillIds}`;
  }

  /**
   * Clear the cache (useful for testing)
   */
  clearCache(): void {
    this.cache.clear();
  }
}

/**
 * Default export for convenience
 */
export const skillDetectionService = SkillDetectionService.getInstance();