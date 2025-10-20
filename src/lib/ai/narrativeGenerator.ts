import { AIClient } from './types';
import { narrativeTemplateManager } from '../promptTemplates/narrativeTemplateManager';
import { useWorldStore } from '@/state/worldStore';
import { useCharacterStore } from '@/state/characterStore';
import { useAiContextStore } from '@/state/aiContextStore';
import { useInventoryStore } from '@/state/inventoryStore';
import { useNPCStore } from '@/state/npcStore';
import {
  Decision,
  NarrativeContext,
  NarrativeGenerationRequest,
  NarrativeGenerationResult,
  NarrativeSegment,
  GeneratedCharacterMetadata,
} from '@/types/narrative.types';
import { World } from '@/types/world.types';
import { EntityID } from '@/types/common.types';
import { ChoiceGenerator } from './choiceGenerator';
import { getLoreContextForPrompt } from './loreContextHelper';
import { extractStructuredLore } from './structuredLoreExtractor';
import { DEFAULT_TONE_SETTINGS } from '@/types/tone-settings.types';
import { getDetailedToneInstructions } from './toneSettingsGuidance';
import { TemplateGenerator, WorldTemplate } from './templateGenerator';
import { TemplateGenerationContext } from './templatePrompts';
import { PersonalizationEngine } from './personalizationEngine';
import { playerDecisionTracker } from './playerDecisionTracker';
import { CharacterGoal } from '@/types/personalization.types';
import { buildInventoryContext } from '@/lib/promptContext/inventoryContextBuilder';
import { safeTrim } from '@/lib/utils';
import { normalizeText, NORM_DESC } from '@/lib/utils/textNormalization';
import { processAcquiredItems } from '@/lib/narrative/itemAcquisitionProcessor';
import type { AcquiredItemMetadata } from '@/types/narrative.types';
import type { InventoryAcquisitionMethod } from '@/types/inventory.types';
import { NPC } from '@/types/npc.types';

export class NarrativeGenerator {
  private choiceGenerator: ChoiceGenerator;
  private templateGenerator: TemplateGenerator;
  private personalizationEngine: PersonalizationEngine;

  constructor(private geminiClient: AIClient) {
    this.choiceGenerator = new ChoiceGenerator(geminiClient);
    this.templateGenerator = new TemplateGenerator(geminiClient);
    this.personalizationEngine = new PersonalizationEngine();
  }

  /**
   * Enhances a prompt with lore context for the given world
   */
  private enhancePromptWithLore(prompt: string, worldId: EntityID): string {
    const loreContext = getLoreContextForPrompt(worldId);
    return prompt + loreContext;
  }

  /**
   * Enhances a prompt with goal context from the AI context store
   */
  private enhancePromptWithGoalContext(
    prompt: string,
    sessionId?: string
  ): string {
    if (!sessionId) return prompt;

    try {
      const aiContext = useAiContextStore
        .getState()
        .buildContextForSession(sessionId);

      if (aiContext.goalContext && safeTrim(aiContext.goalContext)) {
        return `${prompt}\n\nCURRENT NARRATIVE GOALS:\n${aiContext.goalContext}\n\nPlease consider these goals when generating the narrative content.`;
      }

      return prompt;
    } catch {
      return prompt;
    }
  }

  /**
   * Enhances a prompt with detailed tone settings for consistent narrative style
   */
  private enhancePromptWithToneSettings(prompt: string, world: World): string {
    const toneSettings = world.toneSettings || DEFAULT_TONE_SETTINGS;

    const detailedInstructions = getDetailedToneInstructions(
      toneSettings.contentRating,
      toneSettings.narrativeStyle,
      toneSettings.languageComplexity,
      toneSettings.customInstructions
    );

    return prompt + detailedInstructions;
  }

  /**
   * Extract session ID from decisions for goal context
   */
  private extractSessionId(
    decisions: Array<{ sessionId?: string }>
  ): string | null {
    // Try to find a session ID from the decision history
    for (const decision of decisions) {
      if (decision.sessionId) {
        return decision.sessionId;
      }
    }
    return null;
  }

  /**
   * Convert NarrativeGoal to CharacterGoal for personalization engine
   */
  private convertToCharacterGoals(
    narrativeGoals: Array<Record<string, unknown>>
  ): CharacterGoal[] {
    return narrativeGoals.map((goal) => ({
      id: goal.id as string,
      description: (goal.description || goal.title) as string,
      priority: this.mapGoalPriority(goal.priority as string),
      progress: this.calculateGoalProgress(goal),
      establishedAt: goal.createdAt as string,
      isActive: goal.status === 'active',
    }));
  }

  /**
   * Map goal priority from NarrativeGoal to CharacterGoal format
   */
  private mapGoalPriority(priority: string): 'primary' | 'secondary' | 'minor' {
    switch (priority) {
      case 'critical':
      case 'high':
        return 'primary';
      case 'medium':
        return 'secondary';
      case 'low':
      default:
        return 'minor';
    }
  }

  /**
   * Calculate goal progress based on completion status and mention count
   */
  private calculateGoalProgress(goal: Record<string, unknown>): number {
    if (goal.status === 'completed') return 100;
    if (goal.status === 'abandoned') return 0;

    // Estimate progress based on mention count (more mentions = more progress)
    const mentionCount = Number(goal.mentionCount) || 0;
    if (mentionCount === 0) return 0;
    if (mentionCount >= 10) return 80; // High activity suggests near completion
    if (mentionCount >= 5) return 60;
    if (mentionCount >= 3) return 40;
    return 20; // Some progress made
  }

