/**
 * Generation Pipeline
 *
 * Shared pipeline for narrative generation that coordinates:
 * - Template selection
 * - Prompt composition
 * - AI generation
 * - Post-processing (lore extraction, inventory, language enforcement)
 *
 * This replaces the repeated logic in generateSegment, generateInitialScene, etc.
 */

import { AIClient } from './types';
import { NarrativeGenerationContext } from './narrativeGenerationContext';
import { narrativeTemplateManager } from '../promptTemplates/narrativeTemplateManager';
import { PromptComposer } from './promptComposer/PromptComposer';
import { PromptEnhancer } from './promptComposer/types';
import {
  ResponseParser,
  LoreUpdater,
  InventoryManager,
  LanguageComplexityEnforcer,
} from './postProcessing';
import { NarrativeGenerationResult } from '@/types/narrative.types';
import { inferSegmentType } from '@/lib/utils/segmentTypeInference';
import { NarrativeContextGateway } from './narrativeContextGateway';
import { safeTrim } from '@/lib/utils';
import { buildPromptDebugInfo, isDebugInfoEnabled, type DebugInfoContext } from './debugInfoBuilder';

export interface GenerationPipelineOptions {
  /**
   * List of enhancers to apply to the prompt
   */
  enhancers: PromptEnhancer[];

  /**
   * Whether to process item acquisition
   * Default: true
   */
  processItemAcquisition?: boolean;

  /**
   * Whether to extract and store lore
   * Default: true
   */
  extractLore?: boolean;

  /**
   * Whether to enforce language complexity
   * Default: true
   */
  enforceLanguageComplexity?: boolean;

  /**
   * Whether to sync NPC metadata
   * Default: true
   */
  syncNPCMetadata?: boolean;

  /**
   * Override segment type for result
   */
  segmentTypeOverride?: string;
}

export class GenerationPipeline {
  private promptComposer: PromptComposer;
  private responseParser: ResponseParser;
  private loreUpdater: LoreUpdater;
  private inventoryManager: InventoryManager;
  private languageComplexityEnforcer: LanguageComplexityEnforcer;
  private gateway: NarrativeContextGateway;

  constructor(private geminiClient: AIClient) {
    this.promptComposer = new PromptComposer();
    this.responseParser = new ResponseParser();
    this.loreUpdater = new LoreUpdater();
    this.inventoryManager = new InventoryManager();
    this.languageComplexityEnforcer = new LanguageComplexityEnforcer(geminiClient);
    this.gateway = new NarrativeContextGateway();
  }

  /**
   * Run the complete generation pipeline
   */
  async generate(
    context: NarrativeGenerationContext,
    options: GenerationPipelineOptions
  ): Promise<NarrativeGenerationResult> {
    // 1. Get template
    const template = this.getTemplate(context.templateType);
    const basePrompt = template(this.buildTemplateContext(context));

    // 2. Compose prompt with enhancers
    const fullyEnhancedPrompt = await this.promptComposer.compose(
      basePrompt,
      context,
      {
        enhancers: options.enhancers,
        skipFailedEnhancers: true,
      }
    );

    // 3. Call AI
    const response = await this.geminiClient.generateContent(fullyEnhancedPrompt);

    // 4. Parse response
    const parsed = this.responseParser.parse(response.content || '');

    // 5. Extract lore (async, don't block)
    if (options.extractLore !== false && parsed.content) {
      void this.loreUpdater.updateLore(
        parsed.content,
        context.worldId,
        context.sessionId
      );
    }

    // 6. Build initial result
    const segmentType = options.segmentTypeOverride ||
      context.generationParameters?.segmentType ||
      inferSegmentType(parsed.content);

    let result: NarrativeGenerationResult = this.buildResult(
      parsed.content,
      parsed.metadata,
      segmentType,
      response.tokenUsage,
      context
    );

    // 7. Enforce language complexity
    if (options.enforceLanguageComplexity !== false) {
      result = await this.languageComplexityEnforcer.enforce(
        result,
        context.toneSettings
      );
    }

    // 8. Add debug info if enabled
    if (isDebugInfoEnabled()) {
      result = this.addDebugInfo(
        result,
        fullyEnhancedPrompt,
        context,
        response.tokenUsage
      );
    }

    // 9. Process item acquisition (async, don't block)
    if (
      options.processItemAcquisition !== false &&
      result.metadata.itemsAcquired &&
      result.metadata.itemsAcquired.length > 0
    ) {
      const characterId = context.characterIds[0];
      if (characterId && context.sessionId) {
        void this.inventoryManager.processAcquiredItems(
          result.metadata.itemsAcquired,
          characterId,
          context.sessionId
        );
      }
    }

    // 10. Sync NPC metadata
    if (options.syncNPCMetadata !== false) {
      this.syncNpcMetadata(context.worldId, result.metadata.characters);
    }

    return result;
  }

