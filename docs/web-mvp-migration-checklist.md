# Web MVP Migration Checklist

## 🔄 Immediate Code Changes

### Update next.config.js
```javascript
const nextConfig = {
  // Web optimizations
  swcMinify: true,
  reactStrictMode: true,
  // Add performance optimizations
  images: {
    domains: ['your-image-domain.com'], // Add as needed
  }
}
```

### Clean Up Package.json Scripts
```json
{
  "scripts": {
    // Core scripts
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "jest",
    "test:coverage": "jest --coverage",
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build",
    "lint": "next lint"
  }
}
```

## 📁 File Structure Updates

### Current Structure (Keep)
- `/src/app/` - Next.js App Router pages
- `/src/components/` - Shared UI components
- `/src/lib/` - Utilities and services
- `/src/state/` - Zustand stores
- `/src/types/` - TypeScript definitions
- `/src/hooks/` - Custom React hooks

### Add These New Directories
- `/src/components/journal/` - Journal UI components
- `/src/components/navigation/` - Enhanced navigation components
- `/src/components/launch/` - Landing page components
- `/src/lib/payments/` - Payment integration
- `/src/lib/analytics/` - Analytics setup

## 🎨 UI/UX Adjustments

### Desktop-First Design
- [ ] Base font size optimized for desktop reading (16px+)
- [ ] Content width appropriate for desktop (max-width: 1200px)
- [ ] Multi-column layouts for dashboard views
- [ ] Hover states for all interactive elements
- [ ] Focus indicators for keyboard navigation
- [ ] Tooltip hints for complex interactions

### Navigation Improvements
- [ ] Fix world switcher dropdown behavior
- [ ] Add keyboard shortcuts (Cmd/Ctrl + K for quick actions)
- [ ] Breadcrumb navigation for deep pages
- [ ] Persistent navigation state
- [ ] Loading states for route transitions

## 🧩 MVP Feature Implementation

### 1. Complete Navigation System
```typescript
// Priority fixes for Week 1
- World switcher dropdown closing issue (#432)
- Mobile responsive navigation
- Breadcrumb improvements
- Keyboard navigation support
```

### 2. Journal UI Components
```typescript
// New components needed (Week 2-3)
- JournalPanel.tsx (collapsible for gameplay)
- JournalList.tsx (chronological entries)
- JournalEntry.tsx (formatted detail view)
- JournalFilters.tsx (post-MVP, prepare interface)
```

### 3. Character UI Completion
```typescript
// Character system UI (Week 1-2)
- CharacterView.tsx (#256)
- CharacterEdit.tsx (#305)
- CharacterStats.tsx
- CharacterSkills.tsx
```

### 4. Launch Components
```typescript
// Marketing and onboarding (Week 5-6)
- LandingPage.tsx
- PricingSection.tsx
- GettingStarted.tsx
- PaymentModal.tsx
```

## 🧪 Testing Updates

### MVP Test Coverage
- [ ] Navigation flow tests
- [ ] Journal UI component tests
- [ ] Character viewing/editing tests
- [ ] Payment flow tests (with mocks)
- [ ] End-to-end critical paths

### Test Commands
```bash
# Run all tests
npm test

# Run specific test suites
npm test -- navigation
npm test -- journal
npm test -- character

# E2E tests
npm run test:e2e:critical
```

## 📝 Documentation Updates

### Week 1-2 Documentation
- [ ] Update README.md with web-first approach
- [ ] Create CONTRIBUTING.md for beta testers
- [ ] Document navigation patterns
- [ ] Journal system user guide

### Week 5-6 Documentation
- [ ] Getting started guide
- [ ] World creation tutorial
- [ ] Character creation guide
- [ ] FAQ document

## 🚀 Deployment Configuration

### Vercel Setup (Week 6)
```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "env": {
    "NEXT_PUBLIC_APP_VERSION": "@version",
    "NEXT_PUBLIC_API_URL": "@api_url"
  }
}
```

### Environment Variables
```bash
# .env.local
GEMINI_API_KEY=your-key-here
NEXT_PUBLIC_APP_ENV=production
DATABASE_URL=your-db-url
PAYMENT_SECRET_KEY=your-payment-key
ANALYTICS_ID=your-analytics-id
```

## 🚦 Launch Preparation Checklist

### Week 5-6: Pre-Launch Setup
- [ ] Payment provider account setup
- [ ] Analytics integration
- [ ] Error tracking setup (Sentry)
- [ ] Support email/system
- [ ] Terms of Service & Privacy Policy

### Week 7: Beta Testing
- [ ] Invite 10-20 friends/testers
- [ ] Set up feedback channel (Discord/Slack)
- [ ] Monitor error logs
- [ ] Daily bug fix deployments
- [ ] Performance monitoring

### Week 8: Public Launch
- [ ] Enable payment processing
- [ ] Announce in communities
- [ ] Monitor user onboarding
- [ ] Respond to feedback quickly
- [ ] Track key metrics

## ✅ Weekly Verification Checklist

### Week 1-2 Verification
- [ ] Navigation improvements complete
- [ ] Character UI functional
- [ ] Journal UI components ready
- [ ] All tests passing

### Week 3-4 Verification  
- [ ] Narrative ending system working (#462)
- [ ] Journal integrated in gameplay (#278)
- [ ] Decision points clear (#248)
- [ ] Responsive design verified

### Week 5-6 Verification
- [ ] Landing page complete
- [ ] Documentation ready
- [ ] Payment integration tested
- [ ] Analytics tracking confirmed

### Week 7-8 Verification
- [ ] Beta feedback incorporated
- [ ] Critical bugs fixed
- [ ] Payment flow working
- [ ] Ready for public launch

## 🎯 MVP Complete When...

1. **Core Features Working**
   - World creation with AI assistance
   - Character creation and management
   - Narrative gameplay with endings
   - Journal tracking history
   - Navigation intuitive and bug-free

2. **Quality Standards Met**
   - No critical bugs
   - Page loads < 3 seconds
   - Responsive on all devices
   - Error messages helpful
   - Accessibility standards met

3. **Launch Ready**
   - Payment system tested
   - Documentation complete
   - Support channel active
   - Analytics tracking
   - Marketing page live

## 📊 Success Metrics

### Beta Phase (Week 7)
- 10+ active testers
- 90% completion rate for first session
- Average session > 20 minutes
- Positive feedback on fun factor

### Launch Phase (Week 8)
- First paying customer within 48 hours
- 100 users in first week
- 10% conversion to paid
- < 5% critical bug reports

### Growth Phase (Post-MVP)
- $1000 MRR within 30 days
- 80% monthly retention
- 4.5+ star average rating
- Organic user referrals

---

**Last Updated**: January 2025  
**Next Review**: Post-beta launch (Week 7)