  /**
   * Converts store character to personalization-compatible character
   */
  private convertToPersonalizationCharacter(storeCharacter: unknown): {
    id: string;
    name: string;
    background: string;
    attributes:
      | Record<string, number>
      | Array<{ attributeId: string; value: number }>;
    skills:
      | Array<{ name: string; level: number; worldSkillId?: string }>
      | Array<{ skillId: string; level: number }>;
    createdAt: string;
    updatedAt: string;
  } {
    // Create a character object compatible with PersonalizationEngine
    // This handles the type mismatch between store Character and PersonalizationEngine Character
    const char = storeCharacter as Record<string, unknown>;
    return {
      id: String(char.id || ''),
      name: String(char.name || ''),
      background:
        (char.background as { summary?: string })?.summary ||
        String(char.background || ''),
      attributes: (char.attributes as Record<string, number>) || {},
      skills:
        (char.skills as Array<{
          name: string;
          level: number;
          worldSkillId?: string;
        }>) || [],
      createdAt: String(char.createdAt || ''),
      updatedAt: String(char.updatedAt || ''),
    };
  }

  /**
   * Build a roster of NPCs for the given world so the AI can reference
   * consistent identifiers when populating metadata.characterIds.
   */
  private buildNpcRoster(worldId: string): Array<{
    id: string;
    name: string;
    description?: string;
    avatarUrl?: string;
  }> {
    try {
      const npcState = useNPCStore.getState();
      if (!npcState || typeof npcState.getNPCsByWorld !== 'function') {
        return [];
      }

      const npcs = npcState.getNPCsByWorld(worldId) || [];
      return npcs.map((npc) => ({
        id: npc.id,
        name: npc.name,
        description: npc.description || undefined,
        avatarUrl: npc.avatarUrl || undefined,
      }));
    } catch {
      return [];
    }
  }

  /**
   * Enhances a prompt with personalized character context
   */
  private enhancePromptWithPersonalization(
    prompt: string,
    worldId: EntityID,
    characterIds: string[]
  ): string {
    try {
      const world = this.getWorld(worldId);
      const { characters } = useCharacterStore.getState();
      const playerCharacterId = characterIds[0];
      const storeCharacter = playerCharacterId
        ? characters[playerCharacterId]
        : null;

      if (!storeCharacter) {
        return prompt;
      }

      // Convert store character to personalization-compatible format
      const playerCharacter =
        this.convertToPersonalizationCharacter(storeCharacter);

      // Get player decisions for this world
      const decisions = playerDecisionTracker.getWorldDecisions(worldId);

      // Create personalized context
      // Get goals from AI context store
      const sessionId = this.extractSessionId(decisions);
      const aiContext = sessionId
        ? useAiContextStore.getState().buildContextForSession(sessionId)
        : null;
      const narrativeGoals = aiContext?.activeGoals || [];
      const characterGoals = this.convertToCharacterGoals(
        narrativeGoals as unknown as Array<Record<string, unknown>>
      );

      const personalizedContext =
        this.personalizationEngine.createPersonalizedContext(
          playerCharacter,
          world,
          decisions,
          [], // relationships - future enhancement
          characterGoals, // converted goals for personalization engine
          [] // narrative history - future enhancement
        );

      // Generate enhancement text
      const enhancementText =
        this.personalizationEngine.generateNarrativeEnhancement(
          personalizedContext
        );

      if (safeTrim(enhancementText)) {
        return `${prompt}\n\n${enhancementText}`;
      }

      return prompt;
    } catch {
      return prompt;
    }
  }

  /**
   * Enhances a prompt with character inventory context
   * Includes narratively significant items to help AI reference them naturally
   */
  private enhancePromptWithInventory(
    prompt: string,
    characterIds: string[]
  ): string {
    try {
      if (!characterIds || characterIds.length === 0) {
        return prompt;
      }

      const characterId = characterIds[0]; // Focus on player character
      const { getCharacterItems } = useInventoryStore.getState();
      const items = getCharacterItems(characterId);

      if (!items || items.length === 0) {
        return prompt;
      }

      const equippedItemIds = this.getEquippedItemIds(characterIds);
      const { context: inventorySection } = buildInventoryContext(items, {
        equippedItemIds,
      });

      if (!inventorySection) {
        return prompt;
      }

      const guidance =
        'When generating narrative, naturally reference these items only if they matter to the current situation. Avoid forced mentions or repetitive callbacks.';

      return `${prompt}\n\n${inventorySection}\n\n${guidance}`;
    } catch {
      // If anything fails, return original prompt
      return prompt;
    }
  }

  /**
   * Enhances a prompt with item acquisition instructions for the AI
   * Instructs the AI to return structured item data when describing acquisition
   */
  private enhancePromptWithItemAcquisitionInstructions(prompt: string): string {
    const acquisitionInstructions = `

ITEM ACQUISITION INSTRUCTIONS:
Only include entries in metadata.itemsAcquired when the player character ends the scene with a new, portable item in their ongoing possession (something they could realistically carry to the next location). Merely noticing, interacting with, or temporarily using environmental objects or stage dressing does NOT count as acquisition. If the character sets an object back down, leaves it behind, or otherwise does not keep it, do not add it. Likewise, if the narrative merely clarifies or renames an item the character already had, update the prose, not the metadata.

Each acquired item should include:
- name: The item's name (required)
- description: Brief description of the item (optional but recommended)
- quantity: Number of items acquired (default: 1)
- acquisitionMethod: How the item was acquired - one of: "loot", "quest", "purchase", "craft", "reward", "gift", "manual", "unknown"

Examples:
- Character finds a sword: Include {name: "Ancient Sword", description: "A blade from ages past", quantity: 1, acquisitionMethod: "loot"}
- Character buys 3 potions: Include {name: "Healing Potion", description: "Restores health", quantity: 3, acquisitionMethod: "purchase"}
- Character receives a key as reward: Include {name: "Iron Key", description: "Opens the eastern gate", quantity: 1, acquisitionMethod: "reward"}

Important:
- Only include items the character ACTUALLY ACQUIRES AND KEEPS during this segment (not items they merely see, borrow momentarily, use as environmental tools, or were already carrying)
- Avoid duplicate entries for the same object; use the description to capture clarifications or additional detail
- Be specific with item names and descriptions
- Use an appropriate acquisitionMethod for the narrative context
- If the narrative mentions vague supplies, still include the best concrete description you can infer

The items will be automatically added to the character's inventory with proper categorization and journal entries.`;

    return prompt + acquisitionInstructions;
  }

