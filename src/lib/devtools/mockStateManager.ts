// src/lib/devtools/mockStateManager.ts

import { MockScenario } from '../ai/__mocks__/mockScenarios';

/**
 * Mock configuration for DevTools
 */
export interface MockConfiguration {
  isEnabled: boolean;
  activeScenarioId: string;
  customScenarios: MockScenario[];
  settings: {
    delayVariation: boolean;
    variationPercent: number;
    persistSettings: boolean;
  };
}

/**
 * Default mock configuration
 */
const DEFAULT_CONFIG: MockConfiguration = {
  isEnabled: false,
  activeScenarioId: 'success-standard',
  customScenarios: [],
  settings: {
    delayVariation: true,
    variationPercent: 20,
    persistSettings: true
  }
};

/**
 * Storage key for persisting mock configuration
 */
const STORAGE_KEY = 'narraitor-devtools-mock-config';

/**
 * Mock state manager for DevTools integration
 */
export class MockStateManager {
  private static instance: MockStateManager | undefined;
  private config: MockConfiguration;
  private listeners: Set<(config: MockConfiguration) => void> = new Set();

  constructor() {
    this.config = this.loadConfiguration();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): MockStateManager {
    if (!MockStateManager.instance) {
      MockStateManager.instance = new MockStateManager();
    }
    return MockStateManager.instance;
  }

  /**
   * Get current configuration
   */
  getConfiguration(): MockConfiguration {
    return { ...this.config };
  }

  /**
   * Enable or disable mock mode
   */
  setMockEnabled(enabled: boolean): void {
    this.config.isEnabled = enabled;
    this.notifyListeners();
    this.saveConfiguration();
  }

  /**
   * Set active scenario
   */
  setActiveScenario(scenarioId: string): void {
    this.config.activeScenarioId = scenarioId;
    this.notifyListeners();
    this.saveConfiguration();
  }

  /**
   * Add custom scenario
   */
  addCustomScenario(scenario: MockScenario): void {
    // Check if scenario already exists
    const existingIndex = this.config.customScenarios.findIndex(s => s.id === scenario.id);
    
    if (existingIndex >= 0) {
      // Update existing scenario
      this.config.customScenarios[existingIndex] = scenario;
    } else {
      // Add new scenario
      this.config.customScenarios.push(scenario);
    }
    
    this.notifyListeners();
    this.saveConfiguration();
  }

  /**
   * Remove custom scenario
   */
  removeCustomScenario(scenarioId: string): boolean {
    const initialLength = this.config.customScenarios.length;
    this.config.customScenarios = this.config.customScenarios.filter(s => s.id !== scenarioId);
    
    const wasRemoved = this.config.customScenarios.length < initialLength;
    
    if (wasRemoved) {
      // If the removed scenario was active, switch to default
      if (this.config.activeScenarioId === scenarioId) {
        this.config.activeScenarioId = 'success-standard';
      }
      
      this.notifyListeners();
      this.saveConfiguration();
    }
    
    return wasRemoved;
  }

  /**
   * Update settings
   */
  updateSettings(settings: Partial<MockConfiguration['settings']>): void {
    this.config.settings = { ...this.config.settings, ...settings };
    this.notifyListeners();
    this.saveConfiguration();
  }

  /**
   * Reset to default configuration
   */
  reset(): void {
    this.config = { ...DEFAULT_CONFIG };
    this.notifyListeners();
    this.saveConfiguration();
  }

  /**
   * Subscribe to configuration changes
   */
  subscribe(listener: (config: MockConfiguration) => void): () => void {
    this.listeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Import configuration from JSON
   */
  importConfiguration(configJson: string): boolean {
    try {
      const imported = JSON.parse(configJson) as MockConfiguration;
      
      // Validate configuration structure
      if (!this.isValidConfiguration(imported)) {
        return false;
      }
      
      this.config = imported;
      this.notifyListeners();
      this.saveConfiguration();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Export configuration as JSON
   */
  exportConfiguration(): string {
    return JSON.stringify(this.config, null, 2);
  }

  /**
   * Load configuration from localStorage
   */
  private loadConfiguration(): MockConfiguration {
    try {
      if (typeof window === 'undefined') {
        return { ...DEFAULT_CONFIG };
      }

      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        return { ...DEFAULT_CONFIG };
      }

      const parsed = JSON.parse(stored) as MockConfiguration;
      
      // Validate and merge with defaults
      return this.validateAndMergeConfig(parsed);
    } catch {
      return { ...DEFAULT_CONFIG };
    }
  }

  /**
   * Save configuration to localStorage
   */
  private saveConfiguration(): void {
    if (typeof window === 'undefined' || !this.config.settings.persistSettings) {
      return;
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
    } catch (error) {
      console.warn('Failed to save mock configuration:', error);
    }
  }

  /**
   * Notify all listeners of configuration changes
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.getConfiguration());
      } catch (error) {
        console.warn('Mock configuration listener error:', error);
      }
    });
  }

  /**
   * Validate configuration structure
   */
  private isValidConfiguration(config: unknown): config is MockConfiguration {
    return (
      config !== null &&
      typeof config === 'object' &&
      'isEnabled' in config &&
      'activeScenarioId' in config &&
      'customScenarios' in config &&
      'settings' in config &&
      typeof (config as MockConfiguration).isEnabled === 'boolean' &&
      typeof (config as MockConfiguration).activeScenarioId === 'string' &&
      Array.isArray((config as MockConfiguration).customScenarios) &&
      (config as MockConfiguration).settings &&
      typeof (config as MockConfiguration).settings.delayVariation === 'boolean' &&
      typeof (config as MockConfiguration).settings.variationPercent === 'number' &&
      typeof (config as MockConfiguration).settings.persistSettings === 'boolean'
    );
  }

  /**
   * Validate and merge configuration with defaults
   */
  private validateAndMergeConfig(config: Partial<MockConfiguration>): MockConfiguration {
    return {
      isEnabled: config.isEnabled ?? DEFAULT_CONFIG.isEnabled,
      activeScenarioId: config.activeScenarioId ?? DEFAULT_CONFIG.activeScenarioId,
      customScenarios: Array.isArray(config.customScenarios) ? config.customScenarios : DEFAULT_CONFIG.customScenarios,
      settings: {
        delayVariation: config.settings?.delayVariation ?? DEFAULT_CONFIG.settings.delayVariation,
        variationPercent: config.settings?.variationPercent ?? DEFAULT_CONFIG.settings.variationPercent,
        persistSettings: config.settings?.persistSettings ?? DEFAULT_CONFIG.settings.persistSettings
      }
    };
  }
}

/**
 * Global mock state manager instance
 */
export const mockStateManager = MockStateManager.getInstance();