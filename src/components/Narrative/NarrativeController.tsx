import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { NarrativeHistory } from './NarrativeHistory';
import { NarrativeGenerator } from '@/lib/ai/narrativeGenerator';
import { createDefaultGeminiClient } from '@/lib/ai/defaultGeminiClient';
import { useNarrativeStore } from '@/state/narrativeStore';
import { Decision, NarrativeContext, NarrativeSegment } from '@/types/narrative.types';
import { truncate, safeTrim } from '@/lib/utils';
import { useCharacterStore } from '@/state/characterStore';
import { useWorldStore } from '@/state/worldStore';
import { useNPCStore } from '@/state/npcStore';
import { evaluateSkillCheck } from '@/utils/skillCheckEvaluator';
import type { Character as UtilCharacter } from '@/types/character.types';

const EMPTY_NPC_IDS: string[] = [];

interface NarrativeControllerProps {
  worldId: string;
  sessionId: string;
  characterId?: string;
  onNarrativeGenerated?: (segment: NarrativeSegment) => void;
  onChoicesGenerated?: (decision: Decision) => void;
  onEndingSuggested?: (reason: string, endingType: import('@/types/narrative.types').EndingType) => void;
  triggerGeneration?: boolean;
  choiceId?: string; // ID of the choice that triggered this narrative
  className?: string;
  generateChoices?: boolean; // Whether to generate choices after narrative
}

