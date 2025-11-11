/**
 * NarrativeGenerator (Refactored & Optimized)
 *
 * Streamlined narrative generation using:
 * - ContextBuilder: Assembles context from stores
 * - promptEnhancers: Modular prompt enhancement
 * - ResponseProcessor: Parsing, lore, inventory, language enforcement
 *
 * Reduced from ~2000 lines to ~420 lines by extracting focused modules
 * without over-abstracting.
 */

import { AIClient } from './types';
import { NarrativeGenerationRequest, NarrativeGenerationResult, Decision, NarrativeSegment, NarrativeContext } from '@/types/narrative.types';
import { EntityID } from '@/types/common.types';
import { ChoiceGenerator } from './choiceGenerator';
import { TemplateGenerator, WorldTemplate } from './templateGenerator';
import { TemplateGenerationContext } from './templatePrompts';
import { World } from '@/types/world.types';
import { ContextBuilder } from './contextBuilder';
import { ResponseProcessor } from './responseProcessor';
import { narrativeTemplateManager } from '../promptTemplates/narrativeTemplateManager';
import {
  composePrompt,
  DEFAULT_ENHANCERS,
  INITIAL_SCENE_ENHANCERS,
  SKILL_ENHANCERS,
} from './promptEnhancers';
import { inferSegmentType } from '@/lib/utils/segmentTypeInference';
import { safeTrim } from '@/lib/utils';
import { useNPCStore } from '@/state/npcStore';
import { NPC } from '@/types/npc.types';
import { buildPromptDebugInfo, isDebugInfoEnabled, type DebugInfoContext } from './debugInfoBuilder';
import { useWorldStore } from '@/state/worldStore';

export class NarrativeGenerator {
  private choiceGenerator: ChoiceGenerator;
  private templateGenerator: TemplateGenerator;
  private contextBuilder: ContextBuilder;
  private responseProcessor: ResponseProcessor;

  constructor(private geminiClient: AIClient) {
    this.choiceGenerator = new ChoiceGenerator(geminiClient);
    this.templateGenerator = new TemplateGenerator(geminiClient);
    this.contextBuilder = new ContextBuilder();
    this.responseProcessor = new ResponseProcessor(geminiClient);
  }

  /**
   * Generate a narrative segment
   */
  async generateSegment(request: NarrativeGenerationRequest): Promise<NarrativeGenerationResult> {
    try {
      const segmentType = request.generationParameters?.segmentType || 'scene';
      const context = await this.contextBuilder.buildContext(request, segmentType);

      // Get template and compose prompt
      const template = narrativeTemplateManager.getTemplate(`narrative/${segmentType}`);
      const basePrompt = template(this.buildTemplateContext(context));
      const fullyEnhancedPrompt = await composePrompt(basePrompt, context, DEFAULT_ENHANCERS);

      // Call AI
      const response = await this.geminiClient.generateContent(fullyEnhancedPrompt);

      // Parse response
      const parsed = this.responseProcessor.parse(response.content || '');

      // Extract lore (async, don't block)
      if (parsed.content) {
        void this.responseProcessor.updateLore(parsed.content, context.worldId, context.sessionId);
      }

      // Build result
      let result = this.buildResult(parsed.content, parsed.metadata, segmentType, response, context);

      // Enforce language complexity
      result = await this.responseProcessor.enforceLanguageComplexity(result, context.toneSettings);

      // Add debug info if enabled
      if (isDebugInfoEnabled()) {
        result = this.addDebugInfo(result, fullyEnhancedPrompt, context, response);
      }

      // Process items (async, don't block)
      if (
        !request.generationParameters?.disableItemAcquisitionProcessing &&
        result.metadata.itemsAcquired &&
        result.metadata.itemsAcquired.length > 0
      ) {
        const characterId = context.characterIds[0];
        if (characterId && context.sessionId) {
          void this.responseProcessor.processItems(
            result.metadata.itemsAcquired,
            characterId,
            context.sessionId
          );
        }
      }

      // Sync NPC metadata
      this.syncNpcMetadata(context.worldId, result.metadata.characters);

      return result;
    } catch (error) {
      throw new Error('Failed to generate narrative segment');
    }
  }

