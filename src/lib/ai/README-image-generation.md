# AI Image Generation Setup

This guide explains how to set up real AI image generation for character portraits using Google's Gemini API.

## Quick Setup

1. **Get a Google AI API Key**:
   - Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key
   - Make sure the key has access to Imagen models

2. **Set up Environment Variables**:
   ```bash
   # Add to your .env.local file
   NEXT_PUBLIC_GEMINI_API_KEY=your_actual_api_key_here
   ```

3. **Test Image Generation**:
   - Create a character in the app
   - Go to the Portrait step
   - Click "Generate Portrait"
   - You should see a real AI-generated image based on your character's details

## How It Works

### Real API Generation
When a valid API key is available, the system:
1. Builds a detailed prompt from character attributes, skills, and background
2. Sends the prompt to the server-side API route (`/api/generate-portrait`)
3. Server calls Google's Gemini 2.0 Flash Image Generation API
4. Returns a real AI-generated portrait image
5. Saves the image as a base64 data URL

### Architecture
```
Browser → /api/generate-portrait → Google Gemini API → Response
```
This server-side proxy approach avoids CORS issues and keeps API keys secure.

### Fallback Behavior
When the API is unavailable or fails:
1. Generates a detailed SVG placeholder based on character description
2. Uses colors and features extracted from the character prompt
3. Includes character name and class indicators
4. Clearly labels as "fallback" mode

### Character-Specific Prompts
The prompt builder creates detailed descriptions like:
```
"detailed character portrait of Elara Moonshadow, wise and mysterious mage 
with high intelligence, skilled in magic and arcana, fantasy art style, 
high quality, detailed"
```

## API Details

### Endpoint
```
https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent
```

### Request Format
```json
{
  "contents": [{
    "parts": [
      { "text": "character description..." }
    ]
  }],
  "generationConfig": {
    "responseModalities": ["TEXT", "IMAGE"]
  }
}
```

### Response Format
```json
{
  "candidates": [{
    "content": {
      "parts": [
        {
          "inlineData": {
            "mimeType": "image/png",
            "data": "base64_image_data..."
          }
        }
      ]
    }
  }]
}
```

## Error Handling

The system gracefully handles various error scenarios:

- **Invalid API Key**: Falls back to intelligent placeholder
- **API Rate Limits**: Shows fallback with retry suggestion
- **Network Issues**: Uses offline fallback generation
- **Content Policy Violations**: Creates safe fallback based on prompt

## Development vs Production

### Development Mode
- Uses mock client that returns test SVG images
- No API calls made during testing
- Consistent results for test reproducibility

### Production Mode
- Makes real API calls to Google's Imagen service
- Generates unique portraits for each character
- Caches generated images in character data

## Troubleshooting

### Debug Mode
With `NEXT_PUBLIC_DEBUG_LOGGING=true` in your `.env.local`, check the browser console for:
- API request/response details
- Error messages with specific failure reasons
- Fallback trigger conditions

### Common Issues

#### "API unavailable" Message
1. **Check API Key**: Verify `NEXT_PUBLIC_GEMINI_API_KEY` is set correctly
2. **Check Browser Console**: Look for specific error messages
3. **Verify API Access**: Test your key at [Google AI Studio](https://makersuite.google.com/)
4. **Check Regional Availability**: Image generation may not be available in all regions

#### Getting Fallback Images Instead of Real Generation
1. **Open Browser DevTools** → Console tab
2. **Generate a portrait** and look for error messages
3. **Common errors**:
   - `400 Bad Request`: Invalid prompt or request format
   - `403 Forbidden`: API key lacks image generation permissions
   - `429 Too Many Requests`: Rate limit exceeded
   - `404 Not Found`: Service not available in your region

#### Slow Generation
- Image generation typically takes 5-15 seconds
- The UI shows a loading spinner during generation
- Network timeouts trigger fallback mode

#### Content Policy Issues
- Avoid overly detailed physical descriptions
- Focus on clothing, expressions, and general appearance
- The system automatically sanitizes prompts for safety

### Testing Your Setup
1. **Open browser console** before generating
2. **Click "Generate Portrait"** in character creation
3. **Look for these logs**:
   ```
   API Response: {candidates: [...]}  // ✅ Success
   API Error Response: {...}          // ❌ API Error
   Image generation error: ...        // ❌ Network/Other Error
   ```

## Cost Considerations

- Google charges per image generation
- Current rate: ~$0.04 per image
- Consider implementing rate limiting for production
- Cache generated images to avoid regeneration

## Future Enhancements

Planned improvements:
- Multiple portrait variations per character
- Style selection (realistic, cartoon, etc.)
- Batch generation for multiple characters
- Integration with character progression (appearance changes)

## Security Notes

- API keys should never be committed to version control
- Use environment variables for all credentials
- Consider using server-side proxy for API calls in production
- Implement rate limiting to prevent abuse