import { GeminiClient } from './geminiClient';
import { ClientGeminiClient } from './clientGeminiClient';
import { getDefaultConfig } from './config';
import { AIResponse, AIClient } from './types';

// For development/test environments, use mock implementation
class MockGeminiClient implements AIClient {
  async generateContent(prompt: string): Promise<AIResponse> {
    if (process.env.NODE_ENV === 'development') {
      console.log('Using mock Gemini client');
    }
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Extract world details from the prompt to generate more appropriate content
    const worldName = this.extractDetail(prompt, 'called', '"');
    const genre = this.extractDetail(prompt, 'creating the opening scene for a', 'story');
    
    // Generate appropriate response based on prompt content and world details
    // NOTE: This string matching approach is brittle. Consider refactoring to use
    // explicit context flags or template IDs passed to generateContent() in the future.
    const isInitialScene = prompt.includes('initialScene') || prompt.includes('opening scene');
    const isChoiceGeneration = prompt.includes('create 4 distinct action choices') || 
                              prompt.includes('ALIGNMENT DEFINITIONS') ||
                              prompt.includes('alignedPlayerChoice');
    
    if (isInitialScene) {
      // Generate a scene based on the genre/world name
      const content = this.generateInitialSceneByGenre(genre?.trim(), worldName?.trim());
      return {
        // Return the content directly, not as a JSON string
        content,
        finishReason: 'STOP',
        promptTokens: 100,
        completionTokens: 200
      };
    } else if (isChoiceGeneration) {
      // Handle choice generation
      const content = this.generateChoicesByContext(prompt);
      return {
        content,
        finishReason: 'STOP',
        promptTokens: 120,
        completionTokens: 180
      };
    } else {
      // Handle continuing narrative - check for player action context
      const content = this.generateNarrativeContinuation(prompt, genre?.trim());
      return {
        // Return the content directly, not as a JSON string
        content,
        finishReason: 'STOP',
        promptTokens: 120,
        completionTokens: 180
      };
    }
  }
  
  // Generate context-aware choices based on the prompt
  private generateChoicesByContext(prompt: string): string {
    // Check for specific entities/characters in the context
    const hasDragon = prompt.toLowerCase().includes('dragon');
    const hasBandits = prompt.toLowerCase().includes('bandit');
    const hasMerchant = prompt.toLowerCase().includes('merchant');
    
    if (hasDragon) {
      return `Decision: What will you do?

Options:
1. [LAWFUL] Respectfully accept the dragon's riddle challenge and answer honestly
2. [NEUTRAL] Carefully study the dragon's body language for clues about its intentions
3. [NEUTRAL] Offer a fair trade of knowledge or service for safe passage
4. [CHAOS] Challenge the dragon to a dramatic poetry contest about treasure hoarding`;
    }
    
    if (hasBandits) {
      return `Decision: What will you do?

Options:
1. [LAWFUL] Calmly negotiate and offer to pay a reasonable toll
2. [NEUTRAL] Look for alternative routes through the forest
3. [NEUTRAL] Assess their weapons and numbers before deciding
4. [CHAOS] Start loudly critiquing their bandit fashion choices and technique`;
    }
    
    if (hasMerchant) {
      return `Decision: What will you do?

Options:
1. [LAWFUL] Report the suspicious merchant to the market authorities
2. [NEUTRAL] Politely decline and walk away from the deal
3. [NEUTRAL] Ask detailed questions about the artifact's origin
4. [CHAOS] Announce loudly that you're starting a bidding war for the item`;
    }
    
    // Generic fallback with alignment
    return `Decision: What will you do?

Options:
1. [LAWFUL] Follow proper procedures and seek guidance
2. [NEUTRAL] Carefully assess the situation before acting
3. [NEUTRAL] Look for a practical solution to the problem
4. [CHAOS] Do something completely unexpected to change the dynamic`;
  }
  
  // Generate narrative continuation based on player action context
  private generateNarrativeContinuation(prompt: string, genre?: string): string {
    // Extract player action from the prompt
    const actionMatch = prompt.match(/Player chose: "([^"]+)"/);
    const playerAction = actionMatch ? actionMatch[1] : null;
    
