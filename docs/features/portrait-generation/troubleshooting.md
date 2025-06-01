# Portrait Generation Troubleshooting Guide

This guide helps resolve common issues with the portrait generation system.

## Common Issues

### 1. API Key Not Configured

**Error Message:**
```json
{
  "error": "API key not configured"
}
```

**Cause:** The Gemini API key is missing or not properly set.

**Solution:**
1. Create a `.env.local` file in your project root
2. Add your Gemini API key:
   ```bash
   GEMINI_API_KEY=your-actual-api-key-here
   # or
   NEXT_PUBLIC_GEMINI_API_KEY=your-actual-api-key-here
   ```
3. Restart your development server
4. Verify the key is loaded:
   ```javascript
   console.log(process.env.GEMINI_API_KEY ? 'Key found' : 'Key missing');
   ```

### 2. API 500 Errors (Issue #406)

**Error Message:**
```json
{
  "error": "Gemini API failed: 500 Internal Server Error",
  "details": "<!DOCTYPE html><html>...",
  "apiEndpoint": "https://generativelanguage.googleapis.com/..."
}
```

**Known Issue:** The API sometimes returns HTML error pages instead of JSON responses.

**Workarounds:**
1. **Retry Logic**: Implement automatic retries with exponential backoff
2. **Fallback Gracefully**: Always show placeholder portraits on failure
3. **Check API Status**: Visit [Google AI Studio](https://makersuite.google.com/) to verify service status

**Temporary Solutions:**
```typescript
// Implement retry logic
async function generateWithRetry(prompt: string, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch('/api/generate-portrait', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      
      if (response.ok) {
        return await response.json();
      }
      
      // Don't retry client errors
      if (response.status >= 400 && response.status < 500) {
        throw new Error(`Client error: ${response.status}`);
      }
      
      // Log server errors but retry
      console.error(`Attempt ${i + 1} failed:`, response.status);
      
    } catch (error) {
      if (i === maxRetries - 1) throw error;
    }
    
    // Exponential backoff
    await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
  }
}
```

### 3. Invalid API Key

**Error Message:**
```json
{
  "error": "Gemini API failed: 400 Bad Request",
  "details": "Invalid API key provided"
}
```

**Solution:**
1. Verify your API key at [Google AI Studio](https://makersuite.google.com/)
2. Ensure the key has the correct permissions
3. Check for extra spaces or characters in the `.env.local` file
4. Try generating a new API key

### 4. No Image in Response

**Error Message:**
```json
{
  "error": "No image found in API response",
  "details": "Found 2 parts but no image data"
}
```

**Possible Causes:**
1. Content was filtered by Gemini's safety settings
2. Prompt was too vague or inappropriate
3. API returned text-only response

**Solutions:**
1. Review your prompt for potentially problematic content
2. Make prompts more specific and descriptive
3. Add safety-appropriate context:
   ```typescript
   // Avoid vague prompts
   ❌ "person"
   ✅ "professional portrait of a business person in formal attire"
   
   // Add appropriate context
   ❌ "warrior covered in blood"
   ✅ "fantasy warrior in battle-worn armor"
   ```

### 5. Slow Generation Times

**Symptoms:** Portrait generation takes longer than 5-10 seconds

**Optimization Strategies:**

1. **Simplify Prompts**: Shorter, focused prompts generate faster
   ```typescript
   // Overly complex
   ❌ "An incredibly detailed ultra-high-resolution 8K masterpiece portrait of..."
   
   // Optimized
   ✅ "Portrait of a fantasy wizard with blue robes and white beard"
   ```

2. **Cache Results**: Store generated portraits to avoid regeneration
   ```typescript
   // Check if portrait already exists
   if (character.portrait?.type === 'ai-generated') {
     return character.portrait;
   }
   ```

3. **Parallel Generation**: For multiple characters, use Promise.all()
   ```typescript
   const portraits = await Promise.all(
     characters.map(char => generatePortrait(char))
   );
   ```

### 6. Portrait Doesn't Match Character

**Symptoms:** Generated portrait doesn't reflect character description

**Common Causes:**
1. Physical description too vague
2. Detection system misidentified character
3. Conflicting description elements

**Solutions:**

1. **Enhance Physical Descriptions**:
   ```typescript
   // Too vague
   ❌ "tall person"
   
   // Specific
   ✅ "tall athletic woman with short black hair and green eyes"
   ```

2. **Debug Detection Results**:
   ```javascript
   // Enable debug logging
   NEXT_PUBLIC_DEBUG_LOGGING=true
   
   // Check detection results in console
   console.log(window.lastDetectionResult);
   ```

3. **Override Detection**: For misidentified characters
   ```typescript
   const portrait = await portraitGenerator.generatePortrait(character, {
     isKnownFigure: false, // Force original character generation
     worldTheme: 'Modern'
   });
   ```

### 7. Browser Storage Issues

**Error:** "Failed to store portrait in IndexedDB"

**Causes:**
1. Storage quota exceeded
2. Private browsing mode
3. Corrupted IndexedDB

**Solutions:**

1. **Check Storage Usage**:
   ```javascript
   if ('storage' in navigator && 'estimate' in navigator.storage) {
     const {usage, quota} = await navigator.storage.estimate();
     console.log(`Using ${usage} out of ${quota} bytes.`);
   }
   ```

2. **Clear Old Data**:
   ```javascript
   // Clear old portraits
   const clearOldPortraits = async () => {
     const characters = characterStore.getState().characters;
     const oneMonthAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
     
     Object.values(characters).forEach(char => {
       if (char.portrait?.generatedAt) {
         const generated = new Date(char.portrait.generatedAt).getTime();
         if (generated < oneMonthAgo) {
           characterStore.getState().updateCharacter(char.id, {
             portrait: { type: 'placeholder', url: null }
           });
         }
       }
     });
   };
   ```

## Testing and Debugging

### Enable Debug Mode

1. Set environment variable:
   ```bash
   NEXT_PUBLIC_DEBUG_LOGGING=true
   ```

2. Check console for:
   - Detection results
   - Generated prompts
   - API responses
   - Error details

### Test with Dev Tools

Use the portrait prompt test page:
```
http://localhost:3000/dev/portrait-prompt-test
```

This page allows you to:
- Test character detection
- Preview generated prompts
- Manually trigger generation
- See debug information

### API Testing with cURL

Test the API endpoint directly:

```bash
# Test with basic prompt
curl -X POST http://localhost:3000/api/generate-portrait \
  -H "Content-Type: application/json" \
  -d '{"prompt": "fantasy wizard portrait"}'

# Test with complex prompt
curl -X POST http://localhost:3000/api/generate-portrait \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Photorealistic portrait of a medieval knight with silver armor"}'
```

## Performance Monitoring

### Track Generation Times

```typescript
const startTime = performance.now();

try {
  const portrait = await portraitGenerator.generatePortrait(character);
  const endTime = performance.now();
  
  console.log(`Portrait generated in ${endTime - startTime}ms`);
  
  // Log slow generations
  if (endTime - startTime > 5000) {
    console.warn('Slow portrait generation:', {
      character: character.name,
      time: endTime - startTime,
      prompt: portrait.prompt
    });
  }
} catch (error) {
  console.error('Generation failed:', error);
}
```

### Monitor Success Rates

```typescript
// Track success/failure rates
let stats = {
  attempts: 0,
  successes: 0,
  failures: 0,
  avgTime: 0
};

// Update stats after each generation
stats.attempts++;
if (success) {
  stats.successes++;
} else {
  stats.failures++;
}

// Log periodic reports
console.log('Portrait Generation Stats:', {
  successRate: (stats.successes / stats.attempts * 100).toFixed(2) + '%',
  failureRate: (stats.failures / stats.attempts * 100).toFixed(2) + '%',
  avgTime: stats.avgTime + 'ms'
});
```

## Best Practices for Error Prevention

1. **Always Use Fallbacks**
   ```typescript
   const portrait = character.portrait || { 
     type: 'placeholder', 
     url: null 
   };
   ```

2. **Validate Before Generation**
   ```typescript
   if (!character.name || !character.background) {
     console.error('Invalid character data');
     return placeholderPortrait;
   }
   ```

3. **Handle Network Issues**
   ```typescript
   if (!navigator.onLine) {
     console.warn('No network connection');
     return placeholderPortrait;
   }
   ```

4. **Set Reasonable Timeouts**
   ```typescript
   const controller = new AbortController();
   const timeout = setTimeout(() => controller.abort(), 15000);
   
   try {
     const response = await fetch('/api/generate-portrait', {
       signal: controller.signal,
       // ... other options
     });
   } finally {
     clearTimeout(timeout);
   }
   ```

## Getting Help

If you continue to experience issues:

1. Check the [GitHub Issues](https://github.com/jerseycheese/narraitor/issues) for similar problems
2. Review recent [Pull Requests](https://github.com/jerseycheese/narraitor/pulls) for fixes
3. Enable debug logging and collect error details
4. Create a new issue with:
   - Error messages
   - Steps to reproduce
   - Character data (anonymized)
   - Environment details

## Related Resources

- [Google AI Studio](https://makersuite.google.com/) - Check API status and test prompts
- [Gemini API Documentation](https://ai.google.dev/docs) - Official API reference
- [Issue #406](https://github.com/jerseycheese/narraitor/issues/406) - Tracking API 500 errors
- [PR #403](https://github.com/jerseycheese/narraitor/pull/403) - Initial implementation details