  private getEquippedItemIds(characterIds: string[] | undefined): string[] {
    if (!characterIds || characterIds.length === 0) {
      return [];
    }

    try {
      const { characters } = useCharacterStore.getState();
      const playerCharacter = characters[characterIds[0]];
      const inventoryItems =
        (playerCharacter?.inventory?.items as Array<{ id: string; equipped?: boolean }>) ?? [];

      return inventoryItems
        .filter((item) => item?.equipped)
        .map((item) => item.id);
    } catch {
      return [];
    }
  }

  async generateSegment(
    request: NarrativeGenerationRequest
  ): Promise<NarrativeGenerationResult> {
    try {
      const world = this.getWorld(request.worldId);
      const template = this.getTemplate(
        request.generationParameters?.segmentType || 'scene'
      );

      const context = this.buildContext(world, request);
      const prompt = template(context);

      // Add tone settings, lore context, goal context, personalization, inventory, and item acquisition instructions to prompt
      const toneEnhancedPrompt = this.enhancePromptWithToneSettings(
        prompt,
        world
      );
      const loreEnhancedPrompt = this.enhancePromptWithLore(
        toneEnhancedPrompt,
        request.worldId
      );
      const goalEnhancedPrompt = this.enhancePromptWithGoalContext(
        loreEnhancedPrompt,
        request.sessionId
      );
      const personalizedPrompt = this.enhancePromptWithPersonalization(
        goalEnhancedPrompt,
        request.worldId,
        request.characterIds || []
      );
      const inventoryEnhancedPrompt = this.enhancePromptWithInventory(
        personalizedPrompt,
        request.characterIds || []
      );
      const fullyEnhancedPrompt = this.enhancePromptWithItemAcquisitionInstructions(
        inventoryEnhancedPrompt
      );

      const response =
        await this.geminiClient.generateContent(fullyEnhancedPrompt);

      // Extract structured lore from generated narrative
      if (response.content) {
        try {
          const existingLoreContext = getLoreContextForPrompt(request.worldId);
          const structuredLore = await extractStructuredLore(
            response.content,
            existingLoreContext
          );

          // Import lore store dynamically to avoid circular dependency
          const { useLoreStore } = await import('@/state/loreStore');
          const { addStructuredLore } = useLoreStore.getState();
          addStructuredLore(structuredLore, request.worldId, request.sessionId);
        } catch {
          // Failed to extract lore - continue without it
        }
      }

      const result = await this.formatResponse(
        response,
        request.generationParameters?.segmentType || 'scene'
      );

      // Process any acquired items from the narrative
      if (
        !request.generationParameters?.disableItemAcquisitionProcessing &&
        result.metadata.itemsAcquired &&
        result.metadata.itemsAcquired.length > 0
      ) {
        const characterId = request.characterIds?.[0];
        if (characterId && request.sessionId) {
          // Process items asynchronously - don't block narrative generation
          void processAcquiredItems(
            result.metadata.itemsAcquired,
            characterId,
            request.sessionId
          );
        }
      }

      this.syncNpcMetadata(request.worldId, result.metadata.characters);

      return result;
    } catch {
      throw new Error('Failed to generate narrative segment');
    }
  }

  async generateInitialScene(
    worldId: string,
    characterIds: string[],
    sessionId?: string
  ): Promise<NarrativeGenerationResult> {
    try {
      const world = this.getWorld(worldId);
      const template = this.getTemplate('initialScene');

      // Get character details
      const { characters } = useCharacterStore.getState();
      const playerCharacterId = characterIds[0]; // First character is the player
      const storeCharacter = playerCharacterId
        ? characters[playerCharacterId]
        : null;
      const playerCharacter = storeCharacter
        ? this.convertToPersonalizationCharacter(storeCharacter)
        : null;

      const toneSettings = world.toneSettings || DEFAULT_TONE_SETTINGS;

      const npcRoster = this.buildNpcRoster(world.id);

      const context = {
        worldName: world.name,
        worldDescription: world.description,
        genre: world.genre,
        tone: toneSettings.narrativeStyle,
        attributes: world.attributes,
        characterIds,
        playerCharacterName: playerCharacter?.name,
        playerCharacterBackground: playerCharacter?.background,
        toneSettings: toneSettings,
        npcRoster,
      };

      const prompt = template(context);

      // Add tone settings, lore context, personalization, inventory, and item acquisition instructions to initial scene
      const toneEnhancedPrompt = this.enhancePromptWithToneSettings(
        prompt,
        world
      );
      const loreEnhancedPrompt = this.enhancePromptWithLore(
        toneEnhancedPrompt,
        worldId
      );
      const personalizedPrompt = this.enhancePromptWithPersonalization(
        loreEnhancedPrompt,
        worldId,
        characterIds
      );
      const inventoryEnhancedPrompt = this.enhancePromptWithInventory(
        personalizedPrompt,
        characterIds
      );
      const fullyEnhancedPrompt = this.enhancePromptWithItemAcquisitionInstructions(
        inventoryEnhancedPrompt
      );

      const response =
        await this.geminiClient.generateContent(fullyEnhancedPrompt);

      // Extract structured lore from initial scene
      if (response.content) {
        try {
          const existingLoreContext = getLoreContextForPrompt(worldId);
          const structuredLore = await extractStructuredLore(
            response.content,
            existingLoreContext
          );

          // Import lore store dynamically to avoid circular dependency
          const { useLoreStore } = await import('@/state/loreStore');
          const { addStructuredLore } = useLoreStore.getState();
          addStructuredLore(structuredLore, worldId, sessionId);
        } catch {
          // Failed to extract lore - continue without it
        }
      }

      const result = await this.formatResponse(response, 'scene');

      // Process any acquired items from the initial scene
      if (result.metadata.itemsAcquired && result.metadata.itemsAcquired.length > 0) {
        const characterId = characterIds[0];
        if (characterId && sessionId) {
          // Process items asynchronously - don't block narrative generation
          void processAcquiredItems(
            result.metadata.itemsAcquired,
            characterId,
            sessionId
          );
        }
      }

      this.syncNpcMetadata(worldId, result.metadata.characters);

      return result;
    } catch {
      throw new Error('Failed to generate initial scene');
    }
  }