    if (playerAction) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🎮 MOCK CLIENT: Generating narrative for player action:', playerAction);
      }
      
      // Generate contextual narrative based on the player's action
      if (playerAction.toLowerCase().includes('sing') || playerAction.toLowerCase().includes('ballad')) {
        return `Your melodious voice echoes through the forest as you begin an impromptu ballad. The unexpected performance catches everyone off guard - some of the bandits start to lower their weapons, confused by this unusual tactic. The leader scratches his head, clearly not prepared for this kind of encounter.`;
      } else if (playerAction.toLowerCase().includes('mimic') || playerAction.toLowerCase().includes('voice')) {
        return `You begin mimicking voices with surprising accuracy, confusing the search party. They call out to each other uncertainly, unsure which voices are real and which are your imitations. This clever distraction creates chaos in their ranks as they struggle to coordinate.`;
      } else if (playerAction.toLowerCase().includes('negotiate') || playerAction.toLowerCase().includes('peaceful')) {
        return `You approach with your hands raised peacefully, speaking in calm, measured tones. Your diplomatic approach seems to defuse some of the tension, and you notice a few of the group exchanging uncertain glances.`;
      } else if (playerAction.toLowerCase().includes('hide') || playerAction.toLowerCase().includes('stealth')) {
        return `You quickly duck behind the nearest cover, moving as quietly as possible. Your heart pounds as you hear footsteps passing nearby, hoping your hiding spot remains undiscovered.`;
      } else {
        // Generic response for any custom action
        return `You decide to ${playerAction.toLowerCase()}. This unexpected approach changes the dynamic of the situation significantly, and those around you react with surprise to your unconventional choice.`;
      }
    } else {
      // Fallback to genre-based generation if no player action found
      return this.generateContinuationByGenre(genre);
    }
  }
  
  // Helper to extract details from the prompt
  private extractDetail(prompt: string, prefix: string, suffix: string): string | null {
    const prefixIndex = prompt.indexOf(prefix);
    if (prefixIndex === -1) return null;
    
    const startIndex = prefixIndex + prefix.length;
    const endIndex = prompt.indexOf(suffix, startIndex);
    if (endIndex === -1) return null;
    
    return prompt.substring(startIndex, endIndex).trim();
  }
  
  // Generate initial scene based on genre
  private generateInitialSceneByGenre(genre?: string, worldName?: string): string {
    const worldRef = worldName ? ` of ${worldName}` : '';
    
    switch(genre?.toLowerCase()) {
      case 'fantasy':
        return `The ancient forest${worldRef} stretched before you, emerald and gold in dappled sunlight. Towering trees rustled with ancient secrets. In the distance, crystalline spires glimmered like jewels.`;
      
      case 'sci-fi':
      case 'science fiction':
        return `The observation deck offered a view of Nexus Station${worldRef}, gleaming metal and pulsing energy. Beyond it, gas giant Cerulean VI dominated the starscape. Your neural implant pinged softly – an incoming transmission.`;
      
      case 'western':
        return `The sun beat down on the dusty main street of Redemption${worldRef}. A tumbleweed rolled past the saloon where piano notes spilled out with laughter. Your hand moved to your revolver – strangers' horses were tied outside the sheriff's office.`;
      
      case 'horror':
        return `The old mansion${worldRef} loomed against the night sky, windows like dead eyes. Lightning illuminated grotesque gargoyles that seemed to follow you. The iron gate creaked open at your touch, though something warned you to stay away.`;
      
      case 'cyberpunk':
        return `Neon ads bathed the rain-slick streets of Night City${worldRef} in unnatural colors. The megacity's hum vibrated through your cybernetic enhancements. Your HUD highlighted a message from a mysterious fixer – a lucrative job offer.`;
      
      case 'steampunk':
        return `Massive brass gears turned overhead as New Albion${worldRef} released steam into the fog-thick sky. The cobblestone streets teemed with inventors, aristocrats, and their clockwork servants. A bulletin board caught your attention – the Royal Society had posted an unusual request.`;
      
      case 'post-apocalyptic':
        return `The ruins of a once-proud metropolis sprawled before you, nature reclaiming concrete and steel. This was the old world${worldRef}, before the Fall. Your radiation counter ticked as storm clouds gathered – shelter was becoming necessary.`;
      
      default:
        // Default to fantasy if genre not recognized
        return `You stand at the threshold of adventure in ${worldRef}, the path ahead shrouded in promise and peril. Ancient stones mark the boundary between the known world and wilderness beyond. A gentle breeze carries whispers of stories waiting to be told.`;
    }
  }
  
  // Generate continuation content based on genre
  private generateContinuationByGenre(genre?: string): string {
    switch(genre?.toLowerCase()) {
      case 'fantasy':
        return `As you venture deeper into the enchanted forest, the canopy thickens overhead, filtering the sunlight into ethereal beams that dance across the moss-covered ground. Ancient runes carved into the bark of the oldest trees begin to glow with a soft blue light, responding to your presence – or perhaps warning of it. The distant sound of melodic chimes reaches your ears, carried by a wind that seems to whisper forgotten names.`;
      
      case 'sci-fi':
      case 'science fiction':
        return `The security doors hiss open as your clearance is accepted, revealing a laboratory filled with holographic displays and experimental technology. Robotic assistants move with precise efficiency between workstations, while a quantum computer core pulses with energy at the center of the room. Your neural interface connects automatically to the local network, flooding your mind with data streams about the facility's current projects.`;
      
      case 'western':
        return `You push through the saloon's swinging doors, and the piano music falters as all eyes turn to assess the newcomer. The air is thick with tobacco smoke and suspicion. A grizzled man at the bar touches the brim of his hat in acknowledgment, while a table of card players subtly adjust their postures, hands moving closer to concealed weapons. The bartender silently slides a glass your way – a small courtesy that might be the last you receive in these parts.`;
      
      case 'horror':
        return `The floorboards creak beneath your feet as you move down the darkened hallway, the wallpaper peeling away like diseased skin. A child's laughter echoes from somewhere upstairs, though you know the house has been abandoned for decades. The temperature drops suddenly, your breath fogging in the air as the door behind you slams shut with unnatural force. In the corner of your eye, something shifts in the shadows – not moving away, but toward you.`;
      
      case 'cyberpunk':
        return `The club's synthetic beats pound through your chest as you navigate through the crowd of augmented bodies and enhanced minds seeking temporary escape. Bartenders with mechanical arms mix drinks containing substances barely legal, while information brokers in shadowy booths trade data more valuable than currency. Your optic implants scan the faces, filtering through the AR overlays until they lock onto your target – the corporate defector with a head full of proprietary secrets.`;
      
      default:
        return `As you continue your journey, the landscape transforms around you, revealing new wonders and challenges that test your resolve. Each step takes you further from the familiar and deeper into the unknown, where the rules you once knew may no longer apply. A sense of both anticipation and caution fills you as you survey the path ahead, knowing that choices made now will echo throughout your adventure.`;
    }
  }
  
  // Get appropriate mood for genre
  private getMoodForGenre(genre?: string): string {
    switch(genre?.toLowerCase()) {
      case 'horror': return 'tense';
      case 'fantasy': return 'mysterious';
      case 'sci-fi': 
      case 'science fiction': return 'mysterious';
      case 'western': return 'tense';
      case 'cyberpunk': return 'tense';
      case 'post-apocalyptic': return 'tense';
      case 'steampunk': return 'mysterious';
      default: return 'neutral';
    }
  }
  
  // Get appropriate location for genre
  private getLocationForGenre(genre?: string): string {
    switch(genre?.toLowerCase()) {
      case 'fantasy': return 'Enchanted Forest';
      case 'sci-fi': 
      case 'science fiction': return 'Space Station';
      case 'western': return 'Frontier Town';
      case 'horror': return 'Abandoned Mansion';
      case 'cyberpunk': return 'Neon City';
      case 'post-apocalyptic': return 'Ruins';
      case 'steampunk': return 'Victorian Metropolis';
      default: return 'Starting Location';
    }
  }
}

// Create a default instance of GeminiClient for narrative generation
export const createDefaultGeminiClient = () => {
  // In test environment, always use mock client
  if (process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID) {
    console.log("Using mock Gemini client for testing");
    return new MockGeminiClient();
  }
  
  // In browser environment (client-side), use secure proxy
  if (typeof window !== 'undefined') {
    console.log("Using secure client proxy for browser");
    return new ClientGeminiClient();
  }
  
  // Server-side: use real client when API key is available
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MOCK_API_KEY') {
    console.log("Using real Gemini client with server-side API key");
    return new GeminiClient(getDefaultConfig());
  }
  
  // Use mock client when no API key or in development/testing
  console.log("Using mock Gemini client (no API key or development environment)");
  return new MockGeminiClient();
};