export const NarrativeController: React.FC<NarrativeControllerProps> = ({
  worldId,
  sessionId,
  characterId,
  onNarrativeGenerated,
  onChoicesGenerated,
  onEndingSuggested,
  triggerGeneration = true,
  choiceId,
  className,
  generateChoices = true
}) => {
  const [segments, setSegments] = useState<NarrativeSegment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingChoices, setIsGeneratingChoices] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Access store methods in a way that works with testing
  const addSegment = useNarrativeStore(state => state.addSegment);
  const getSessionSegments = useNarrativeStore(state => state.getSessionSegments);
  const hasHydrated = useNarrativeStore(state => state._hasHydrated);
  const narrativeGenerator = useMemo(() => new NarrativeGenerator(createDefaultGeminiClient()), []);

  // Access character and world stores for skill evaluation
  const characters = useCharacterStore(state => state.characters);
  const worlds = useWorldStore(state => state.worlds);
  const npcIds = useNPCStore(
    useCallback((state) => state.worldNpcs[worldId] ?? EMPTY_NPC_IDS, [worldId])
  );
  const npcs = useNPCStore((state) => state.npcs);

  const npcRoster = useMemo(() => {
    if (!npcIds || npcIds.length === 0) {
      return [];
    }
    return npcIds
      .map((id) => npcs[id])
      .filter((npc): npc is NonNullable<typeof npcs[string]> => Boolean(npc));
  }, [npcIds, npcs]);

  // Track if we've already generated a narrative for this session
  const [sessionKey, setSessionKey] = useState('');
  const [initialGenerationCompleted, setInitialGenerationCompleted] = useState(false);
  const [processedChoices, setProcessedChoices] = useState<Set<string>>(new Set());
  const mountedRef = useRef(false);
  const generateCount = useRef(0);
  // Use a ref to track if we've initiated generation in this component instance
  const initialGenerationInitiated = useRef(false);
  // Use a ref to prevent overlapping choice generation
  const choiceGenerationInProgress = useRef(false);
  // Track if we've already suggested an ending for this session
  const endingSuggestedRef = useRef(false);

  // Initialize component state on mount
  useEffect(() => {
    // Create a unique session key to track this instance
    const instanceKey = `${sessionId}-${Date.now()}`;
    setSessionKey(instanceKey);

    // Reset state when session changes
    setProcessedChoices(new Set());
    setError(null);
    generateCount.current = 0;

    // Set mounted flag
    mountedRef.current = true;

    // Reset generation flags
    initialGenerationInitiated.current = false;
    choiceGenerationInProgress.current = false;
    endingSuggestedRef.current = false;

    return () => {
      mountedRef.current = false;
      initialGenerationInitiated.current = false; // Reset generation init flag
      choiceGenerationInProgress.current = false; // Reset choice generation flag
    };
  }, [sessionId, worldId, characterId]);

  /**
   * Pure AI-based ending detection - analyzes narrative context for natural conclusions
   * 
   * This function uses Google Gemini AI to analyze narrative segments and determine
   * if the story has reached a natural conclusion point. Unlike traditional rule-based
   * systems, this implementation relies entirely on AI understanding of story structure,
   * character arcs, and emotional satisfaction.
   * 
   * Key Features:
   * - NO keyword matching or pattern recognition
   * - Context-aware analysis (recent + broader story context)
   * - Confidence-based filtering (only medium/high confidence suggestions)
   * - Multiple ending type classification
   * - Graceful error handling with no fallback mechanisms
   * 
   * @param newSegment - The newly created narrative segment to analyze
   * 
   * Behavior:
   * - Requires at least 3 total segments before analysis begins
   * - Analyzes last 5 segments for recent context
   * - Includes earlier story summary for longer narratives (10+ segments)
   * - Only triggers onEndingSuggested for medium/high confidence AI responses
   * - Handles AI failures silently (pure AI approach - no fallback)
   * - Supports markdown-wrapped JSON responses from AI
   * 
   * AI Response Format:
   * {
   *   "suggestEnding": true/false,
   *   "confidence": "high" | "medium" | "low", 
   *   "endingType": "story-complete" | "character-retirement" | "session-limit" | "none",
   *   "reason": "Clear explanation of why this is/isn't a good ending point"
   * }
   * 
   * Error Handling:
   * - AI service failures: Silent failure, no ending suggestion
   * - JSON parsing errors: Silent failure, no ending suggestion  
   * - Network issues: Silent failure, no ending suggestion
   * - Low confidence responses: Filtered out, no ending suggestion
   * 
   * @see {@link /dev/ai-ending-detection} Test harness for manual verification
   * @see {@link docs/features/ai-ending-detection.md} Complete documentation
   */
  const checkForEndingIndicators = async (newSegment: NarrativeSegment) => {
    // Don't suggest multiple times
    if (endingSuggestedRef.current || !onEndingSuggested) return;
    
    // Skip if we don't have enough narrative context (less than 3 segments)
    const allSegments = [...segments, newSegment];
    if (allSegments.length < 3) return;
    
    try {
      const client = createDefaultGeminiClient();
      
      // Get recent narrative context (last 5 segments for analysis)
      const recentSegments = allSegments.slice(-5);
      const narrativeContext = recentSegments.map((segment, index) => 
        `Segment ${index + 1}: ${segment.content}`
      ).join('\n\n');
      
      // Get broader story context (all segments but condensed)
      const fullStoryContext = allSegments.length > 10 
        ? `Earlier story: ${truncate(allSegments.slice(0, -5).map(s => s.content).join(' '), 500)}\n\n`
        : '';
      
      const analysisPrompt = `You are a narrative expert analyzing a story in progress. Determine if this story has reached a natural conclusion point where the player would feel satisfied ending.

${fullStoryContext}Recent narrative developments:
${narrativeContext}

Analyze this story for natural ending points. Consider:

STORY STRUCTURE:
- Has the central conflict been resolved or reached climax?
- Are character arcs showing completion or fulfillment?
- Is there a sense of narrative closure or resolution?
- Does the story feel like it has reached a satisfying conclusion?

EMOTIONAL SATISFACTION:
- Would ending here feel fulfilling to the reader?
- Are loose threads tied up or at a natural pause?
- Is there dramatic or emotional resolution?

DO NOT:
- Look for specific keywords or phrases
- Use pattern matching
- Apply rigid rules
- Suggest ending just because of story length

Respond with JSON format:
{
  "suggestEnding": true/false,
  "confidence": "high" | "medium" | "low",
  "endingType": "story-complete" | "character-retirement" | "session-limit" | "none",
  "reason": "Clear explanation of why this is/isn't a good ending point"
}`;

      const response = await client.generateContent(analysisPrompt);
      
      try {
        // Extract JSON from response, handling markdown code blocks
        let jsonContent = response.content;
        
        // Remove markdown code blocks if present
        if (jsonContent.includes('```json')) {
          jsonContent = jsonContent.replace(/```json\s*/g, '').replace(/```\s*/g, '');
        } else if (jsonContent.includes('```')) {
          jsonContent = jsonContent.replace(/```\s*/g, '');
        }
        
        // Trim whitespace
        jsonContent = safeTrim(jsonContent);
        
        const analysis = JSON.parse(jsonContent);
        
        // Only suggest ending if AI has medium or high confidence
        if (analysis.suggestEnding && ['high', 'medium'].includes(analysis.confidence)) {
          endingSuggestedRef.current = true;
          
          // Determine ending type based on AI analysis or default to story-complete
          const endingType = ['story-complete', 'character-retirement', 'session-limit'].includes(analysis.endingType) 
            ? analysis.endingType 
            : 'story-complete';
          
          onEndingSuggested(analysis.reason, endingType);
        }
      } catch (parseError) {
        console.error('Failed to parse AI ending analysis:', parseError);
        // If JSON parsing fails, do not suggest ending
        // Pure AI approach means no fallback to rules
      }
    } catch (error) {
      console.error('Failed to analyze ending indicators with AI:', error);
      // Pure AI approach means no fallback - if AI fails, no ending suggestion
    }
  };

  // Deduplicate segments by ID to ensure we don't have duplicates in localStorage
  useEffect(() => {
    if (segments.length > 0) {
      // Check for duplicates
      const ids = new Set();
      const hasDuplicates = segments.some(segment => {
        if (ids.has(segment.id)) return true;
        ids.add(segment.id);
        return false;
      });
      
      if (hasDuplicates) {
        // Deduplicate by keeping only the first occurrence of each ID
        const uniqueSegments = [];
        const seenIds = new Set();
        
        for (const segment of segments) {
          if (!seenIds.has(segment.id)) {
            uniqueSegments.push(segment);
            seenIds.add(segment.id);
          }
        }
        
        // Update local state with deduplicated segments
        setSegments(uniqueSegments);
      }
    }
  }, [segments, sessionKey]);

  // Primary generation effect
  useEffect(() => {
    // Skip if component is unmounted
    if (!mountedRef.current) return;
    
    // Generate narrative when triggered
    if (triggerGeneration && !isLoading) {
      // Initial narrative generation (only if we have no segments and haven't generated one yet)
      if (segments.length === 0 && !initialGenerationCompleted && !initialGenerationInitiated.current) {
        // Set both state and refs to prevent duplicate generation
        setInitialGenerationCompleted(true);
        initialGenerationInitiated.current = true;
        
        generateCount.current += 1;
        generateInitialNarrative();
      } 
      // Choice-based generation (only if we haven't processed this choice already)
      else if (choiceId && !processedChoices.has(choiceId)) {
        // Mark this choice as processed BEFORE generating
        // This prevents multiple generations from triggering
        setProcessedChoices(prev => {
          const updated = new Set(prev);
          updated.add(choiceId);
          return updated;
        });
        
        generateCount.current += 1;
        generateNextSegment(choiceId);
      }
      // Log if we're skipping generation
      // (No action needed for other cases)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerGeneration, choiceId, segments.length, isLoading, sessionId, sessionKey]);

  /**
   * Generate player choices based on current narrative context
   */
  const generatePlayerChoices = useCallback(async () => {
    if (!mountedRef.current) {
      return;
    }
    
    // Prevent overlapping choice generation using ref (more reliable than state)
    if (choiceGenerationInProgress.current) {
      return;
    }
    
    choiceGenerationInProgress.current = true;
    
    // Get fresh segments from the store instead of relying on component state
    const currentSegments = useNarrativeStore.getState().getSessionSegments(sessionId);
    
    if (currentSegments.length === 0) {
      choiceGenerationInProgress.current = false;
      return;
    }
    setIsGeneratingChoices(true);
    
    // Use recent segments for context - get from fresh data
    const recentSegments = currentSegments.slice(-5);
    
    // Create fallback choices upfront - we'll use these immediately if something fails
    const fallbackId = `decision-fallback-${Date.now()}`;
    const fallbackDecision: Decision = {
      id: fallbackId,
      prompt: "What will you do?",
      options: [
        { id: `option-${fallbackId}-1`, text: "Investigate further", alignment: 'neutral' },
        { id: `option-${fallbackId}-2`, text: "Talk to nearby characters", alignment: 'lawful' },
        { id: `option-${fallbackId}-3`, text: "Move to a new location", alignment: 'neutral' }
      ],
      decisionWeight: 'minor',
      contextSummary: recentSegments.length > 0 ? 
        `${recentSegments[recentSegments.length - 1]?.metadata?.location || 'Unknown location'}: ${truncate(recentSegments[recentSegments.length - 1]?.content || 'Making a decision', 100)}` :
        'Making a decision in an unknown location.'
    };
    
    try {
      
      // Create narrative context for choice generation
      const narrativeContext: NarrativeContext = {
        worldId,
        currentSceneId: `scene-${Date.now()}`,
        characterIds: [],
        previousSegments: recentSegments,
        currentTags: recentSegments[recentSegments.length - 1]?.metadata?.tags || [],
        sessionId: sessionId || 'temp-session',
        recentSegments,
        currentLocation: recentSegments[recentSegments.length - 1]?.metadata?.location || undefined
      };
      
      // Generate choices with a 15-second timeout for real API calls
      let decision;
      try {
        // Set up a race between the AI generation and a timeout
        const timeoutPromise = new Promise<Decision>((_, reject) => {
          setTimeout(() => reject(new Error('AI choice generation timed out after 15 seconds')), 15000);
        });
        
        decision = await Promise.race([
          narrativeGenerator.generatePlayerChoices(
            worldId,
            narrativeContext,
            []
          ),
          timeoutPromise
        ]);
        
      } catch {
        // Choice generation failed, using fallback choices
        decision = fallbackDecision;
      }
      
      // Skip if component unmounted during async operation
      if (!mountedRef.current) {
        return;
      }
      
      // Verify decision structure and use fallback if invalid
      if (!decision || !decision.options || (decision.options?.length || 0) === 0) {
        decision = fallbackDecision;
      }
      
      
      // Add decision to store and get the actual stored ID
      const storedDecisionId = useNarrativeStore.getState().addDecision(sessionId, {
        prompt: decision.prompt,
        options: decision.options
      });
      
      // Update the decision with the stored ID before passing to parent
      decision.id = storedDecisionId;
      
      // Only notify parent component if we have AI-generated choices (not fallback)
      // Check if this is a fallback decision by comparing the ID pattern
      const isFallbackDecision = decision.id.includes('decision-fallback-');
      
     if (!isFallbackDecision) {
        if (onChoicesGenerated) {
          try {
            // Create a deep copy of the decision to ensure React state updates
            const decisionCopy = JSON.parse(JSON.stringify(decision));
            onChoicesGenerated(decisionCopy);
          } catch (error) {
            console.error('Error calling onChoicesGenerated callback:', error);
          }
        }
      }
    } catch {
      // Unhandled error in generatePlayerChoices
      setError('Unable to generate choices. Please check your connection and try again.');
      
      // Even if we get an unhandled error, try to provide fallback choices
      
      try {
        // Only try to create fallback choices if we haven't already added any for this session
        const existingDecisions = useNarrativeStore.getState().getSessionDecisions(sessionId);
        
        if (existingDecisions.length === 0 && mountedRef.current) {
          // Create and add fallback choices to the store
          const fallbackId = `decision-fallback-error-${Date.now()}`;
          const fallbackDecision: Decision = {
            id: fallbackId,
            prompt: "What will you do now?",
            options: [
              { id: `option-${fallbackId}-1`, text: "Investigate the situation", alignment: 'neutral' },
              { id: `option-${fallbackId}-2`, text: "Speak with someone nearby", alignment: 'lawful' },
              { id: `option-${fallbackId}-3`, text: "Move to a different area", alignment: 'neutral' }
            ],
            decisionWeight: 'minor',
            contextSummary: 'Error occurred during choice generation.'
          };
          
          // Add to store and get the actual stored ID
          const storedFallbackId = useNarrativeStore.getState().addDecision(sessionId, {
            prompt: fallbackDecision.prompt,
            options: fallbackDecision.options
          });
          
          // Update the fallback decision with the stored ID
          fallbackDecision.id = storedFallbackId;
          
          // Notify parent
          if (onChoicesGenerated && mountedRef.current) {
            const decisionCopy = JSON.parse(JSON.stringify(fallbackDecision));
            onChoicesGenerated(decisionCopy);
          }
        }
      } catch {
        // Failed to provide fallback choices
      }
    } finally {
      choiceGenerationInProgress.current = false;
      if (mountedRef.current) {
        setIsGeneratingChoices(false);
      }
    }
  }, [sessionId, worldId, onChoicesGenerated, narrativeGenerator]);

  // Load segments after hydration is complete
  useEffect(() => {
    if (!hasHydrated) {
      return; // Wait for persistence to load
    }

    // Load segments for the current session
    const existingSegments = getSessionSegments(sessionId);
    setSegments(existingSegments);

    // Check if we already have an initial scene by looking for the 'intro' tag
    // This is more stable than checking for a specific location string
    const hasInitialScene = existingSegments.some(segment =>
      segment.metadata?.tags?.includes('intro')
    );

    // Critical: mark initial generation as completed if we already have an initial scene
    setInitialGenerationCompleted(hasInitialScene);

    if (hasInitialScene) {
      initialGenerationInitiated.current = true; // Prevent any attempt to generate an initial scene
    }

    // If we already have narrative content and no decisions yet, proactively generate choices
    try {
      const existingDecisions = useNarrativeStore.getState().getSessionDecisions(sessionId);
      if (generateChoices && existingSegments.length > 0 && existingDecisions.length === 0) {
        setTimeout(() => {
          if (mountedRef.current) {
            generatePlayerChoices();
          }
        }, 300);
      }
    } catch {
      // Non-critical; continue
    }
  }, [hasHydrated, sessionId, generateChoices, getSessionSegments, generatePlayerChoices]);

  const generateInitialNarrative = async () => {
    // CHECK FIRST: Don't generate an initial scene if one already exists
    // Do a fresh check of the store to get the latest state
    const existingSegments = getSessionSegments(sessionId);
    const hasAnySegments = existingSegments.length > 0;
    
    
    // If we have ANY segments, this is a resumed session - don't generate initial narrative
    if (hasAnySegments) {
      setInitialGenerationCompleted(true);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Race AI generation with a timeout so we can fallback gracefully
      // Allow more time for first-call cold-starts and slower generation
      const timeoutMs = 15000;
      const timeoutPromise = new Promise<ReturnType<typeof narrativeGenerator.generateInitialScene>>((_, reject) => {
        setTimeout(() => reject(new Error(`Initial generation timed out after ${timeoutMs}ms`)), timeoutMs);
      });
      const result = await Promise.race([
        narrativeGenerator.generateInitialScene(worldId, characterId ? [characterId] : []),
        timeoutPromise as unknown as Promise<ReturnType<typeof narrativeGenerator.generateInitialScene>>,
      ]);
      
      // Skip if component unmounted during async operation
      if (!mountedRef.current) {
        return;
      }
      
      // Double-check we still don't have any segments (in case another instance created one)
      const currentSegments = getSessionSegments(sessionId);
      const nowHasSegments = currentSegments.length > 0;
      
      if (nowHasSegments) {
        setIsLoading(false);
        return;
      }
      
      const segmentId = `seg-${worldId}-${Date.now()}`;
      const now = new Date();
      const newSegment: NarrativeSegment = {
        id: segmentId,
        content: result.content,
        type: result.segmentType,
        characterIds: result.metadata.characterIds || [],
        metadata: result.metadata,
        sessionId, // Explicitly set sessionId
        worldId,   // Explicitly set worldId
        timestamp: now,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      };
      
      // Add to local state
      setSegments(prev => [...prev, newSegment]);
      
      // Add to store
      addSegment(sessionId, {
        content: newSegment.content,
        type: newSegment.type,
        characterIds: newSegment.characterIds || [],
        metadata: newSegment.metadata,
        updatedAt: newSegment.updatedAt,
        timestamp: newSegment.timestamp
      });
      
      if (onNarrativeGenerated) {
        onNarrativeGenerated(newSegment);
      }
      
      // Check for ending indicators
      await checkForEndingIndicators(newSegment);
      
      // Generate choices if enabled - always generate for initial narrative
      if (generateChoices) {
        
        // Start generating AI choices immediately without showing fallback choices first
        setTimeout(() => {
          generatePlayerChoices();
        }, 500); // Reduced timeout since we're not showing immediate choices
      }
    } catch {
      // Error generating initial narrative — create a graceful fallback segment
      try {
        const now = new Date();
        const segmentId = `seg-${worldId}-fallback-${Date.now()}`;
        const fallbackSegment: NarrativeSegment = {
          id: segmentId,
          content: 'The adventure begins. You find yourself at the edge of a new journey. What will you do next?',
          type: 'scene',
          characterIds: [],
          metadata: {
            characterIds: [],
            location: 'Starting Location',
            tags: ['intro', 'fallback']
          },
          sessionId,
          worldId,
          timestamp: now,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString()
        };

        // Add locally and to the store to unblock the UI
        setSegments(prev => [...prev, fallbackSegment]);
        addSegment(sessionId, {
          content: fallbackSegment.content,
          type: fallbackSegment.type,
          characterIds: fallbackSegment.characterIds || [],
          metadata: fallbackSegment.metadata,
          updatedAt: fallbackSegment.updatedAt,
          timestamp: fallbackSegment.timestamp
        });

        // Notify parent so it can progress to choices skeleton + generation
        if (onNarrativeGenerated) {
          onNarrativeGenerated(fallbackSegment);
        }

        // Kick off choice generation (will provide AI or fallback choices)
        if (generateChoices) {
          setTimeout(() => {
            generatePlayerChoices();
          }, 500);
        }
      } catch {
        // Surface the original error if fallback insert also fails
        setError('Unable to generate narrative. Please check your connection and try again.');
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  const generateNextSegment = async (triggeringChoiceId: string) => {
    
    if (segments.length === 0) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Use recent segments for context (last 3-5 segments)
      const recentSegments = segments.slice(-5);
      
      // Get the actual choice text from the narrative store
      const decisions = useNarrativeStore.getState().getSessionDecisions(sessionId);
      let choiceText = triggeringChoiceId;
      
      // Find the decision that contains this choice
      let isCustomInput = false;
      let selectedOption = null;
      for (const decision of decisions) {
        const option = decision.options.find(opt => opt.id === triggeringChoiceId);
        if (option) {
          selectedOption = option;
          // For custom input, use the customText, otherwise use the regular text
          choiceText = option.isCustomInput && option.customText
            ? option.customText
            : option.text;
          isCustomInput = option.isCustomInput || false;
          break;
        }
      }

      // Evaluate skill requirements if present
      const skillCheckTags: string[] = [];
      if (selectedOption?.requirements && characterId) {
        const character = characters[characterId];
        const world = worlds[worldId];

        if (character && world) {
          // Filter for skill requirements only
          const skillRequirements = selectedOption.requirements.filter(req => req.type === 'skill');

          for (const requirement of skillRequirements) {
            // Create SkillCheck object for evaluateSkillCheck
            const difficulty = typeof requirement.value === 'number'
              ? requirement.value
              : parseInt(requirement.value, 10);

            const skillCheck = {
              skillId: requirement.targetId,
              difficulty
            };

            // Adapt store character format to evaluator's expected format
            const adaptedCharacter: UtilCharacter = {
              id: character.id,
              name: character.name,
              description: character.description,
              worldId: character.worldId,
              skills: character.skills.map(skill => ({
                skillId: skill.worldSkillId || skill.id,
                level: skill.level,
                experience: 0,
                isActive: true // Store doesn't track this, assume all skills are active
              })),
              attributes: character.attributes.map(attr => ({
                attributeId: attr.worldAttributeId || attr.id,
                value: attr.modifiedValue || attr.baseValue
              })),
              background: {
                history: character.background?.history || '',
                personality: character.background?.personality || '',
                goals: character.background?.goals || [],
                fears: character.background?.fears || [],
                relationships: [] // Store uses unknown[], evaluator expects CharacterRelationship[]
              },
              inventory: {
                characterId: character.inventory.characterId,
                items: [], // Store uses unknown[], evaluator expects InventoryItem[]
                capacity: character.inventory.capacity,
                categories: [] // Store uses string[], evaluator expects InventoryCategory[]
              },
              status: character.status,
              createdAt: character.createdAt,
              updatedAt: character.updatedAt
            };

            const success = evaluateSkillCheck(
              adaptedCharacter,
              skillCheck,
              world.skills || []
            );

            // Add success or failure tags for each skill check
            const tag = success
              ? `skill-success:${requirement.targetId}`
              : `skill-failure:${requirement.targetId}`;
            skillCheckTags.push(tag);
          }
        }
      }

      // Combine existing tags with skill check tags
      const existingTags = recentSegments[recentSegments.length - 1]?.metadata?.tags || [];
      const currentTags = [...existingTags, ...skillCheckTags];

      const result = await narrativeGenerator.generateSegment({
        worldId,
        sessionId,
        characterIds: characterId ? [characterId] : [],
        narrativeContext: {
          worldId,
          currentSceneId: `scene-${Date.now()}`,
          characterIds: characterId ? [characterId] : [],
          previousSegments: recentSegments,
          currentTags,
          sessionId: sessionId || 'temp-session',
          recentSegments,
          currentSituation: `Player chose: "${choiceText}"`
        },
        generationParameters: {
          segmentType: 'scene',
          includedTopics: [choiceText],
          desiredLength: 'short'
        }
      });
      
      // Skip if component unmounted during async operation
      if (!mountedRef.current) {
        return;
      }
      
      const segmentId = `seg-${worldId}-${triggeringChoiceId}-${Date.now()}`;
      const now = new Date();
      const newSegment: NarrativeSegment = {
        id: segmentId,
        content: result.content,
        type: result.segmentType,
        characterIds: result.metadata.characterIds || [],
        metadata: result.metadata,
        sessionId, // Explicitly set sessionId
        worldId,   // Explicitly set worldId
        timestamp: now,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      };
      
      // Add to local state
      setSegments(prev => [...prev, newSegment]);
      
      // Add to store
      addSegment(sessionId, {
        content: newSegment.content,
        type: newSegment.type,
        characterIds: newSegment.characterIds || [],
        metadata: newSegment.metadata,
        updatedAt: newSegment.updatedAt,
        timestamp: newSegment.timestamp
      });
      
      if (onNarrativeGenerated) {
        onNarrativeGenerated(newSegment);
      }
      
      // Check for ending indicators
      await checkForEndingIndicators(newSegment);
      
      // Generate choices if enabled
      if (generateChoices) {
        if (isCustomInput) {
          // Generate choices after a longer delay to ensure custom input is fully processed
          setTimeout(() => {
            generatePlayerChoices();
          }, 2000); // Longer delay after custom input
        } else {
          // Start generating AI choices immediately without showing fallback choices first
          setTimeout(() => {
            generatePlayerChoices();
          }, 500); // Normal timeout for predefined choices
        }
      }
    } catch {
      // Error generating narrative
      setError('Unable to generate narrative. Please check your connection and try again.');
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  const handleRetry = () => {
    setError(null);
    
    // If we have no segments, retry initial generation
    if (segments.length === 0) {
      generateInitialNarrative();
    } else if (choiceId && processedChoices.has(choiceId)) {
      // If we were trying to generate from a choice, remove it from processed and retry
      setProcessedChoices(prev => {
        const updated = new Set(prev);
        updated.delete(choiceId);
        return updated;
      });
      generateNextSegment(choiceId);
    } else {
      // Otherwise just clear the error
      setError(null);
    }
  };

  return (
    <div className={`narrative-controller ${className || ''}`}>
      <NarrativeHistory 
        segments={segments}
        isLoading={isLoading || isGeneratingChoices}
        error={error || undefined}
        onRetry={handleRetry}
      />
      {process.env.NODE_ENV !== 'production' && npcRoster.length > 0 && (
        <div className="mt-6 rounded-lg border border-dashed border-muted-foreground/50 bg-muted/40 p-4 text-sm text-muted-foreground">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">
            NPC roster (debug)
          </p>
          <ul className="mt-3 space-y-3">
            {npcRoster.map((npc) => (
              <li key={npc.id} className="flex items-center gap-3">
                {npc.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={npc.avatarUrl}
                    alt={npc.name}
                    className="h-8 w-8 flex-shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-muted-foreground/20 text-xs font-semibold text-muted-foreground">
                    {npc.name
                      .split(' ')
                      .map((segment) => segment[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="font-medium text-foreground">{npc.name}</span>
                  <span className="text-[11px] uppercase tracking-wide text-muted-foreground/80">
                    {npc.id}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
