// story-complexity-mapping.js
// This file contains explicit mappings of user stories to complexity and priority
// Based on careful analysis of the requirements documents

/**
 * Map of domain-specific story titles to their complexity and priority
 * Format: { 'domain': { 'partial story title': { complexity: 'Small|Medium|Large', priority: 'High|Medium|Low|Post-MVP' } } }
 */
export const storyMappings = {
  'character-system': {
    // Character Creation
    'create a new character': { complexity: 'Medium', priority: 'High' },
    'allocate attribute points': { complexity: 'Medium', priority: 'High' },
    'select and rate skills': { complexity: 'Medium', priority: 'High' },
    'write a description and background': { complexity: 'Small', priority: 'High' },
    'resume character creation': { complexity: 'Medium', priority: 'Medium' },
    
    // Character Management
    'view all my created characters': { complexity: 'Small', priority: 'High' },
    'edit my existing characters': { complexity: 'Medium', priority: 'High' },
    'delete characters': { complexity: 'Small', priority: 'Medium' },
    
    // Character Selection
    'select a character': { complexity: 'Small', priority: 'High' },
    'see a summary of my character': { complexity: 'Small', priority: 'High' },
    
    // Inventory Management
    'view a list of items': { complexity: 'Small', priority: 'Medium' },
    'add items to my character': { complexity: 'Small', priority: 'Medium' },
    'remove items from my character': { complexity: 'Small', priority: 'Medium' },
    
    // Derived Statistics
    'see key derived statistics': { complexity: 'Medium', priority: 'Medium' },
    'calculate derived stats': { complexity: 'Medium', priority: 'Medium' }
  },
  
  'world-configuration': {
    // World Creation
    'create a new world': { complexity: 'Medium', priority: 'High' },
    'describe it in my own words': { complexity: 'Medium', priority: 'High' },
    'AI to suggest appropriate attributes': { complexity: 'Medium', priority: 'High' },
    'select a pre-defined template': { complexity: 'Small', priority: 'Medium' },
    
    // Attribute Management
    'review and modify AI-suggested attributes': { complexity: 'Medium', priority: 'High' },
    'define custom attributes': { complexity: 'Medium', priority: 'High' },
    'set ranges and default values': { complexity: 'Medium', priority: 'High' },
    
    // Skill Management
    'review and modify AI-suggested skills': { complexity: 'Medium', priority: 'High' },
    'create skills linked to attributes': { complexity: 'Medium', priority: 'High' },
    'organize skills by related attributes': { complexity: 'Medium', priority: 'Medium' },
    
    // World Selection and Management
    'view all my created worlds': { complexity: 'Small', priority: 'High' },
    'edit existing worlds': { complexity: 'Medium', priority: 'Medium' },
    'delete a world': { complexity: 'Small', priority: 'Medium' }
  },
  
  'narrative-engine': {
    // Narrative Generation
    'read engaging narrative content': { complexity: 'Large', priority: 'High' },
    'narrative to acknowledge my character': { complexity: 'Large', priority: 'High' },
    'content that respects my chosen tone': { complexity: 'Medium', priority: 'High' },
    'properly formatted text': { complexity: 'Medium', priority: 'High' },
    
    // Player Choices
    'make meaningful decisions': { complexity: 'Large', priority: 'High' },
    'clear choices that represent different approaches': { complexity: 'Medium', priority: 'High' },
    'see the consequences of my decisions': { complexity: 'Large', priority: 'High' },
    
    // Narrative Flow
    'smooth transitions between scenes': { complexity: 'Medium', priority: 'Medium' },
    'narrative to remember important decisions': { complexity: 'Large', priority: 'High' },
    'maintain narrative consistency': { complexity: 'Large', priority: 'Medium' },
    
    // Error Handling
    'graceful error handling': { complexity: 'Medium', priority: 'High' },
    'fallback content': { complexity: 'Medium', priority: 'Medium' },
    'clear error messages': { complexity: 'Small', priority: 'Medium' },
    
    // Additional Features
    'generate narrative content': { complexity: 'Large', priority: 'High' },
    'integrate character attributes': { complexity: 'Large', priority: 'High' },
    'create scenes': { complexity: 'Large', priority: 'High' },
    'generate dialog': { complexity: 'Large', priority: 'Medium' }
  },
  
  'state-management': {
    // Campaign Management
    'create a new campaign': { complexity: 'Medium', priority: 'High' },
    'continue an existing campaign': { complexity: 'Medium', priority: 'High' },
    'delete campaigns': { complexity: 'Small', priority: 'Medium' },
    
    // State Persistence
    'game state to automatically save': { complexity: 'Large', priority: 'High' },
    'notified when my game is saved': { complexity: 'Small', priority: 'Medium' },
    'safely resume interrupted sessions': { complexity: 'Medium', priority: 'High' },
    
    // Error Recovery
    'handle storage failures gracefully': { complexity: 'Medium', priority: 'High' },
    'recover from browser crashes': { complexity: 'Medium', priority: 'High' },
    'clear error messages': { complexity: 'Small', priority: 'Medium' },
    
    // Development Support
    'debug and inspect application state': { complexity: 'Medium', priority: 'Medium' },
    'track state changes': { complexity: 'Medium', priority: 'Medium' },
    'type-safe state operations': { complexity: 'Medium', priority: 'High' },
    
    // Core Functionality
    'persist game state': { complexity: 'Large', priority: 'High' },
    'restore from saved state': { complexity: 'Medium', priority: 'High' },
    'track narrative variables': { complexity: 'Large', priority: 'High' },
    'manage multiple save states': { complexity: 'Medium', priority: 'Medium' }
  },
  
  'devtools': {
    // DevTools UI
    'toggle the DevTools panel': { complexity: 'Small', priority: 'High' },
    'collapse and expand sections': { complexity: 'Small', priority: 'Medium' },
    'debug-only components with visibility toggles': { complexity: 'Medium', priority: 'Medium' },
    
    // State Inspection
    'view the complete application state': { complexity: 'Medium', priority: 'High' },
    'basic state modification capabilities': { complexity: 'Medium', priority: 'Medium' },
    'visually explore the state tree': { complexity: 'Medium', priority: 'Medium' },
    
    // Narrative and Decision Testing
    'test narrative generation': { complexity: 'Medium', priority: 'High' },
    'trigger test decisions': { complexity: 'Medium', priority: 'Medium' },
    'analyze narrative content patterns': { complexity: 'Medium', priority: 'Low' },
    
    // AI Service Debugging
    'monitor AI service requests': { complexity: 'Medium', priority: 'High' },
    'view errors from AI service calls': { complexity: 'Medium', priority: 'High' },
    'mock AI responses': { complexity: 'Medium', priority: 'Medium' },
    
    // Performance and Error Monitoring
    'view basic performance metrics': { complexity: 'Medium', priority: 'Medium' },
    'comprehensive error reporting': { complexity: 'Medium', priority: 'High' },
    'capture and display runtime errors': { complexity: 'Medium', priority: 'High' },
    
    // Browser Console API
    'programmatic access to debugging functions': { complexity: 'Medium', priority: 'High' },
    'access state inspection methods': { complexity: 'Small', priority: 'Medium' },
    'trigger game operations via the console': { complexity: 'Medium', priority: 'Medium' },
    
    // Additional Features
    'debug game state': { complexity: 'Medium', priority: 'Medium' },
    'test narrative branches': { complexity: 'Medium', priority: 'Medium' },
    'inject test data': { complexity: 'Small', priority: 'Medium' },
    'inspect AI decisions': { complexity: 'Medium', priority: 'Medium' }
  },
  
  'utilities-and-helpers': {
    // Error Handling
    'create standardized error objects': { complexity: 'Small', priority: 'High' },
    'categorize errors by type': { complexity: 'Small', priority: 'Medium' },
    'simple retry determination': { complexity: 'Small', priority: 'Medium' },
    
    // Storage
    'type-safe IndexedDB wrapper': { complexity: 'Medium', priority: 'High' },
    'robust error handling for storage': { complexity: 'Medium', priority: 'High' },
    'safely accessing nested properties': { complexity: 'Small', priority: 'Medium' },
    
    // Text Processing
    'clean metadata from AI-generated content': { complexity: 'Small', priority: 'High' },
    'normalize text formats': { complexity: 'Small', priority: 'Medium' },
    'extract relevant information from responses': { complexity: 'Medium', priority: 'Medium' },
    
    // Debugging
    'console logging with severity levels': { complexity: 'Small', priority: 'Medium' },
    'performance measurement utilities': { complexity: 'Medium', priority: 'Medium' },
    'state inspection utilities': { complexity: 'Medium', priority: 'Medium' },
    
    // AI Service Support
    'retry logic with backoff strategy': { complexity: 'Medium', priority: 'High' },
    'context optimization utilities': { complexity: 'Medium', priority: 'High' },
    'response validation tools': { complexity: 'Medium', priority: 'Medium' },
    
    // General Utilities
    'UUID generation': { complexity: 'Small', priority: 'High' },
    'type guards for core domain objects': { complexity: 'Small', priority: 'High' },
    'string and date formatting helpers': { complexity: 'Small', priority: 'Medium' },
    
    // Additional Features
    'helper function': { complexity: 'Small', priority: 'Medium' },
    'utility to format': { complexity: 'Small', priority: 'Medium' },
    'tool for generating': { complexity: 'Medium', priority: 'Medium' },
    'reusable component': { complexity: 'Medium', priority: 'Medium' }
  },
  
  'journal-system': {
    'view my journal entries': { complexity: 'Small', priority: 'High' },
    'create a new journal entry': { complexity: 'Small', priority: 'High' },
    'edit an existing entry': { complexity: 'Small', priority: 'Medium' },
    'delete a journal entry': { complexity: 'Small', priority: 'Medium' },
    'automatic journal events': { complexity: 'Medium', priority: 'Medium' }
  },
  
  'decision-relevance-system': {
    'track player decisions': { complexity: 'Medium', priority: 'High' },
    'see how my choices': { complexity: 'Medium', priority: 'High' },
    'understand the impact': { complexity: 'Large', priority: 'Medium' },
    'review past decisions': { complexity: 'Medium', priority: 'Medium' }
  },
  
  'player-decision-system': {
    'make decisions': { complexity: 'Medium', priority: 'High' },
    'see decision consequences': { complexity: 'Medium', priority: 'High' },
    'be presented with choices': { complexity: 'Medium', priority: 'High' },
    'make character-appropriate decisions': { complexity: 'Large', priority: 'Medium' }
  },
  
  'inventory-system': {
    'view items': { complexity: 'Small', priority: 'Medium' },
    'add items': { complexity: 'Small', priority: 'Medium' },
    'remove items': { complexity: 'Small', priority: 'Medium' },
    'unequip items': { complexity: 'Small', priority: 'Medium' },
    'equip items': { complexity: 'Medium', priority: 'Medium' }
  },
  
  'lore-management-system': {
    'add lore entries': { complexity: 'Small', priority: 'Medium' },
    'view lore database': { complexity: 'Small', priority: 'Medium' },
    'search lore': { complexity: 'Medium', priority: 'Low' },
    'organize lore': { complexity: 'Medium', priority: 'Low' },
    'link lore entries': { complexity: 'Medium', priority: 'Low' }
  }
};

