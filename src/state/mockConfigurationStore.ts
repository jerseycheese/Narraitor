// src/state/mockConfigurationStore.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MockConfiguration, MockScenario } from '@/lib/ai/types';

/**
 * Default mock scenarios for testing various AI response patterns
 */
const DEFAULT_SCENARIOS: MockScenario[] = [
  {
    id: 'success-fast',
    name: 'Fast Success',
    type: 'success',
    delay: 500,
    description: 'Quick successful response with minimal delay'
  },
  {
    id: 'success-normal',
    name: 'Normal Success',
    type: 'success',
    delay: 2000,
    description: 'Normal successful response with realistic delay'
  },
  {
    id: 'success-slow',
    name: 'Slow Success',
    type: 'success',
    delay: 5000,
    description: 'Slow successful response for testing loading states'
  },
  {
    id: 'error-api',
    name: 'API Error',
    type: 'error',
    delay: 1000,
    error: {
      code: 'API_ERROR',
      message: 'Mock API service temporarily unavailable',
      retryable: true
    },
    description: 'Simulates API service error'
  },
  {
    id: 'error-quota',
    name: 'Quota Exceeded',
    type: 'error',
    delay: 500,
    error: {
      code: 'QUOTA_EXCEEDED',
      message: 'Mock API quota exceeded for this hour',
      retryable: false
    },
    description: 'Simulates quota/rate limit error'
  },
  {
    id: 'timeout',
    name: 'Request Timeout',
    type: 'timeout',
    delay: 8000,
    description: 'Simulates network timeout scenario'
  },
  {
    id: 'custom-character',
    name: 'Character Response',
    type: 'custom',
    delay: 1500,
    response: {
      content: `**Zara the Swift**

A nimble rogue with keen eyes and quick reflexes. Her weathered leather armor tells tales of countless adventures, while the twin daggers at her sides promise swift justice to those who would harm the innocent.

*"I've walked these streets since I was old enough to pick a lock. Trust me, I know when something's not right... and right now, everything's screaming danger."*

**Attributes:**
- Agility: Exceptional
- Stealth: Master level  
- Street Knowledge: Extensive
- Moral Compass: Chaotic Good`,
      finishReason: 'STOP',
      promptTokens: 45,
      completionTokens: 128
    },
    description: 'Pre-built character generation response'
  },
  {
    id: 'custom-world',
    name: 'World Description',
    type: 'custom',
    delay: 2000,
    response: {
      content: `**The Shattered Realms**

Once a unified empire, now a collection of floating islands suspended in an endless void by ancient magic. Each realm has adapted to its isolation, developing unique cultures and technologies.

**Notable Locations:**
- *Skyport Haven* - Trading hub built on the largest floating city
- *The Void Watchers* - Monasteries on the smallest, most remote islands
- *Stormcaller's Peak* - Where weather mages maintain the realm's stability

*The wind carries whispers of the old world, and sometimes, if you listen carefully, you can hear the echo of what was lost when the great sundering tore reality apart.*`,
      finishReason: 'STOP',
      promptTokens: 52,
      completionTokens: 145
    },
    description: 'Pre-built world generation response'
  }
];

/**
 * Default mock configuration
 */
const DEFAULT_CONFIGURATION: MockConfiguration = {
  enabled: false,
  activeScenario: 'success-normal',
  scenarios: DEFAULT_SCENARIOS,
  globalDelay: 1000,
  enableDelayVariation: true
};

/**
 * Mock Configuration Store Interface
 */
interface MockConfigurationStore {
  // State
  configuration: MockConfiguration;
  
  // Actions
  enableMock: (enabled: boolean) => void;
  setActiveScenario: (scenarioId: string) => void;
  updateGlobalDelay: (delay: number) => void;
  toggleDelayVariation: () => void;
  
  // Scenario Management
  addScenario: (scenario: Omit<MockScenario, 'id'>) => void;
  updateScenario: (id: string, updates: Partial<MockScenario>) => void;
  deleteScenario: (id: string) => void;
  resetToDefaults: () => void;
  
  // Getters
  getActiveScenario: () => MockScenario | null;
  isEnabled: () => boolean;
  
  // Configuration Management
  exportConfiguration: () => string;
  importConfiguration: (configJson: string) => boolean;
}

/**
 * Zustand store for mock configuration management
 */