  /**
   * Get template by type
   */
  private getTemplate(templateType: string) {
    const templateKey = `narrative/${templateType}`;
    return narrativeTemplateManager.getTemplate(templateKey);
  }

  /**
   * Build template context from generation context
   */
  private buildTemplateContext(context: NarrativeGenerationContext) {
    const playerCharacter = context.playerCharacter;

    // Merge NPC roster into importantEntities if narrativeContext exists
    const existingImportant =
      context.narrativeContext?.importantEntities || [];
    const rosterEntities = context.npcRoster.map((npc) => ({
      id: npc.id,
      type: 'npc',
      name: npc.name,
      description: npc.description,
      avatarUrl: npc.avatarUrl,
    }));

    const combinedImportant = [
      ...existingImportant,
      ...rosterEntities.filter(
        (entity) =>
          !existingImportant.some(
            (existing) =>
              existing.id === entity.id && existing.type === entity.type
          )
      ),
    ];

    const narrativeContextWithRoster = context.narrativeContext
      ? {
          ...context.narrativeContext,
          importantEntities: combinedImportant,
        }
      : undefined;

    return {
      worldName: context.world.name,
      worldDescription: context.world.description,
      genre: context.world.genre,
      tone: context.toneSettings.narrativeStyle,
      attributes: context.world.attributes,
      characterIds: context.characterIds,
      playerCharacterName: playerCharacter?.name,
      playerCharacterBackground: playerCharacter?.background,
      sessionId: context.sessionId,
      narrativeContext: narrativeContextWithRoster,
      generationParameters: context.generationParameters,
      toneSettings: context.toneSettings,
      npcRoster: context.npcRoster,
      characterSkillContext: '', // Not exposed to AI
      worldSkills:
        context.world.skills?.map((skill) => ({
          id: skill.id,
          name: skill.name,
          description: skill.description,
        })) || [],
    };
  }

  /**
   * Build result from parsed response
   */
  private buildResult(
    content: string,
    metadata: ReturnType<ResponseParser['parse']>['metadata'],
    segmentType: string,
    tokenUsage: number | undefined,
    context: NarrativeGenerationContext
  ): NarrativeGenerationResult {
    // Fallback values based on genre
    const fallbackMood = this.getMoodForGenre(context.world.genre);
    const fallbackLocation = this.getLocationForGenre(context.world.genre);

    // Normalize IDs
    const speakerId = this.normalizeId(metadata.speakerId);
    const characterIds = this.normalizeCharacterIds(metadata.characterIds);
    const finalCharacterIds = speakerId && !characterIds.includes(speakerId)
      ? [...characterIds, speakerId]
      : characterIds;

    return {
      content,
      segmentType: segmentType as 'scene' | 'dialogue' | 'action' | 'transition',
      metadata: {
        characterIds: finalCharacterIds,
        speakerId,
        location: metadata.location || fallbackLocation,
        mood: metadata.mood || fallbackMood,
        tags: metadata.tags || [context.world.genre || 'fantasy', 'narrative'],
        itemsAcquired:
          metadata.itemsAcquired && metadata.itemsAcquired.length > 0
            ? metadata.itemsAcquired
            : undefined,
        characters: metadata.characters,
      },
      tokenUsage:
        tokenUsage && typeof tokenUsage === 'object'
          ? tokenUsage
          : tokenUsage
            ? {
                promptTokens: 0,
                completionTokens: 0,
                totalTokens: tokenUsage as number,
              }
            : undefined,
    };
  }

