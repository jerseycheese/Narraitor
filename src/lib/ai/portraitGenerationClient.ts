// src/lib/ai/portraitGenerationClient.ts

import { AIClient, AIImageResponse } from './types';
import { GeminiClient } from './geminiClient';
import { truncate } from '../utils';
import { primitiveColors } from '@/lib/design-tokens';

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
        let errorData;
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
          errorData = await response.json();
        } else {
          // If response is not JSON (like HTML error page), read as text
          const errorText = await response.text();
          console.error('Non-JSON API Error Response:', {
            status: response.status,
            statusText: response.statusText,
            contentType,
            text: truncate(errorText, 500)
          });
          throw new Error(`Image generation failed: ${response.status} ${response.statusText} - Server returned HTML instead of JSON`);
        }
        
        console.error('API Error Response:', errorData);
        throw new Error(`Image generation failed: ${response.status} - ${errorData.error || 'Unknown error'}`);
      }

      const data = await response.json();
      
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
      return { primary: primitiveColors.red[700], secondary: primitiveColors.red[500], accent: primitiveColors.amber[500] };
    }
    if (lowerPrompt.includes('magic') || lowerPrompt.includes('blue') || lowerPrompt.includes('mage') || lowerPrompt.includes('wizard')) {
      return { primary: primitiveColors.blue[700], secondary: primitiveColors.blue[500], accent: primitiveColors.blue[300] };
    }
    if (lowerPrompt.includes('nature') || lowerPrompt.includes('green') || lowerPrompt.includes('druid') || lowerPrompt.includes('ranger')) {
      return { primary: primitiveColors.green[700], secondary: primitiveColors.green[500], accent: primitiveColors.green[200] };
    }
    if (lowerPrompt.includes('shadow') || lowerPrompt.includes('dark') || lowerPrompt.includes('rogue') || lowerPrompt.includes('assassin')) {
      return { primary: primitiveColors.gray[700], secondary: primitiveColors.gray[900], accent: primitiveColors.gray[500] };
    }
    if (lowerPrompt.includes('holy') || lowerPrompt.includes('light') || lowerPrompt.includes('paladin') || lowerPrompt.includes('cleric')) {
      return { primary: primitiveColors.amber[500], secondary: primitiveColors.amber[200], accent: primitiveColors.white };
    }
    
    // Default colors using our design system
    return { primary: primitiveColors.blue[500], secondary: primitiveColors.blue[700], accent: primitiveColors.amber[500] };
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
