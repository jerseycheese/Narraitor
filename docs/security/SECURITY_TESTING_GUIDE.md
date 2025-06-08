---
title: "Security Testing Guide - API Keys Protection"
type: security
category: testing
tags: [security, testing, api-keys, guide]
created: 2025-06-01
updated: 2025-06-08
---

# Security Testing Guide - API Keys Protection

This guide shows you how to verify that the API keys are now secure and not exposed to the browser.

## Automated Testing

Run the automated test script:

```bash
./test-secure-api.sh
```

This script will:
- ✅ Verify API routes exist and respond correctly
- ✅ Check that rate limiting is working (50 requests/hour per IP)
- ✅ Ensure no API keys are visible in the build
- ✅ Validate request handling and error responses
- ✅ Confirm security headers are present

## Manual Browser Testing

### 1. Start the Development Server

```bash
npm run dev
```

### 2. Open Browser DevTools

1. Open your browser to `http://localhost:3000` (or 3001)
2. Open DevTools (F12 or right-click → Inspect)
3. Go to the **Network** tab

### 3. Test API Key Security

**BEFORE (Insecure - what we fixed):**
- API keys were visible in Network requests
- Environment variables exposed via `_next/static/chunks/`
- Direct calls to Google API with visible keys

**AFTER (Secure - current implementation):**
- All requests go to `/api/narrative/*` endpoints
- No Google API URLs visible in Network tab
- No API keys visible anywhere in requests
- Server-side proxy handles all AI communication

### 4. Verify Secure Implementation

1. **Navigate to a game session page**: `/world/[worldId]/play`
2. **Trigger narrative generation** (start a game or make a choice)
3. **Check Network tab** - you should see:
   ```
   ✅ POST /api/narrative/generate
   ✅ POST /api/narrative/choices
   ✅ No requests to googleapis.com
   ✅ No visible API keys in any request
   ```

4. **Check Response Headers** for rate limiting:
   ```
   ✅ X-RateLimit-Limit: 50
   ✅ X-RateLimit-Remaining: 49
   ✅ X-RateLimit-Reset: [timestamp]
   ```

### 5. Test Rate Limiting

1. **Make multiple requests quickly** (refresh game session page multiple times)
2. **After 50 requests** you should see:
   ```
   ❌ HTTP 429 Too Many Requests
   ❌ Error: "Rate limit exceeded. Please try again in X minutes."
   ```

### 6. Check Build Security

```bash
# Build the application
npm run build

# Search for any exposed API keys (should find nothing)
grep -r "AIzaSy" .next/ || echo "✅ No API keys found in build"
grep -r "NEXT_PUBLIC_GEMINI" .next/ || echo "✅ No public env vars found"
```

## Production Deployment Testing

### Environment Variables

**Secure Configuration:**
```env
# ✅ Server-side only (secure)
GEMINI_API_KEY=your-actual-api-key

# ❌ Remove any public variables (insecure)
# NEXT_PUBLIC_GEMINI_API_KEY=your-api-key  # DELETE THIS
```

### Vercel Deployment

1. **Set environment variables in Vercel dashboard:**
   - `GEMINI_API_KEY` = your API key
   - Do NOT set any `NEXT_PUBLIC_*` variables

2. **Deploy and verify:**
   - No API keys visible in browser
   - All AI features work through API routes
   - Rate limiting active

### Security Checklist

- [ ] No API keys visible in browser DevTools
- [ ] No requests to external AI APIs from browser
- [ ] All AI requests go through `/api/*` routes
- [ ] Rate limiting prevents abuse (50 req/hour)
- [ ] Environment variables are server-side only
- [ ] Build contains no sensitive data
- [ ] Production deployment uses secure configuration

## What to Expect

### ✅ Secure Behavior (Current)

- **Network Tab**: Only shows requests to your domain's API routes
- **Environment**: API keys stored server-side only
- **Rate Limiting**: Automatic protection against abuse
- **Error Handling**: User-friendly messages for rate limits
- **Cost Control**: 50 requests/hour prevents unexpected charges

### ❌ Previous Insecure Behavior (Fixed)

- API keys visible in browser developer tools
- Direct requests to googleapis.com from browser
- No rate limiting protection
- API keys exposed in client-side JavaScript bundles
- Potential for abuse and unexpected costs

## Troubleshooting

### "API key not configured" Error

- Check that `GEMINI_API_KEY` is set in your environment
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

This implementation provides enterprise-grade security:

1. **API Key Protection**: Keys never leave the server
2. **Cost Control**: Rate limiting prevents abuse
3. **User Privacy**: No sensitive data in client code
4. **Scalability**: Server-side proxy handles all AI communication
5. **Monitoring**: Request logging for usage tracking

The security vulnerability where API keys were exposed to users has been completely resolved.