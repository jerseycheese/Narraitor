# Manual Verification Steps

## Quick Onboarding Flow Test

### 1. Genre Respected for Original Worlds
- Start onboarding flow (`npm run dev` → browser)
- Choose **"Original World"** 
- Select **"Western"** genre
- Enter world name: "Test"
- Click **"Create World"**
- ✅ **Verify**: Generated world has Western theme (not sci-fi/fantasy)

### 2. Genre Hidden for Set Within Worlds  
- Start new onboarding flow
- Choose **"Set Within"**
- Enter reference: "Star Wars"
- Enter details: "Tatooine cantina"
- ✅ **Verify**: No genre field shown
- Click **"Create World"**
- ✅ **Verify**: World generated successfully

### 3. Validation Fixed for Original Worlds
- Start new onboarding flow  
- Choose **"Original World"**
- Leave all fields empty/default
- ✅ **Verify**: No "World concept is required" error
- ✅ **Verify**: Can proceed to next step

## Expected Results
- All user inputs (name, genre, context) influence final world
- No validation errors for original worlds
- Genre field hidden for "Set Within" 
- Clean onboarding completion

**Total Time**: ~3 minutes