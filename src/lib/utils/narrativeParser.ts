import { safeTrim } from './formatters';

import Logger from '@/lib/utils/logger';
const logger = new Logger('NarrativeParser');

/**
 * Parse narrative content from AI responses with multiple fallback strategies
 * Handles JSON code blocks, malformed JSON, and control character sanitization
 *
 * It handles various AI response formats and provides graceful fallback mechanisms.
 * 
 * @param content - Raw content from AI response
 * @returns Parsed content string ready for display
 */
export function parseNarrativeContent(content: string): string {
  // Skip parsing if content is empty or not a string
  if (!content || typeof content !== 'string') {
    // Handle non-string input by returning empty string (tests expect this)
    if (typeof content !== 'string') {
      return '';
    }
    return '';
  }
  
  // Handle whitespace-only content
  const trimmedContent = safeTrim(content);
  if (trimmedContent.length === 0) {
    return '';
  }
  
  // If content looks like metadata, return a fallback message
  if (trimmedContent.length < 50 && (
    content.toLowerCase().includes('scene:') || 
    content.toLowerCase().includes('starting location:') ||
    (content.toLowerCase().includes('scene') && trimmedContent.length < 20)
  )) {
    return 'The story is beginning... (Content generation in progress)';
  }
  
  // Check if content starts with ```json
  if (trimmedContent.startsWith('```json')) {
    try {
      // Extract JSON string between backticks
      const jsonStr = trimmedContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      
      // Handle empty JSON content
      if (!jsonStr.trim()) {
        return content; // Return original if empty
      }
      
      // Pre-process JSON string to handle bad control characters
      // Replace control characters that would cause JSON.parse to fail
      const sanitizedJson = jsonStr.replace(/[\u0000-\u001F\u007F-\u009F]/g, ' ');
      
      try {
        const parsed = JSON.parse(sanitizedJson);
        
        // If parsed successfully and has content property, return that
        if (parsed && typeof parsed.content === 'string') {
          return parsed.content;
        } else if (parsed && typeof parsed.text === 'string') {
          // Some models return 'text' instead of 'content'
          return parsed.text;
        } else if (parsed && typeof parsed === 'object') {
          // If we have an object but no direct content field, check for nested structure
          // Common for some AI response formats
          if (parsed.response?.content) return parsed.response.content as string;
          if (parsed.response?.narrative?.content) return parsed.response.narrative.content as string;
          if (parsed.narrative?.content) return parsed.narrative.content as string;
          if (parsed.scene?.description) return parsed.scene.description as string;
          
          // If it's just a string property, return the first one we find
          for (const key in parsed) {
            if (typeof parsed[key] === 'string' && parsed[key].length > 20) {
              return parsed[key];
            }
          }
          
          // If no content found in valid JSON, return original
          return content;
        }
      } catch {
        // If proper JSON parsing fails, try more lenient regex approaches
        logger.warn('Strict JSON parsing failed, trying regex extraction');
        
        // For malformed JSON, try regex extraction
        // Handle incomplete JSON (missing closing quotes/braces)
        
        // First look for content field - handle escaped quotes properly
        const contentMatch = jsonStr.match(/"content"\s*:\s*"((?:[^"\\]|\\.)*)"/);
        if (contentMatch && contentMatch[1]) {
          return contentMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n');
        }
        
        // Then try text field
        const textMatch = jsonStr.match(/"text"\s*:\s*"([^"]*)/);
        if (textMatch && textMatch[1]) {
          return textMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n');
        }
        
        // As a last resort, try to extract any large string (20+ chars)
        const anyStringMatch = jsonStr.match(/"[^"]+"\s*:\s*"([^"]{20,})/);
        if (anyStringMatch && anyStringMatch[1]) {
          return anyStringMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n');
        }
      }
      
      // If all parsing failed, return original
      return content;
    } catch (error) {
      logger.error('Failed to parse code block content:', error);
      return content;
    }
  }
  
  // Final check for raw JSON without code markers
  if (trimmedContent.startsWith('{') && trimmedContent.endsWith('}')) {
    try {
      const parsed = JSON.parse(content);
      if (parsed && typeof parsed.content === 'string') {
        return parsed.content;
      } else if (parsed && typeof parsed.text === 'string') {
        return parsed.text;
      }
    } catch {
      // Ignore error, just return the content as-is
    }
  }
  
  return content;
}
