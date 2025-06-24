# Testing & Regression Guide for useState Migration

Quick verification steps to ensure the useState → abstraction hooks migration works correctly.

## Essential Tests

### Build & Core Functionality
```bash
npm run build    # Must complete successfully
npm run test     # Should pass existing tests
npm run dev      # Verify app starts without crashes
```

### Critical User Flows

1. **World Creation** (`/world/create`)
   - Complete wizard from start to finish
   - Verify form validation and state persistence

2. **Character Creation** (`/characters/create`) 
   - Test attribute/skill distribution
   - Verify character saves correctly

3. **Game Session** (`/world/[id]/play`)
   - Start session, make choices, use custom input
   - Test journal modal and session controls

4. **Navigation & Persistence**
   - Navigate between pages rapidly
   - Verify state persists across page refreshes

## Memory Leak Check

Open browser dev tools → Memory tab:
- Navigate through multiple pages
- Force garbage collection
- Verify memory doesn't continuously increase

## Regression Indicators

🚨 **Critical (Block Release)**: Build failures, broken user flows, data persistence issues
⚠️ **Monitor**: Performance degradation, memory increases  
💡 **Minor**: ESLint warnings, UI responsiveness delays