export const useMockConfigurationStore = create<MockConfigurationStore>()(
  persist(
    (set, get) => ({
      // Initial state
      configuration: DEFAULT_CONFIGURATION,
      
      // Basic actions
      enableMock: (enabled: boolean) => {
        set(state => ({
          configuration: { ...state.configuration, enabled }
        }));
      },
      
      setActiveScenario: (scenarioId: string) => {
        const { configuration } = get();
        const scenarioExists = configuration.scenarios.some(s => s.id === scenarioId);
        
        if (scenarioExists) {
          set(state => ({
            configuration: { ...state.configuration, activeScenario: scenarioId }
          }));
        }
      },
      
      updateGlobalDelay: (delay: number) => {
        set(state => ({
          configuration: { ...state.configuration, globalDelay: Math.max(0, delay) }
        }));
      },
      
      toggleDelayVariation: () => {
        set(state => ({
          configuration: { 
            ...state.configuration, 
            enableDelayVariation: !state.configuration.enableDelayVariation 
          }
        }));
      },
      
      // Scenario management
      addScenario: (scenarioData) => {
        const id = `custom-${Date.now()}`;
        const scenario: MockScenario = { ...scenarioData, id };
        
        set(state => ({
          configuration: {
            ...state.configuration,
            scenarios: [...state.configuration.scenarios, scenario]
          }
        }));
      },
      
      updateScenario: (id: string, updates) => {
        set(state => ({
          configuration: {
            ...state.configuration,
            scenarios: state.configuration.scenarios.map(s => 
              s.id === id ? { ...s, ...updates } : s
            )
          }
        }));
      },
      
      deleteScenario: (id: string) => {
        set(state => {
          const scenarios = state.configuration.scenarios.filter(s => s.id !== id);
          const activeScenario = state.configuration.activeScenario === id 
            ? 'success-normal' 
            : state.configuration.activeScenario;
          
          return {
            configuration: {
              ...state.configuration,
              scenarios,
              activeScenario
            }
          };
        });
      },
      
      resetToDefaults: () => {
        set({ configuration: DEFAULT_CONFIGURATION });
      },
      
      // Getters
      getActiveScenario: () => {
        const { configuration } = get();
        return configuration.scenarios.find(s => s.id === configuration.activeScenario) || null;
      },
      
      isEnabled: () => {
        return get().configuration.enabled;
      },
      
      // Configuration management
      exportConfiguration: () => {
        const { configuration } = get();
        return JSON.stringify(configuration, null, 2);
      },
      
      importConfiguration: (configJson: string) => {
        try {
          const imported = JSON.parse(configJson) as MockConfiguration;
          
          // Validate the imported configuration
          if (!imported.scenarios || !Array.isArray(imported.scenarios) || 
              typeof imported.enabled !== 'boolean' ||
              typeof imported.activeScenario !== 'string') {
            return false;
          }
          
          // Merge with current configuration to ensure all required fields
          set({
            configuration: {
              ...DEFAULT_CONFIGURATION,
              ...imported,
              // Ensure scenarios have all required fields
              scenarios: imported.scenarios.map(scenario => ({
                ...scenario,
                id: scenario.id || `imported-${Date.now()}`,
                type: scenario.type || 'success'
              }))
            }
          });
          
          return true;
        } catch (error) {
          console.error('Failed to import mock configuration:', error);
          return false;
        }
      }
    }),
    {
      name: 'mock-configuration-storage',
      partialize: (state) => ({ configuration: state.configuration })
    }
  )
);

/**
 * Hook to get current mock configuration
 */
export const useMockConfiguration = () => {
  return useMockConfigurationStore(state => state.configuration);
};

/**
 * Hook to get mock control actions
 */
export const useMockControls = () => {
  return useMockConfigurationStore(state => {
    const {
      enableMock,
      setActiveScenario,
      updateGlobalDelay,
      toggleDelayVariation,
      addScenario,
      updateScenario,
      deleteScenario,
      resetToDefaults,
      getActiveScenario,
      isEnabled,
      exportConfiguration,
      importConfiguration
    } = state;

    return {
      enableMock,
      setActiveScenario,
      updateGlobalDelay,
      toggleDelayVariation,
      addScenario,
      updateScenario,
      deleteScenario,
      resetToDefaults,
      getActiveScenario,
      isEnabled,
      exportConfiguration,
      importConfiguration
    };
  });
};