  async generateTransition(
    from: NarrativeSegment,
    to: NarrativeGenerationRequest
  ): Promise<NarrativeGenerationResult> {
    const world = this.getWorld(to.worldId);
    const template = this.getTemplate('transition');

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

    const result = await this.formatResponse(response, 'transition');
    this.syncNpcMetadata(to.worldId, result.metadata.characters);
    return result;
  }

  private getWorld(worldId: string): World {
    const { worlds } = useWorldStore.getState();
    const world = worlds[worldId];

    if (!world) {
      throw new Error(`World not found: ${worldId}`);
    }

    return world;
  }

  private getTemplate(segmentType: string) {
    const templateKey = `narrative/${segmentType}`;
    return narrativeTemplateManager.getTemplate(templateKey);
  }

  private buildContext(world: World, request: NarrativeGenerationRequest) {
    // Get character details
    const { characters } = useCharacterStore.getState();
    const playerCharacterId = request.characterIds?.[0]; // First character is the player
    const playerCharacter = playerCharacterId
      ? characters[playerCharacterId]
      : null;

    const toneSettings = world.toneSettings || DEFAULT_TONE_SETTINGS;
    const npcRoster = this.buildNpcRoster(world.id);

    const existingImportant =
      request.narrativeContext?.importantEntities || [];
    const rosterEntities = npcRoster.map((npc) => ({
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

    const narrativeContextWithRoster = request.narrativeContext
      ? {
          ...request.narrativeContext,
          importantEntities: combinedImportant,
        }
      : undefined;

    // Build character skill context for AI
    // NOTE: We intentionally DO NOT provide skill levels to the AI
    // The skill check success/failure tags provide enough guidance without
    // exposing game mechanics that break narrative immersion
    const characterSkillContext = '';
    return {
      worldName: world.name,
      worldDescription: world.description,
      genre: world.genre,
      tone: toneSettings.narrativeStyle,
      attributes: world.attributes,
      characterIds: request.characterIds,
      playerCharacterName: playerCharacter?.name,
      playerCharacterBackground: playerCharacter?.background,
      sessionId: request.sessionId,
      narrativeContext: narrativeContextWithRoster,
      generationParameters: request.generationParameters,
      toneSettings: toneSettings,
      npcRoster,
      // Enhanced skill context for narrative generation
      characterSkillContext,
      worldSkills:
        world.skills?.map((skill) => ({
          id: skill.id,
          name: skill.name,
          description: skill.description,
        })) || [],
    };
  }

  /**
   * Formats AI response into structured narrative result
   *
   * Changed to async to support AI-based item extraction fallback when the
   * narrative generation doesn't include itemsAcquired metadata. This ensures
   * inventory-gated decisions have reliable data by calling Gemini to extract
   * structured item acquisitions from the narrative text.
   *
   * @see extractItemsFromNarrative for the fallback extraction logic
   */
  private async formatResponse(
    response: { content?: string; tokenUsage?: number },
    segmentType: string
  ): Promise<NarrativeGenerationResult> {
    let actualContent = response.content || '';
    let extractedMetadata: {
      location?: string;
      mood?:
        | 'tense'
        | 'relaxed'
        | 'mysterious'
        | 'action'
        | 'emotional'
        | 'neutral';
      tags?: string[];
      characterIds?: string[];
      speakerId?: string;
      itemsAcquired?: AcquiredItemMetadata[];
      characters?: GeneratedCharacterMetadata[];
    } = {};

    // Try to parse JSON response if present
    if (
      actualContent.includes('```json') ||
      actualContent.startsWith('{') ||
      actualContent.includes('"content":')
    ) {
      try {
        let jsonStr = safeTrim(actualContent);

        // Handle markdown code blocks
        if (jsonStr.includes('```json')) {
          jsonStr = jsonStr.replace(/```json\s*/, '').replace(/\s*```/, '');
        } else if (jsonStr.includes('```')) {
          jsonStr = jsonStr.replace(/```\s*/, '').replace(/\s*```/, '');
        }

        // Clean up any surrounding text that might interfere
        jsonStr = safeTrim(jsonStr);

        // Find JSON object boundaries if there's surrounding text
        const jsonStart = jsonStr.indexOf('{');
        const jsonEnd = jsonStr.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
          jsonStr = jsonStr.substring(jsonStart, jsonEnd + 1);
        } else if (jsonStart !== -1) {
          // Handle incomplete JSON by extracting content field directly
          const contentMatch = jsonStr.match(
            /"content"\s*:\s*"([\s\S]*?)(?:",|\s*$)/
          );
          if (contentMatch && contentMatch[1]) {
            actualContent = contentMatch[1]
              .replace(/\\"/g, '"')
              .replace(/\\n/g, '\n');
            // Skip JSON.parse and continue with extracted content
          } else {
            throw new Error('Incomplete JSON without extractable content');
          }
        } else {
          throw new Error('No JSON structure found');
        }

        // Only parse if we have a complete JSON structure
        if (jsonEnd !== -1) {
          const parsed = JSON.parse(jsonStr);
          if (parsed.content) {
            actualContent = parsed.content;
          }
          if (parsed.metadata) {
            extractedMetadata = {
              location: parsed?.metadata?.location,
              mood: this.validateMood(parsed?.metadata?.mood),
              tags: Array.isArray(parsed?.metadata?.tags)
                ? parsed?.metadata?.tags
                : [],
              characterIds: Array.isArray(parsed?.metadata?.characterIds)
                ? parsed?.metadata?.characterIds
                : [],
              speakerId: typeof parsed?.metadata?.speakerId === 'string'
                ? parsed?.metadata?.speakerId
                : undefined,
              itemsAcquired: Array.isArray(parsed?.metadata?.itemsAcquired)
                ? parsed?.metadata?.itemsAcquired.map((item: unknown) => {
                    const rawItem = item as {
                      name: string;
                      description?: string;
                      quantity?: number;
                      acquisitionMethod?: string;
                    };
                    return {
                      name: rawItem.name,
                      description: rawItem.description,
                      quantity: rawItem.quantity,
                      acquisitionMethod: rawItem.acquisitionMethod as InventoryAcquisitionMethod,
                    };
                  })
                : undefined,
              characters: Array.isArray(parsed?.metadata?.characters)
                ? parsed.metadata.characters
                    .map((character: unknown) => {
                      const raw = character as {
                        id?: string;
                        name?: string;
                        description?: string;
                        role?: string;
                        avatarPrompt?: string;
                        avatarUrl?: string;
                      };
                      const id = raw?.id ? safeTrim(String(raw.id)) : '';
                      const name = raw?.name ? safeTrim(String(raw.name)) : '';
                      if (!id || !name) {
                        return null;
                      }
                      return {
                        id,
                        name,
                        description: raw?.description ? safeTrim(String(raw.description)) : undefined,
                        role: raw?.role ? safeTrim(String(raw.role)) : undefined,
                        avatarPrompt: raw?.avatarPrompt ? safeTrim(String(raw.avatarPrompt)) : undefined,
                        avatarUrl: raw?.avatarUrl ? safeTrim(String(raw.avatarUrl)) : undefined,
                      } as GeneratedCharacterMetadata;
                    })
                    .filter((value): value is GeneratedCharacterMetadata => Boolean(value))
                : undefined,
            };
          }
        }
      } catch {
        // Try regex extraction as fallback for malformed JSON
        try {
          // Look for content field - handle malformed JSON with unescaped quotes
          // Find content field and extract everything until the next field or end
          const contentStartMatch = actualContent.match(
            /"content"\s*:\s*"(.+?)"\s*,\s*"/
          );
          if (contentStartMatch && contentStartMatch[1]) {
            actualContent = contentStartMatch[1]
              .replace(/\\"/g, '"')
              .replace(/\\n/g, '\n')
              .replace(/\\\\/g, '\\');
          } else {
            // Try alternative extraction: find content field and extract until next JSON field
            const altContentMatch = actualContent.match(
              /"content"\s*:\s*"([^"]*(?:"[^"]*"[^"]*)*)"/
            );
            if (altContentMatch && altContentMatch[1]) {
              actualContent = altContentMatch[1];
            } else {
              // Final attempt: extract everything between "content": " and the next field pattern
              const finalContentMatch = actualContent.match(
                /"content"\s*:\s*"(.+?)"\s*,\s*"(?:type|metadata)/
              );
              if (finalContentMatch && finalContentMatch[1]) {
                actualContent = finalContentMatch[1];
              }
            }
          }

          // Try to extract location from metadata
          const locationMatch = actualContent.match(
            /"location"\s*:\s*"((?:[^"\\]|\\.)*)"/
          );
          if (locationMatch && locationMatch[1]) {
            extractedMetadata.location = locationMatch[1].replace(/\\"/g, '"');
          }

          const speakerMatch = actualContent.match(
            /"speakerId"\s*:\s*"((?:[^"\\]|\\.)*)"/
          );
          if (speakerMatch && speakerMatch[1]) {
            extractedMetadata.speakerId = speakerMatch[1].replace(/\\"/g, '"');
          }

          // Try to extract mood
          const moodMatch = actualContent.match(
            /"mood"\s*:\s*"((?:[^"\\]|\\.)*)"/
          );
          if (moodMatch && moodMatch[1]) {
            extractedMetadata.mood = this.validateMood(moodMatch[1]);
          }

          // metadata.characters not extracted in fallback path
        } catch {
          // Fallback extraction failed - use default content
        }
      }
    }

    // Use extracted metadata or fall back to generated metadata
    const fallbackMood = this.getMoodForGenre(this.getWorldGenre());
    const fallbackLocation = this.getLocationForGenre(this.getWorldGenre());

    // Normalize the content for consistent formatting
    let normalizedContent = normalizeText(actualContent, NORM_DESC);

    if (extractedMetadata.characters && extractedMetadata.characters.length > 0 && normalizedContent) {
      const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      extractedMetadata.characters.forEach((character) => {
        if (!character?.id) return;
        const tokenRegex = new RegExp(`\\[${escapeRegExp(character.id)}\\]`, 'g');
        const displayName = safeTrim(character.name) || character.id;
        const firstToken = displayName.split(/[\s,]+/)[0]?.toLowerCase();
        const canonicalDisplayName = displayName
          .replace(/[“”"‘’'`´]/g, '')
          .replace(/\s+/g, ' ')
          .trim();
        const normalizedDisplayName = canonicalDisplayName
          .replace(/[^0-9a-z\s]/gi, '')
          .toLowerCase();

        normalizedContent = normalizedContent.replace(
          tokenRegex,
          (match, offset, fullString) => {
            const precedingRaw = fullString.slice(0, offset);
            const precedingTrimmed = precedingRaw.trimEnd();
            const after = fullString.slice(offset + match.length);
            const afterTrimmed = after.trimStart();

            if (normalizedDisplayName.length === 0) {
              return '';
            }

            const tailSlice = precedingTrimmed.slice(
              Math.max(0, precedingTrimmed.length - displayName.length - 3)
            );
            const normalizedTailCanonical = tailSlice
              .replace(/[“”"‘’'`´]/g, '')
              .replace(/\s+/g, ' ')
              .trim();
            const normalizedTail = normalizedTailCanonical
              .replace(/[^0-9a-z\s]/gi, '')
              .toLowerCase();

            const precedingLower = precedingTrimmed.toLowerCase();
            const canonicalLower = canonicalDisplayName.toLowerCase();
            if (
              precedingLower.endsWith(canonicalLower) ||
              precedingLower.endsWith(`${canonicalLower}'s`) ||
              precedingLower.endsWith(`${canonicalLower}’s`)
            ) {
              return '';
            }

            if (normalizedTail.endsWith(normalizedDisplayName)) {
              const afterLower = afterTrimmed
                .replace(/\s+/g, ' ')
                .trimStart()
                .toLowerCase();

              if (
                afterLower.startsWith("'s") ||
                afterLower.startsWith('’s') ||
                afterLower.startsWith("'") ||
                afterLower.startsWith('’')
              ) {
                return '';
              }

              return '';
            }

            if (firstToken) {
              const precedingWordMatch = precedingTrimmed.match(
                /([A-Za-zÀ-ÖØ-öø-ÿ’']+)[,;:]?$/
              );
              const precedingWord = precedingWordMatch?.[1];

              if (precedingWord) {
                const normalizedPrecedingWord = precedingWord
                  .replace(/['’]s$/i, '')
                  .replace(/[^0-9A-Za-z]/g, '')
                  .toLowerCase();

                const normalizedFirstToken = firstToken.replace(
                  /[^0-9A-Za-z]/g,
                  ''
                );

                if (
                  normalizedPrecedingWord &&
                  normalizedFirstToken &&
                  normalizedPrecedingWord === normalizedFirstToken
                ) {
                  return '';
                }
              }
            }

            if (
              normalizedTail.endsWith(normalizedDisplayName) &&
              afterTrimmed.trimStart().length === 0
            ) {
              return '';
            }

            const precedingChar = precedingTrimmed.slice(-1);
            if (
              afterTrimmed.length === 0 &&
              ['.', '!', '?'].includes(precedingChar)
            ) {
              return '';
            }

            return displayName;
          }
        );
      });
    }

    if (normalizedContent) {
      normalizedContent = normalizedContent
        .replace(/[ \t]+([,;:.!?])/g, '$1')
        .replace(/[ \t]{2,}/g, ' ')
        .replace(/\s*\[[a-z0-9-]+\]/gi, '');
    }

    const speakerId = this.normalizeId(extractedMetadata.speakerId);
    const characterIds = this.normalizeCharacterIds(
      extractedMetadata.characterIds
    );
    const finalCharacterIds = speakerId && !characterIds.includes(speakerId)
      ? [...characterIds, speakerId]
      : characterIds;

    const metadataAnalysis = await this.analyzeSegmentMetadata(
      normalizedContent,
      extractedMetadata.characters,
      finalCharacterIds
    );
    const confirmedCharacterIds =
      metadataAnalysis.presentCharacterIds.length > 0
        ? metadataAnalysis.presentCharacterIds
        : finalCharacterIds;
    const analyzedItems =
      extractedMetadata.itemsAcquired && extractedMetadata.itemsAcquired.length > 0
        ? extractedMetadata.itemsAcquired
        : metadataAnalysis.items;

    return {
      content: normalizedContent,
      segmentType: segmentType as
        | 'scene'
        | 'dialogue'
        | 'action'
        | 'transition',
      metadata: {
        characterIds: confirmedCharacterIds,
        speakerId,
        location: extractedMetadata.location || fallbackLocation,
        mood: extractedMetadata.mood || fallbackMood,
        tags: extractedMetadata.tags || [
          this.getWorldGenre() || 'fantasy',
          'narrative',
        ],
        itemsAcquired:
          analyzedItems && analyzedItems.length > 0 ? analyzedItems : undefined,
        characters: extractedMetadata.characters,
      },
      tokenUsage:
        response.tokenUsage && typeof response.tokenUsage === 'object'
          ? response.tokenUsage
          : response.tokenUsage
            ? {
                promptTokens: 0,
                completionTokens: 0,
                totalTokens: response.tokenUsage as number,
              }
            : undefined,
    };
  }

  private normalizeId(id?: string | null): string | undefined {
    if (!id || typeof id !== 'string') {
      return undefined;
    }

    const trimmed = safeTrim(id);
    return trimmed.length > 0 ? trimmed : undefined;
  }

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

  private async analyzeSegmentMetadata(
    content: string,
    characters: GeneratedCharacterMetadata[] | undefined,
    candidateIds: string[]
  ): Promise<{
    presentCharacterIds: string[];
    items: AcquiredItemMetadata[];
  }> {
    if (!content) {
      return { presentCharacterIds: candidateIds, items: [] };
    }

    if (process.env.NODE_ENV === 'test') {
      return { presentCharacterIds: candidateIds, items: [] };
    }

    const roster = new Map<string, { name: string; description?: string }>();
    characters?.forEach((character) => {
      if (character?.id && character.name) {
        roster.set(character.id, {
          name: character.name,
          description: character.description,
        });
      }
    });

    const rosterLines = candidateIds
      .map((id) => {
        const entry = roster.get(id);
        const displayName = entry?.name || id;
        const summary = entry?.description ? ` — ${entry.description}` : '';
        return `- ${id}: ${displayName}${summary}`;
      })
      .join('\n');

    const prompt = `
You are validating metadata for a narrative segment. Analyze the passage and produce two things:
1. Which of the provided NPC IDs are PHYSICALLY present in the scene with the protagonist (sharing the same location, acting together, or speaking face-to-face).
2. Any tangible items the protagonist ends the scene possessing.

Rules for presence:
- Only mark an NPC as present if the narration makes it clear they are co-located with the protagonist during this scene.
- Exclude NPCs who are merely referenced, remembered, mentioned as being elsewhere, or communicating remotely (phone, radio, etc.).
- Only use the provided candidate IDs.

Rules for items:
- Include an item only if the protagonist finishes the scene still holding or carrying it.
- Ignore objects that are merely observed, touched briefly, or immediately set aside.
- Provide concise names and optional descriptions.

Respond with STRICT JSON in this shape (no commentary):
{
  "presentCharacterIds": ["npc-id-1", "npc-id-2"],
  "items": [
    {
      "name": "Item name",
      "description": "Short description",
      "quantity": 1,
      "acquisitionMethod": "loot" | "quest" | "purchase" | "craft" | "reward" | "gift" | "manual" | "unknown"
    }
  ]
}

CANDIDATE NPCS:
${rosterLines || '- (none)'}

NARRATIVE:
"""
${content}
"""
    `.trim();

    try {
      const response = await this.geminiClient.generateContent(prompt);
      const raw = response.content ?? '';
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return { presentCharacterIds: candidateIds, items: [] };
      }

      const parsed = JSON.parse(jsonMatch[0]) as {
        presentCharacterIds?: string[];
        items?: Array<{
          name?: string;
          description?: string;
          quantity?: number;
          acquisitionMethod?: InventoryAcquisitionMethod;
        }>;
      };

      const allowed = new Set(candidateIds.map((id) => id.toLowerCase()));
      const presentCharacterIds = Array.isArray(parsed.presentCharacterIds)
        ? parsed.presentCharacterIds
            .map((id) => id?.toString().trim())
            .filter((id): id is string => Boolean(id))
            .filter((id) => allowed.has(id.toLowerCase()))
        : candidateIds;

      const rawItems = Array.isArray(parsed.items) ? parsed.items : [];
      const allowedAcquisitionMethods: InventoryAcquisitionMethod[] = [
        'loot',
        'quest',
        'purchase',
        'craft',
        'reward',
        'gift',
        'manual',
        'unknown',
      ];

      const items = rawItems
        .filter((item): item is Required<typeof item> => Boolean(item?.name))
        .map((item) => {
          const rawMethod =
            item.acquisitionMethod && typeof item.acquisitionMethod === 'string'
              ? item.acquisitionMethod.toLowerCase().trim()
              : 'unknown';
          const acquisitionMethod = allowedAcquisitionMethods.includes(
            rawMethod as InventoryAcquisitionMethod
          )
            ? (rawMethod as InventoryAcquisitionMethod)
            : 'unknown';

          return {
            name: safeTrim(item.name!),
            description: item.description ? safeTrim(item.description) : undefined,
            quantity:
              typeof item.quantity === 'number' && !Number.isNaN(item.quantity)
                ? item.quantity
                : 1,
            acquisitionMethod,
          };
        })
        .filter((item) => item.name.length > 0);

      return {
        presentCharacterIds,
        items,
      };
    } catch {
      return { presentCharacterIds: candidateIds, items: [] };
    }
  }

  // Helper methods for mock generation
  private getWorldGenre(): string | null {
    try {
      const world = this.getWorld(
        useWorldStore.getState().currentWorldId || ''
      );
      return world?.genre?.toLowerCase() || null;
    } catch {
      return null;
    }
  }

  private validateMood(
    mood?: string
  ):
    | 'neutral'
    | 'tense'
    | 'mysterious'
    | 'relaxed'
    | 'action'
    | 'emotional'
    | undefined {
    const validMoods = [
      'neutral',
      'tense',
      'mysterious',
      'relaxed',
      'action',
      'emotional',
    ];
    return validMoods.includes(mood || '')
      ? (mood as
          | 'neutral'
          | 'tense'
          | 'mysterious'
          | 'relaxed'
          | 'action'
          | 'emotional')
      : undefined;
  }

  private getCharacterAvatarUrl(
    worldId: string,
    character: GeneratedCharacterMetadata
  ): string | undefined {
    if (character.avatarUrl && safeTrim(character.avatarUrl)) {
      return safeTrim(character.avatarUrl);
    }

    return undefined;
  }

  private syncNpcMetadata(
    worldId: string,
    characters?: GeneratedCharacterMetadata[]
  ) {
    if (!worldId || !characters || characters.length === 0) {
      return;
    }

    try {
      const npcStore = useNPCStore.getState();
      const { getById, createNPC, updateNPC } = npcStore as unknown as {
        getById?: (id: string) => NPC | undefined;
        createNPC?: (npc: Omit<NPC, 'createdAt' | 'updatedAt'> & { id?: string }) => string;
        updateNPC?: (id: string, updates: Partial<NPC>) => void;
      };

      if (
        typeof getById !== 'function' ||
        typeof createNPC !== 'function' ||
        typeof updateNPC !== 'function'
      ) {
        return;
      }

      characters.forEach((character) => {
        if (!character?.id || !character.name) {
          return;
        }

        const id = safeTrim(character.id);
        if (!id) return;

        const existing = getById(id);
        const description =
          character.description ||
          character.role ||
          'Supporting character encountered during the narrative.';

        const avatarUrl = this.getCharacterAvatarUrl(worldId, character);

        if (existing) {
          const updates: Partial<NPC> = {};
          if (character.name && character.name !== existing.name) {
            updates.name = character.name;
          }
          if (description && description !== existing.description) {
            updates.description = description;
          }
          if (avatarUrl && avatarUrl !== existing.avatarUrl) {
            updates.avatarUrl = avatarUrl;
          }
          if (existing.worldId !== worldId) {
            updates.worldId = worldId;
          }

          if (Object.keys(updates).length > 0) {
            updateNPC(id, updates);
          }
        } else {
          createNPC({
            id,
            name: character.name,
            description,
            worldId,
            avatarUrl,
          });
        }
      });
    } catch {
      // NPC synchronization failures should never break narrative generation
    }
  }

  private getMoodForGenre(
    genre?: string | null
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

  private getLocationForGenre(genre?: string | null): string {
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

  /**
   * Generate narrative that acknowledges skill usage
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
      const world = this.getWorld(worldId);
      const template = this.getTemplate('skillAcknowledgment');

      // Get character details
      const { characters } = useCharacterStore.getState();
      const playerCharacterId = characterIds[0];
      const playerCharacter = playerCharacterId
        ? characters[playerCharacterId]
        : null;

      const context = {
        worldName: world.name,
        genre: world.genre,
        narrativeContext,
        playerCharacterName: playerCharacter?.name,
        skillUsed,
        customAction,
      };

      const prompt = template(context);
      const toneEnhancedPrompt = this.enhancePromptWithToneSettings(
        prompt,
        world
      );
      const loreEnhancedPrompt = this.enhancePromptWithLore(
        toneEnhancedPrompt,
        worldId
      );
      const inventoryEnhancedPrompt = this.enhancePromptWithInventory(
        loreEnhancedPrompt,
        characterIds
      );
      const fullyEnhancedPrompt = this.enhancePromptWithItemAcquisitionInstructions(
        inventoryEnhancedPrompt
      );

      const response =
        await this.geminiClient.generateContent(fullyEnhancedPrompt);

      const result = await this.formatResponse(response, 'scene');

      // Process any acquired items from skill acknowledgment
      if (result.metadata.itemsAcquired && result.metadata.itemsAcquired.length > 0) {
        const characterId = characterIds[0];
        const sessionId = narrativeContext.sessionId;
        if (characterId && sessionId) {
          // Process items asynchronously - don't block narrative generation
          void processAcquiredItems(
            result.metadata.itemsAcquired,
            characterId,
            sessionId
          );
        }
      }

      return result;
    } catch {
      throw new Error('Failed to generate skill acknowledgment narrative');
    }
  }

  /**
   * Generate player choices based on the current narrative context
   */
  async generatePlayerChoices(
    worldId: string,
    narrativeContext: NarrativeContext,
    characterIds: string[]
  ): Promise<Decision> {
    try {
      const result = await this.choiceGenerator.generateChoices({
        worldId,
        narrativeContext,
        characterIds,
        minOptions: 3,
        maxOptions: 4,
        useAlignedChoices: false, // Use enhanced playerChoice template with hints and requirements
      });

      return result;
    } catch {
      // Return fallback choices instead of throwing
      const fallbackId = `decision-fallback-${Date.now()}`;
      return {
        id: fallbackId,
        prompt: 'What will you do next?',
        options: [
          {
            id: `option-${fallbackId}-1`,
            text: 'Investigate further',
            alignment: 'neutral',
          },
          {
            id: `option-${fallbackId}-2`,
            text: 'Talk to nearby characters',
            alignment: 'lawful',
          },
          {
            id: `option-${fallbackId}-3`,
            text: 'Move to a new location',
            alignment: 'neutral',
          },
        ],
        decisionWeight: 'minor',
        contextSummary: `In ${narrativeContext.currentLocation || 'an unknown location'}, ${narrativeContext.currentSituation || 'making a decision'}.`,
      };
    }
  }

  /**
   * Generate world template using AI
   */
  async generateWorldTemplate(
    context: TemplateGenerationContext
  ): Promise<WorldTemplate> {
    return this.templateGenerator.generateWorldTemplate(context);
  }

  /**
   * Convert template to world format
   */
  convertTemplateToWorld(
    template: WorldTemplate
  ): Omit<World, 'id' | 'createdAt' | 'updatedAt'> {
    return this.templateGenerator.convertTemplateToWorld(template);
  }
}
