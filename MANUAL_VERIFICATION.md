# Manual Verification Steps

## Quick Onboarding Flow Test

### 1. Genre Respected for Original Worlds
- Start onboarding flow (`npm run dev` → browser)
- Choose **"Original World"** 
- Select **"Western"** genre
- Enter world name: "Test"
- Click **"Create World"**
- ✅ **Verify**: Generated world has Western theme (not sci-fi/fantasy)

### 2. Smart Field Requirements for Different World Types
- Start new onboarding flow
- Choose **"Set Within"**
- Enter reference: "Star Wars"
- ✅ **Verify**: "Specific Setting/Time" field shows "(optional - will be inferred from your reference)"
- ✅ **Verify**: Genre field shows "(optional - will be inferred from your reference)"
- ✅ **Verify**: Can proceed without filling additional details
- Choose **"Inspired By"**
- Enter reference: "Star Wars"
- ✅ **Verify**: "Additional Details" field shows red asterisk (required)
- ✅ **Verify**: Genre field shows "(optional - will be inferred from your reference)"

### 3. Validation Fixed for Original Worlds
- Start new onboarding flow  
- Choose **"Original World"**
- Leave all fields empty/default
- ✅ **Verify**: No "World concept is required" error
- ✅ **Verify**: Can proceed to next step

## Expected Results
- All user inputs (name, genre, context) influence final world
- No validation errors for original worlds
- Smart field requirements based on world type:
  - **"Original"**: Only name required, genre required
  - **"Set Within"**: Only reference required, setting/time and genre inferred
  - **"Inspired By"**: Reference and details required, genre inferred but can be overridden
- Users can override auto-detected genre if desired
- Clean onboarding completion

**Total Time**: ~3 minutes