  /**
   * Generate initial scene for a new game session
   */
  async generateInitialScene(
    worldId: string,
    characterIds: string[],
    sessionId?: string
  ): Promise<NarrativeGenerationResult> {
    try {
      const context = await this.contextBuilder.buildInitialSceneContext(worldId, characterIds, sessionId);

      const template = narrativeTemplateManager.getTemplate('narrative/initialScene');
      const basePrompt = template(this.buildTemplateContext(context));
      const fullyEnhancedPrompt = await composePrompt(basePrompt, context, INITIAL_SCENE_ENHANCERS);

      const response = await this.geminiClient.generateContent(fullyEnhancedPrompt);

      if (response.content) {
        void this.responseProcessor.updateLore(response.content, context.worldId, context.sessionId);
      }

      const parsed = this.responseProcessor.parse(response.content || '');
      let result = this.buildResult(parsed.content, parsed.metadata, 'scene', response, context);

      result = await this.responseProcessor.enforceLanguageComplexity(result, context.toneSettings);

      if (result.metadata.itemsAcquired && result.metadata.itemsAcquired.length > 0) {
        const characterId = characterIds[0];
        if (characterId && sessionId) {
          void this.responseProcessor.processItems(result.metadata.itemsAcquired, characterId, sessionId);
        }
      }

      this.syncNpcMetadata(worldId, result.metadata.characters);

      return result;
    } catch (error) {
      throw new Error('Failed to generate initial scene');
    }
  }

  /**
   * Generate transition between narrative segments
   */
  async generateTransition(
    from: NarrativeSegment,
    to: NarrativeGenerationRequest
  ): Promise<NarrativeGenerationResult> {
    try {
      const { worlds } = useWorldStore.getState();
      const world = worlds[to.worldId];
      if (!world) {
        throw new Error(`World not found: ${to.worldId}`);
      }

      const template = narrativeTemplateManager.getTemplate('narrative/transition');
      const context = {
        previousContent: from.content,
        previousType: from.type,
        worldName: world.name,
        genre: world.genre,
        tone: 'default',
        newLocation: to.narrativeContext?.currentLocation,
      };

      const prompt = template(context);
      const response = await this.geminiClient.generateContent(prompt);

      return {
        content: response.content || '',
        segmentType: 'transition',
        metadata: {
          characterIds: to.characterIds || [],
          location: to.narrativeContext?.currentLocation || 'Unknown',
          mood: 'neutral',
          tags: ['transition'],
        },
        tokenUsage: response.promptTokens || response.completionTokens
          ? {
              promptTokens: response.promptTokens || 0,
              completionTokens: response.completionTokens || 0,
              totalTokens: (response.promptTokens || 0) + (response.completionTokens || 0),
            }
          : undefined,
      };
    } catch (error) {
      throw new Error('Failed to generate transition');
    }
  }

