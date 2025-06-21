# Manual Verification Steps

## Quick Onboarding Flow Test

### 1. Genre Respected for Original Worlds
- Start onboarding flow (`npm run dev` → browser)
- Choose **"Original World"** 
- Select **"Western"** genre
- Enter world name: "Test"
- Click **"Create World"**
- ✅ **Verify**: Generated world has Western theme (not sci-fi/fantasy)

### 2. Genre Optional for Set Within/Inspired By Worlds  
- Start new onboarding flow
- Choose **"Set Within"** or **"Inspired By"**
- Enter reference: "Star Wars" 
- Enter details: "Clone Wars era" 
- ✅ **Verify**: Genre field shows "(optional - will be inferred from your reference)"
- ✅ **Verify**: Can leave genre empty or select override
- Click **"Create World"**
- ✅ **Verify**: World generated successfully with appropriate genre

### 3. Validation Fixed for Original Worlds
- Start new onboarding flow  
- Choose **"Original World"**
- Leave all fields empty/default
- ✅ **Verify**: No "World concept is required" error
- ✅ **Verify**: Can proceed to next step

## Expected Results
- All user inputs (name, genre, context) influence final world
- No validation errors for original worlds
- Genre field optional for "Set Within" and "Inspired By" with auto-inference
- Users can override auto-detected genre if desired
- Clean onboarding completion

**Total Time**: ~3 minutes