# Portrait Generation API Documentation

## Endpoint Overview

The portrait generation API provides a server-side endpoint for generating character portraits using Google's Gemini API.

### Base URL
```
/api/generate-portrait
```

### Authentication
The API uses environment variables for authentication with Google Gemini. No client-side authentication is required.

## API Reference

### Generate Portrait

Generate an AI portrait based on a text prompt.

```http
POST /api/generate-portrait
Content-Type: application/json
```

#### Request Body

```json
{
  "prompt": "string"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| prompt | string | Yes | The text prompt describing the character portrait to generate |

#### Response

##### Success Response (200 OK)

```json
{
  "image": "data:image/png;base64,/9j/4AAQSkZJRg...",
  "prompt": "The prompt used for generation"
}
```

| Field | Type | Description |
|-------|------|-------------|
| image | string | Base64-encoded image data URL |
| prompt | string | The prompt that was used for generation |

##### Error Responses

###### 400 Bad Request
Missing or invalid prompt parameter.

```json
{
  "error": "Prompt is required"
}
```

###### 500 Internal Server Error
Various server-side errors.

**API Key Not Configured:**
```json
{
  "error": "API key not configured"
}
```

**Gemini API Error:**
```json
{
  "error": "Gemini API failed: 400 Bad Request",
  "details": "Invalid API key provided",
  "apiEndpoint": "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent"
}
```

**No Content in Response:**
```json
{
  "error": "No content in API response",
  "details": "Missing candidates, content, or parts in response"
}
```

**No Image in Response:**
```json
{
  "error": "No image found in API response",
  "details": "Found 2 parts but no image data"
}
```

**General Error:**
```json
{
  "error": "Internal server error",
  "details": "Error message details"
}
```

## OpenAPI Specification

```yaml
openapi: 3.0.0
info:
  title: Portrait Generation API
  version: 1.0.0
  description: API for generating AI character portraits using Google Gemini

servers:
  - url: /api
    description: Next.js API routes

paths:
  /generate-portrait:
    post:
      summary: Generate a character portrait
      description: Generate an AI portrait based on a text prompt using Google Gemini
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - prompt
              properties:
                prompt:
                  type: string
                  description: Text prompt describing the character portrait
                  example: "Fantasy warrior with long dark hair, wearing leather armor"
      responses:
        '200':
          description: Successfully generated portrait
          content:
            application/json:
              schema:
                type: object
                properties:
                  image:
                    type: string
                    description: Base64-encoded image data URL
                    example: "data:image/png;base64,/9j/4AAQSkZJRg..."
                  prompt:
                    type: string
                    description: The prompt used for generation
                    example: "Fantasy warrior with long dark hair, wearing leather armor"
        '400':
          description: Bad request - missing or invalid prompt
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
        '500':
          description: Internal server error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorWithDetails'

components:
  schemas:
    Error:
      type: object
      properties:
        error:
          type: string
          description: Error message
          example: "Prompt is required"
    
    ErrorWithDetails:
      type: object
      properties:
        error:
          type: string
          description: Error message
          example: "Gemini API failed: 400 Bad Request"
        details:
          type: string
          description: Additional error details
          example: "Invalid API key provided"
        apiEndpoint:
          type: string
          description: The API endpoint that failed (optional)
          example: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent"
```

## Environment Variables

The API requires the following environment variables:

| Variable | Description | Required |
|----------|-------------|----------|
| GEMINI_API_KEY | Google Gemini API key (server-side only) | Yes |

**⚠️ Security Note**: Only use `GEMINI_API_KEY` (server-side). Never use `NEXT_PUBLIC_GEMINI_API_KEY` as this exposes your API key to client-side JavaScript, creating a security vulnerability.

## Rate Limiting

The API inherits rate limits from Google Gemini:
- Default: 60 requests per minute
- Burst: Up to 120 requests with backoff
- Daily quota depends on your API plan

## Error Handling Best Practices

When integrating with this API:

1. **Always handle errors gracefully:**
   ```typescript
   try {
     const response = await fetch('/api/generate-portrait', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ prompt })
     });
     
     if (!response.ok) {
       const error = await response.json();
       // Handle error appropriately
       console.error('Portrait generation failed:', error);
       // Fall back to placeholder
     }
   } catch (error) {
     // Network or other errors
     console.error('Request failed:', error);
   }
   ```

2. **Implement retry logic for transient failures:**
   ```typescript
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
         if (response.status === 400) {
           throw new Error('Invalid prompt');
         }
       } catch (error) {
         if (i === maxRetries - 1) throw error;
         // Wait before retry with exponential backoff
         await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
       }
     }
   }
   ```

## Security Considerations

1. **API Key Protection**: Never expose API keys to the client. The endpoint handles all Gemini API communication server-side.

2. **Input Validation**: The endpoint validates that prompts are provided but does not sanitize content. Ensure prompts are appropriate before sending.

3. **Rate Limiting**: Consider implementing application-level rate limiting to prevent abuse.

4. **Content Filtering**: The Gemini API has built-in content filtering, but additional application-level filtering may be appropriate.

## Example Integration

```typescript
// In a React component
const generatePortrait = async (character: Character) => {
  try {
    const prompt = portraitGenerator.buildPortraitPrompt(character);
    
    const response = await fetch('/api/generate-portrait', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });
    
    if (!response.ok) {
      throw new Error('Generation failed');
    }
    
    const { image } = await response.json();
    
    return {
      type: 'ai-generated',
      url: image,
      generatedAt: new Date().toISOString(),
      prompt
    };
  } catch (error) {
    // Return placeholder on failure
    return {
      type: 'placeholder',
      url: null
    };
  }
};
```