  /**
   * Generate skill acknowledgment narrative
   */
  async generateSkillAcknowledgment(
    worldId: string,
    narrativeContext: NarrativeContext,
    characterIds: string[],
    skillUsed?: {
      skillId: string;
      skillName: string;
      success: boolean;
      difficulty: number;
    },
    customAction?: {
      action: string;
      implicitSkills?: string[];
    }
  ): Promise<NarrativeGenerationResult> {
    try {
      const context = await this.contextBuilder.buildContext(
        { worldId, characterIds, narrativeContext, sessionId: narrativeContext.sessionId },
        'skillAcknowledgment'
      );

      const template = narrativeTemplateManager.getTemplate('narrative/skillAcknowledgment');
      const templateContext = {
        worldName: context.world.name,
        genre: context.world.genre,
        narrativeContext,
        playerCharacterName: (context.playerCharacter as { name?: string })?.name,
        skillUsed,
        customAction,
      };

      const basePrompt = template(templateContext);
      const fullyEnhancedPrompt = await composePrompt(basePrompt, context, SKILL_ENHANCERS);

      const response = await this.geminiClient.generateContent(fullyEnhancedPrompt);

      const parsed = this.responseProcessor.parse(response.content || '');
      let result = this.buildResult(parsed.content, parsed.metadata, 'action', response, context);

      result = await this.responseProcessor.enforceLanguageComplexity(result, context.toneSettings);

      if (result.metadata.itemsAcquired && result.metadata.itemsAcquired.length > 0) {
        const characterId = characterIds[0];
        const sessionId = narrativeContext.sessionId;
        if (characterId && sessionId) {
          void this.responseProcessor.processItems(result.metadata.itemsAcquired, characterId, sessionId);
        }
      }

      return result;
    } catch (error) {
      throw new Error('Failed to generate skill acknowledgment narrative');
    }
  }

  /**
   * Generate player choices
   */
  async generatePlayerChoices(
    worldId: string,
    narrativeContext: NarrativeContext,
    characterIds: string[]
  ): Promise<Decision> {
    try {
      return await this.choiceGenerator.generateChoices({
        worldId,
        narrativeContext,
        characterIds,
        minOptions: 3,
        maxOptions: 4,
        useAlignedChoices: false,
      });
    } catch {
      const fallbackId = `decision-fallback-${Date.now()}`;
      return {
        id: fallbackId,
        prompt: 'What will you do next?',
        options: [
          { id: `option-${fallbackId}-1`, text: 'Investigate further', alignment: 'neutral' },
          { id: `option-${fallbackId}-2`, text: 'Talk to nearby characters', alignment: 'lawful' },
          { id: `option-${fallbackId}-3`, text: 'Move to a new location', alignment: 'neutral' },
        ],
        decisionWeight: 'minor',
        contextSummary: `In ${narrativeContext.currentLocation || 'an unknown location'}, ${narrativeContext.currentSituation || 'making a decision'}.`,
      };
    }
  }

  /**
   * Generate world template using AI
   */
  async generateWorldTemplate(context: TemplateGenerationContext): Promise<WorldTemplate> {
    return this.templateGenerator.generateWorldTemplate(context);
  }

  /**
   * Convert template to world format
   */
  convertTemplateToWorld(template: WorldTemplate): Omit<World, 'id' | 'createdAt' | 'updatedAt'> {
    return this.templateGenerator.convertTemplateToWorld(template);
  }

  // Helper methods

