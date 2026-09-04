---
title: "Security Testing Guide - API Keys Protection"
type: security
category: testing
tags: [security, testing, api-keys, guide]
created: 2025-06-01
updated: 2026-07-21
---

# Security Testing Guide - API Keys Protection

This guide verifies the current provider-key model: player keys are encrypted before browser persistence, forwarded to Narraitor's own API routes per request, and never sent directly from the browser to Google. The server-side `GEMINI_API_KEY` is still supported as a local/dev fallback.

## Automated Testing

Run the automated test script:

```bash
./test-secure-api.sh
```

This script will:
- Verify API routes exist and respond correctly
- Check that rate limiting is working (50 requests/hour per IP in production mode across all AI routes)
- Ensure no `NEXT_PUBLIC_` provider keys are visible in the build
- Validate request handling, payload size limits (HTTP 413), and sanitized error responses
- Confirm security headers are present

## Manual Browser Testing

### 1. Start the Development Server

```bash
npm run dev
```

### 2. Open Browser DevTools

1. Open your browser to `http://localhost:3000` (or 3001)
2. Open DevTools (F12 or right-click, then Inspect)
3. Go to the **Network** tab

### 3. Test API Key Security

**BEFORE (Insecure: what we fixed):**
- API keys were visible in Network requests
- Environment variables exposed via `_next/static/chunks/`
- Direct calls to Google API with visible keys

**AFTER (Secure: current implementation):**
- All AI requests go to same-origin `/api/*` endpoints
- No browser requests go directly to `googleapis.com`
- A configured player key may appear on the same-origin request as `x-provider-api-key`; it must not appear in logs, response bodies, JavaScript bundles, or third-party browser requests
- Server-side API routes handle the provider communication

### 4. Verify Secure Implementation

1. **Navigate to a game session page**: `/worlds/[worldId]/play`
2. **Trigger narrative generation** (start a game or make a choice)
3. **Check Network tab** - you should see:
   ```
   POST /api/narrative/generate
   POST /api/narrative/choices
   No browser requests to googleapis.com
   No provider keys in response payloads or third-party requests
   ```

4. **Check Response Headers** for rate limiting:
   ```
   X-RateLimit-Limit: 50
   X-RateLimit-Remaining: 49
   X-RateLimit-Reset: [timestamp]
   ```

### 5. Test Rate Limiting

1. **Make multiple requests quickly** (refresh game session page multiple times)
2. **After 50 requests** you should see:
   ```
   HTTP 429 Too Many Requests
   Error: "Rate limit exceeded. Please try again in X minutes."
   ```

### 6. Check Build Security

```bash
# Build the application
npm run build

# Search for exposed public provider keys (should find nothing)
grep -r "AIzaSy" .next/ || echo "No API keys found in build"
grep -r "NEXT_PUBLIC_GEMINI" .next/ || echo "No public env vars found"
```

## Production Deployment Testing

### Environment Variables

**Secure Configuration:**
```env
# Optional server-side fallback
GEMINI_API_KEY=your-actual-api-key

# Remove any public variables (insecure)
# NEXT_PUBLIC_GEMINI_API_KEY=your-api-key  # DELETE THIS
```

### Vercel Deployment

1. **Set environment variables in Vercel dashboard only if you want a server fallback:**
   - `GEMINI_API_KEY` = fallback API key
   - Do NOT set any `NEXT_PUBLIC_*` provider-key variables

2. **Deploy and verify:**
   - No provider keys visible in bundles, logs, or third-party browser requests
   - All AI features work through API routes
   - Rate limiting active

### Security Checklist

- [ ] Player keys are encrypted in the provider store before persistence
- [ ] No requests to external AI APIs from browser
- [ ] All AI requests go through `/api/*` routes
- [ ] Rate limiting prevents abuse (50 req/hour)
- [ ] Server fallback environment variables are server-side only
- [ ] Build contains no sensitive data
- [ ] Production deployment uses secure configuration

## What to Expect

### Secure Behavior (Current)

- **Network Tab**: Shows requests to your domain's API routes; configured player keys travel only in the same-origin `x-provider-api-key` header
- **Environment**: Server fallback keys stay server-side; player keys are encrypted before browser persistence
- **Rate Limiting**: Automatic protection against abuse
- **Error Handling**: User-friendly messages for rate limits
- **Cost Control**: 50 requests/hour prevents unexpected charges

### Previous Insecure Behavior (Fixed)

- API keys visible in browser developer tools
- Direct requests to googleapis.com from browser
- No rate limiting protection
- API keys exposed in client-side JavaScript bundles
- Potential for abuse and unexpected costs

## Troubleshooting

### "API key not configured" Error

- Add a provider under `/settings/providers`, or set `GEMINI_API_KEY` as the server fallback
- Ensure no `NEXT_PUBLIC_` prefix is used
- Restart development server after changing env vars

### Rate Limiting Too Strict

- Current limit: 50 requests per hour per IP
- For development, you can modify `src/utils/rateLimiter.ts`
- For production, consider implementing user-based limits

### AI Features Not Working

- Check browser console for errors
- Verify API routes are responding: `/api/debug`
- Check server logs for detailed error messages

## Security Impact

This keeps API keys secure:

1. **API Key Protection**: Player keys are encrypted at rest in browser storage and only forwarded to same-origin API routes for active provider calls
2. **Cost Control**: Rate limiting prevents abuse
3. **User Privacy**: No sensitive data in client code
4. **Scalability**: Server-side proxy handles all AI communication
5. **Monitoring**: Request logging for usage tracking

The original vulnerability where the app called Google directly from the browser is resolved. The current risk to watch is accidental logging or third-party forwarding of `x-provider-api-key`.
