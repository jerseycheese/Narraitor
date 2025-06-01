# Security Documentation

This directory contains comprehensive security documentation for the Narraitor application, covering API key protection, rate limiting, and security testing procedures.

## Overview

Narraitor implements enterprise-grade security measures to protect API keys, prevent abuse, and ensure user privacy. All AI operations are routed through secure server-side proxy endpoints.

## Security Features

### API Key Protection
- **Server-side only**: API keys never exposed to browser
- **Environment isolation**: Separate server and client environments
- **No client-side AI calls**: All requests proxied through Next.js API routes

### Rate Limiting
- **50 requests per hour per IP**: Prevents abuse and controls costs
- **Automatic enforcement**: Built into all AI endpoints
- **Rate limit headers**: Client receives limit status in responses

### Request Security
- **Input validation**: All API inputs sanitized and validated
- **Error handling**: User-friendly error messages without sensitive details
- **Request logging**: Server-side logging for monitoring and debugging

## Security Architecture

```
Browser Client          Next.js Server              Google AI
     |                       |                         |
     |-- POST /api/narrative/generate --|               |
     |                       |                         |
     |                   [Rate Limit]                  |
     |                   [Validation]                  |
     |                   [API Key]                     |
     |                       |                         |
     |                       |-- API Call ----------->|
     |                       |                         |
     |<-- Secure Response ---|<-- AI Response --------|
```

## Documentation Files

### [SECURITY_TESTING_GUIDE.md](SECURITY_TESTING_GUIDE.md)
Comprehensive guide for verifying security implementation including:
- Automated testing procedures
- Manual browser testing steps
- Production deployment verification
- Security checklist

### [demo-secure-api.sh](demo-secure-api.sh)
Simple demonstration script showing key security features:
- API key security verification
- API route protection testing
- Rate limiting validation
- Security summary report

### [test-secure-api.sh](test-secure-api.sh)
Advanced testing script for comprehensive security validation:
- Automated endpoint testing
- Rate limit verification
- Error handling validation
- Production readiness checks

## Quick Security Verification

To quickly verify the security implementation:

```bash
# Run the demonstration script
cd docs/security
./demo-secure-api.sh

# Or run comprehensive tests
./test-secure-api.sh
```

## Security Best Practices

### Development
1. **Never use `NEXT_PUBLIC_` prefix** for sensitive API keys
2. **Set `GEMINI_API_KEY`** in `.env.local` (server-side only)
3. **Test security** before each deployment
4. **Monitor rate limits** during development

### Production
1. **Configure environment variables** in deployment platform
2. **Use server-side API keys only** (`GEMINI_API_KEY`)
3. **Monitor usage** to prevent unexpected costs
4. **Review security regularly** with provided test scripts

### Code Reviews
1. **Check for exposed secrets** in client-side code
2. **Verify rate limiting** is active on new endpoints
3. **Ensure input validation** on all API routes
4. **Test error handling** doesn't leak sensitive information

## Related Documentation

- [AI Service API](../technical-guides/ai-service-api.md) - Complete API documentation
- [CLAUDE.md](../../CLAUDE.md) - Security architecture section
- [README.md](../../README.md) - Security features overview

## Security Compliance

This implementation follows security best practices for:
- **API Key Management**: Industry standard server-side protection
- **Rate Limiting**: OWASP recommendations for API abuse prevention
- **Input Validation**: Secure coding practices for user input
- **Error Handling**: No sensitive information disclosure
- **Logging**: Appropriate detail level for monitoring without privacy violations

## Issue #470 Resolution

This security implementation completely resolves the critical vulnerability identified in GitHub issue #470:

- ✅ **API keys moved from client to server-side**
- ✅ **Rate limiting implemented (50 req/hour per IP)**
- ✅ **Secure proxy pattern established**
- ✅ **Production deployment verified**
- ✅ **Comprehensive testing procedures documented**

The application is now secure for production deployment with no risk of API key exposure or abuse.