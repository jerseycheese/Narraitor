import { useState, useCallback, useMemo } from 'react';
import { useWorldStore } from '@/state/worldStore';
import { worldApi, GenerateWorldParams } from '@/lib/api/worldApi';
import { worldCreationService, CreateWorldFromGenerationParams } from '@/lib/services/worldCreationService';
import { convertToGenerationParams, WorldTypeData } from '@/components/shared/WorldTypeSelector';
import { validateWorldCreationData, WorldCreationData } from '@/lib/utils/worldValidation';

export interface UseWorldCreationOptions {
  onSuccess?: (worldId: string) => void;
  onError?: (error: Error) => void;
  generateImage?: boolean;
}

export interface WorldCreationState {
  isLoading: boolean;
  isGenerating: boolean;
  isCreating: boolean;
  error: string | null;
  progress?: {
    step: string;
    details?: string;
  };
}

/**
 * Comprehensive hook for managing all world creation operations
 */
export function useWorldCreation({
  onSuccess,
  onError,
  generateImage = true,
}: UseWorldCreationOptions = {}) {
  // State management
  const [state, setState] = useState<WorldCreationState>({
    isLoading: false,
    isGenerating: false,
    isCreating: false,
    error: null,
  });

  // Get existing world names for validation
  const { worlds } = useWorldStore();
  const existingNames = useMemo(
    () => Object.values(worlds).map(world => world.name),
    [worlds]
  );

  // Update state helper
  const updateState = useCallback((updates: Partial<WorldCreationState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  // Generate world using AI
  const generateWorld = useCallback(async (
    worldTypeData: WorldTypeData,
    customizations?: {
      name?: string;
      genre?: string;
    }
  ): Promise<string> => {
    try {
      updateState({
        isLoading: true,
        isGenerating: true,
        error: null,
        progress: { step: 'Generating world data...', details: 'Using AI to create your world' },
      });

      // Convert world type data to generation parameters
      const { reference, relationship } = convertToGenerationParams(worldTypeData);

      // Prepare generation parameters
      const params: GenerateWorldParams = {
        worldReference: reference,
        worldRelationship: relationship,
        existingNames,
        suggestedName: customizations?.name?.trim(),
      };

      // Generate world data
      updateState({
        progress: { step: 'Generating world data...', details: 'Creating attributes and skills' },
      });
      const generatedData = await worldApi.generateWorld(params);

      // Create world from generated data
      updateState({
        isCreating: true,
        progress: { step: 'Creating world...', details: 'Setting up your new world' },
      });

      const createParams: CreateWorldFromGenerationParams = {
        generatedData,
        customizations,
        generateImage,
      };

      const { worldId } = await worldCreationService.createWorldFromGeneration(createParams);

      // Set as current world
      worldCreationService.setAsCurrentWorld(worldId);

      updateState({
        isLoading: false,
        isGenerating: false,
        isCreating: false,
        progress: undefined,
      });

      onSuccess?.(worldId);
      return worldId;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during world generation';
      updateState({
        isLoading: false,
        isGenerating: false,
        isCreating: false,
        error: errorMessage,
        progress: undefined,
      });

      onError?.(error instanceof Error ? error : new Error(errorMessage));
      throw error;
    }
  }, [existingNames, generateImage, onSuccess, onError, updateState]);

  // Create world manually
  const createWorld = useCallback(async (
    worldData: WorldCreationData
  ): Promise<string> => {
    try {
      updateState({
        isLoading: true,
        isCreating: true,
        error: null,
        progress: { step: 'Creating world...', details: 'Setting up your world' },
      });

      // Validate data
      const validation = validateWorldCreationData(worldData, existingNames);
      if (!validation.isValid) {
        const errorMessage = Object.values(validation.errors).join(', ');
        throw new Error(`Validation failed: ${errorMessage}`);
      }

      // Create world manually
      const { worldId } = await worldCreationService.createWorldManually({
        name: worldData.name || 'Untitled World',
        description: worldData.description || '',
        genre: worldData.genre || 'fantasy',
        attributes: [],
        skills: [],
        settings: {
          maxAttributes: 6,
          maxSkills: 12,
          attributePointPool: 27,
          skillPointPool: 40,
        },
      });

      // Set as current world
      worldCreationService.setAsCurrentWorld(worldId);

      updateState({
        isLoading: false,
        isCreating: false,
        progress: undefined,
      });

      onSuccess?.(worldId);
      return worldId;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during world creation';
      updateState({
        isLoading: false,
        isCreating: false,
        error: errorMessage,
        progress: undefined,
      });

      onError?.(error instanceof Error ? error : new Error(errorMessage));
      throw error;
    }
  }, [existingNames, onSuccess, onError, updateState]);

  // Clone existing world
  const cloneWorld = useCallback(async (
    sourceWorldId: string,
    modifications: { name: string; description?: string; genre?: string }
  ): Promise<string> => {
    try {
      updateState({
        isLoading: true,
        isCreating: true,
        error: null,
        progress: { step: 'Cloning world...', details: 'Copying world data' },
      });

      const { worldId } = await worldCreationService.cloneWorld(sourceWorldId, modifications);

      updateState({
        isLoading: false,
        isCreating: false,
        progress: undefined,
      });

      onSuccess?.(worldId);
      return worldId;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during world cloning';
      updateState({
        isLoading: false,
        isCreating: false,
        error: errorMessage,
        progress: undefined,
      });

      onError?.(error instanceof Error ? error : new Error(errorMessage));
      throw error;
    }
  }, [onSuccess, onError, updateState]);

  // Validation helper
  const validateData = useCallback((data: WorldCreationData) => {
    return validateWorldCreationData(data, existingNames);
  }, [existingNames]);

  return {
    // State
    ...state,
    
    // Actions
    generateWorld,
    createWorld,
    cloneWorld,
    clearError,
    
    // Utilities
    validateData,
    existingNames,
    
    // Computed state
    isAnyLoading: state.isLoading || state.isGenerating || state.isCreating,
    canCreate: !state.isLoading && !state.isGenerating && !state.isCreating,
  };
}