  private buildTemplateContext(context: ReturnType<ContextBuilder['buildContext']> extends Promise<infer T> ? T : never) {
    const playerCharacter = context.playerCharacter as { name?: string; background?: unknown };

    const existingImportant = context.narrativeContext?.importantEntities || [];
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
        (entity) => !existingImportant.some((existing) => existing.id === entity.id && existing.type === entity.type)
      ),
    ];

    const narrativeContextWithRoster = context.narrativeContext
      ? { ...context.narrativeContext, importantEntities: combinedImportant }
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
      characterSkillContext: '',
      worldSkills: Array.isArray(context.world.skills)
        ? context.world.skills.map((skill: unknown) => {
            const s = skill as { id: string; name: string; description: string };
            return {
              id: s.id,
              name: s.name,
              description: s.description,
            };
          })
        : [],
    };
  }

  private buildResult(
    content: string,
    metadata: ReturnType<ResponseProcessor['parse']>['metadata'],
    segmentType: string,
    response: { promptTokens?: number; completionTokens?: number },
    context: ReturnType<ContextBuilder['buildContext']> extends Promise<infer T> ? T : never
  ): NarrativeGenerationResult {
    const fallbackMood = this.getMoodForGenre(context.world.genre);
    const fallbackLocation = this.getLocationForGenre(context.world.genre);

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
        itemsAcquired: metadata.itemsAcquired && metadata.itemsAcquired.length > 0 ? metadata.itemsAcquired : undefined,
        characters: metadata.characters,
      },
      tokenUsage: response.promptTokens || response.completionTokens
        ? {
            promptTokens: response.promptTokens || 0,
            completionTokens: response.completionTokens || 0,
            totalTokens: (response.promptTokens || 0) + (response.completionTokens || 0),
          }
        : undefined,
    };
  }

  private addDebugInfo(
    result: NarrativeGenerationResult,
    fullPrompt: string,
    context: ReturnType<ContextBuilder['buildContext']> extends Promise<infer T> ? T : never,
    response: { promptTokens?: number; completionTokens?: number }
  ): NarrativeGenerationResult {
    const previousSegments = context.narrativeContext?.previousSegments || [];
    const previousSegment = previousSegments[previousSegments.length - 1];

    const debugInfoContext: DebugInfoContext = {
      fullPrompt,
      templateName: this.getTemplateName(context.templateType),
      world: context.world as unknown as DebugInfoContext['world'],
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

  private syncNpcMetadata(worldId: string, characters?: NarrativeGenerationResult['metadata']['characters']) {
    if (!worldId || !characters || characters.length === 0) return;

    try {
      const npcStore = useNPCStore.getState();
      const { getById, createNPC, updateNPC } = npcStore as unknown as {
        getById?: (id: string) => NPC | undefined;
        createNPC?: (npc: Omit<NPC, 'createdAt' | 'updatedAt'> & { id?: string }) => string;
        updateNPC?: (id: string, updates: Partial<NPC>) => void;
      };

      if (typeof getById !== 'function' || typeof createNPC !== 'function' || typeof updateNPC !== 'function') {
        return;
      }

      characters.forEach((character) => {
        if (!character?.id || !character.name) return;

        const id = safeTrim(character.id);
        if (!id) return;

        const existing = getById(id);
        const description = character.description || character.role || 'Supporting character encountered during the narrative.';
        const avatarUrl = character.avatarUrl && safeTrim(character.avatarUrl) ? safeTrim(character.avatarUrl) : undefined;

        if (existing) {
          const updates: Partial<NPC> = {};
          if (character.name && character.name !== existing.name) updates.name = character.name;
          if (description && description !== existing.description) updates.description = description;
          if (avatarUrl && avatarUrl !== existing.avatarUrl) updates.avatarUrl = avatarUrl;
          if (existing.worldId !== worldId) updates.worldId = worldId;
          if (Object.keys(updates).length > 0) updateNPC(id, updates);
        } else {
          createNPC({ id, name: character.name, description, worldId, avatarUrl });
        }
      });
    } catch {
      // NPC sync failures should never break narrative generation
    }
  }

  private normalizeId(id?: string | null): string | undefined {
    if (!id || typeof id !== 'string') return undefined;
    const trimmed = safeTrim(id);
    return trimmed.length > 0 ? trimmed : undefined;
  }

  private normalizeCharacterIds(ids?: unknown): string[] {
    if (!Array.isArray(ids)) return [];

    const seen = new Set<string>();
    const normalized: string[] = [];

    for (const value of ids) {
      if (typeof value !== 'string') continue;
      const normalizedId = this.normalizeId(value);
      if (!normalizedId) continue;
      const canonical = normalizedId.toLowerCase();
      if (seen.has(canonical)) continue;
      seen.add(canonical);
      normalized.push(normalizedId);
    }

    return normalized;
  }

  private getMoodForGenre(genre?: string): 'neutral' | 'tense' | 'mysterious' | 'relaxed' | 'action' | 'emotional' {
    if (!genre) return 'neutral';
    switch (genre.toLowerCase()) {
      case 'horror':
        return 'tense';
      case 'fantasy':
      case 'sci-fi':
      case 'science fiction':
      case 'steampunk':
        return 'mysterious';
      case 'western':
      case 'cyberpunk':
      case 'post-apocalyptic':
        return 'tense';
      default:
        return 'neutral';
    }
  }

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