  /**
   * Add debug info to result
   */
  private addDebugInfo(
    result: NarrativeGenerationResult,
    fullPrompt: string,
    context: NarrativeGenerationContext,
    tokenUsage: number | undefined
  ): NarrativeGenerationResult {
    const previousSegments = context.narrativeContext?.previousSegments || [];
    const previousSegment = previousSegments[previousSegments.length - 1];

    const debugInfoContext: DebugInfoContext = {
      fullPrompt,
      templateName: this.getTemplateName(context.templateType),
      world: context.world,
      toneSettings: context.toneSettings,
      loreContext: context.loreContext,
      characterIds: context.characterIds,
      previousSegmentContent: previousSegment?.content,
      previousSegmentType: previousSegment?.type,
      tokenUsage: result.tokenUsage,
      modelUsed: 'gemini-2.0-flash',
    };

    return {
      ...result,
      metadata: {
        ...result.metadata,
        debugInfo: buildPromptDebugInfo(debugInfoContext),
      },
    };
  }

  /**
   * Get template name for debug info
   */
  private getTemplateName(segmentType: string): string {
    const names: Record<string, string> = {
      scene: 'Scene Template',
      dialogue: 'Dialogue Template',
      action: 'Action Template',
      transition: 'Transition Template',
      initialScene: 'Initial Scene Template',
      skillAcknowledgment: 'Skill Acknowledgment Template',
    };
    return names[segmentType] || 'Unknown Template';
  }

  /**
   * Sync NPC metadata
   */
  private syncNpcMetadata(
    worldId: string,
    characters?: NarrativeGenerationResult['metadata']['characters']
  ) {
    if (!worldId || !characters || characters.length === 0) {
      return;
    }

    try {
      characters.forEach((character) => {
        if (!character?.id || !character.name) {
          return;
        }

        const id = safeTrim(character.id);
        if (!id) return;

        const description =
          character.description ||
          character.role ||
          'Supporting character encountered during the narrative.';

        const avatarUrl = character.avatarUrl && safeTrim(character.avatarUrl)
          ? safeTrim(character.avatarUrl)
          : undefined;

        this.gateway.syncNPC(id, {
          name: character.name,
          description,
          worldId,
          avatarUrl,
        });
      });
    } catch {
      // NPC synchronization failures should never break narrative generation
    }
  }

  /**
   * Normalize ID
   */
  private normalizeId(id?: string | null): string | undefined {
    if (!id || typeof id !== 'string') {
      return undefined;
    }

    const trimmed = safeTrim(id);
    return trimmed.length > 0 ? trimmed : undefined;
  }

  /**
   * Normalize character IDs
   */
  private normalizeCharacterIds(ids?: unknown): string[] {
    if (!Array.isArray(ids)) {
      return [];
    }

    const seen = new Set<string>();
    const normalized: string[] = [];

    for (const value of ids) {
      if (typeof value !== 'string') {
        continue;
      }

      const normalizedId = this.normalizeId(value);
      if (!normalizedId) {
        continue;
      }

      const canonical = normalizedId.toLowerCase();
      if (seen.has(canonical)) {
        continue;
      }

      seen.add(canonical);
      normalized.push(normalizedId);
    }

    return normalized;
  }

  /**
   * Get mood for genre
   */
  private getMoodForGenre(
    genre?: string
  ): 'neutral' | 'tense' | 'mysterious' | 'relaxed' | 'action' | 'emotional' {
    if (!genre) return 'neutral';

    switch (genre.toLowerCase()) {
      case 'horror':
        return 'tense';
      case 'fantasy':
        return 'mysterious';
      case 'sci-fi':
      case 'science fiction':
        return 'mysterious';
      case 'western':
        return 'tense';
      case 'cyberpunk':
        return 'tense';
      case 'post-apocalyptic':
        return 'tense';
      case 'steampunk':
        return 'mysterious';
      default:
        return 'neutral';
    }
  }

  /**
   * Get location for genre
   */
  private getLocationForGenre(genre?: string): string {
    if (!genre) return 'Starting Location';

    switch (genre.toLowerCase()) {
      case 'fantasy':
        return 'Enchanted Forest';
      case 'sci-fi':
      case 'science fiction':
        return 'Space Station';
      case 'western':
        return 'Frontier Town';
      case 'horror':
        return 'Abandoned Mansion';
      case 'cyberpunk':
        return 'Neon City';
      case 'post-apocalyptic':
        return 'Ruins';
      case 'steampunk':
        return 'Victorian Metropolis';
      default:
        return 'Starting Location';
    }
  }
}
