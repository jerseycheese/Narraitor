// src/lib/ai/portraitGenerationClient.ts

import { AIClient, AIImageResponse } from './types';
import { GeminiClient } from './geminiClient';

/**
 * Portrait generation client using Gemini's imagen API
 */
export class PortraitGenerationClient extends GeminiClient implements AIClient {
  async generateImage(prompt: string): Promise<AIImageResponse> {
    try {
      // Use our API route to avoid CORS issues
      const response = await fetch('/api/generate-portrait', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error Response:', errorData);
        throw new Error(`Image generation failed: ${response.status} - ${errorData.error || 'Unknown error'}`);
      }

      const data = await response.json();
      console.log('✅ Portrait generated successfully');
      
      return {
        image: data.image,
        prompt: data.prompt
      };
    } catch (error) {
      console.error('Image generation error:', error);
      
      // Fallback to a detailed, character-specific placeholder
      const fallbackSvg = this.generateFallbackSVG(prompt);
      const svgDataUrl = `data:image/svg+xml;base64,${btoa(fallbackSvg)}`;
      
      return {
        image: svgDataUrl,
        prompt: `${prompt} (fallback - ${error instanceof Error ? error.message : 'API unavailable'})`
      };
    }
  }

  private generateFallbackSVG(prompt: string): string {
    // Create a more detailed fallback based on the character description
    const colors = this.extractColorsFromPrompt(prompt);
    const features = this.extractFeaturesFromPrompt(prompt);
    
    return `
      <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${colors.primary}"/>
            <stop offset="100%" stop-color="${colors.secondary}"/>
          </linearGradient>
          <radialGradient id="lightGrad" cx="30%" cy="30%" r="60%">
            <stop offset="0%" stop-color="white" stop-opacity="0.4"/>
            <stop offset="100%" stop-color="white" stop-opacity="0.1"/>
          </radialGradient>
        </defs>
        
        <!-- Background -->
        <rect width="400" height="400" fill="url(#bgGrad)"/>
        <rect width="400" height="400" fill="url(#lightGrad)"/>
        
        <!-- Character silhouette with more detail -->
        <ellipse cx="200" cy="320" rx="80" ry="60" fill="rgba(255,255,255,0.2)"/>
        <circle cx="200" cy="160" r="60" fill="rgba(255,255,255,0.25)"/>
        
        <!-- Face features -->
        <circle cx="185" cy="145" r="8" fill="rgba(255,255,255,0.6)"/>
        <circle cx="215" cy="145" r="8" fill="rgba(255,255,255,0.6)"/>
        <path d="M 185 175 Q 200 185 215 175" stroke="rgba(255,255,255,0.6)" stroke-width="3" fill="none"/>
        
        <!-- Hair/head details based on description -->
        ${features.hasLongHair ? '<path d="M 160 120 Q 140 100 150 80 Q 200 70 250 80 Q 260 100 240 120" fill="rgba(255,255,255,0.3)"/>' : ''}
        ${features.hasBeard ? '<ellipse cx="200" cy="190" rx="20" ry="15" fill="rgba(255,255,255,0.4)"/>' : ''}
        
        <!-- Equipment/class indicators -->
        ${features.hasWeapon ? '<rect x="160" y="200" width="80" height="8" fill="' + colors.accent + '" rx="4"/>' : ''}
        ${features.isMagical ? '<circle cx="200" cy="100" r="15" fill="' + colors.accent + '" opacity="0.7"/>' : ''}
        
        <!-- Character name if found -->
        <text x="200" y="380" font-family="serif" font-size="16" font-weight="bold" 
              fill="white" text-anchor="middle" opacity="0.9">${features.name || 'Character'}</text>
        
        <!-- Subtitle -->
        <text x="200" y="360" font-family="sans-serif" font-size="12" 
              fill="white" text-anchor="middle" opacity="0.7">AI Portrait (Fallback)</text>
      </svg>
    `;
  }

  private extractColorsFromPrompt(prompt: string): { primary: string; secondary: string; accent: string } {
    const lowerPrompt = prompt.toLowerCase();
    
    // Color mapping based on description
    if (lowerPrompt.includes('fire') || lowerPrompt.includes('red') || lowerPrompt.includes('warrior')) {
      return { primary: '#dc2626', secondary: '#ea580c', accent: '#fbbf24' };
    }
    if (lowerPrompt.includes('magic') || lowerPrompt.includes('blue') || lowerPrompt.includes('mage') || lowerPrompt.includes('wizard')) {
      return { primary: '#2563eb', secondary: '#7c3aed', accent: '#06b6d4' };
    }
    if (lowerPrompt.includes('nature') || lowerPrompt.includes('green') || lowerPrompt.includes('druid') || lowerPrompt.includes('ranger')) {
      return { primary: '#059669', secondary: '#10b981', accent: '#84cc16' };
    }
    if (lowerPrompt.includes('shadow') || lowerPrompt.includes('dark') || lowerPrompt.includes('rogue') || lowerPrompt.includes('assassin')) {
      return { primary: '#374151', secondary: '#1f2937', accent: '#6b7280' };
    }
    if (lowerPrompt.includes('holy') || lowerPrompt.includes('light') || lowerPrompt.includes('paladin') || lowerPrompt.includes('cleric')) {
      return { primary: '#f59e0b', secondary: '#fbbf24', accent: '#ffffff' };
    }
    
    // Default colors
    return { primary: '#6366f1', secondary: '#8b5cf6', accent: '#f59e0b' };
  }

  private extractFeaturesFromPrompt(prompt: string): { 
    name?: string; 
    hasLongHair: boolean; 
    hasBeard: boolean; 
    hasWeapon: boolean; 
    isMagical: boolean;
  } {
    const lowerPrompt = prompt.toLowerCase();
    
    // Extract name
    const nameMatch = prompt.match(/\bof\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/) || 
                     prompt.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/);
    
    return {
      name: nameMatch ? nameMatch[1] : undefined,
      hasLongHair: /long hair|flowing hair|braided|ponytail/.test(lowerPrompt),
      hasBeard: /beard|bearded|facial hair/.test(lowerPrompt),
      hasWeapon: /sword|weapon|axe|bow|dagger|staff/.test(lowerPrompt),
      isMagical: /magic|magical|spell|wizard|mage|arcane|mystical/.test(lowerPrompt)
    };
  }
}