/**
 * Find the matching complexity and priority for a story based on its content and domain
 * @param {string} storyContent - The user story text content
 * @param {string} domain - The domain the story belongs to
 * @returns {Object} - { complexity, priority }
 */
export function getStoryComplexityAndPriority(storyContent, domain) {
  if (!storyContent || !domain) {
    return { complexity: 'Medium', priority: 'Medium' }; // Default fallback
  }
  
  const lowerStory = storyContent.toLowerCase();
  const domainMappings = storyMappings[domain] || {};
  
  // Find the first mapping that matches the story content
  for (const [partialTitle, values] of Object.entries(domainMappings)) {
    if (lowerStory.includes(partialTitle.toLowerCase())) {
      return values;
    }
  }
  
  // If we reach here, no specific mapping was found
  // Make a default mapping based on domain complexity
  const domainComplexity = {
    'narrative-engine': 'Large',
    'state-management': 'Large',
    'decision-relevance-system': 'Medium',
    'player-decision-system': 'Medium', 
    'character-system': 'Medium',
    'world-configuration': 'Medium',
    'journal-system': 'Small',
    'inventory-system': 'Small',
    'lore-management-system': 'Small',
    'utilities-and-helpers': 'Small',
    'devtools': 'Small'
  };
  
  return { 
    complexity: domainComplexity[domain] || 'Medium',
    priority: 'Medium' // Default priority
  };
}