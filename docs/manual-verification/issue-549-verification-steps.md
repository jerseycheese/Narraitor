# Manual Verification Steps - Issue #549: Skill-Based Narrative Choices

## Overview
These steps verify that the AI generates skill-based choices and acknowledges skill usage in narrative generation.

## Prerequisites
1. Start the development server: `npm run dev`
2. Create a test world with skills defined
3. Create a test character with various skill levels
4. Have a game session ready for testing

## Verification Steps

### Stage 1: Skill-Based Choice Generation

#### Test 1: AI Generates Choices with Skill Requirements
1. **Setup**: Create a world with skills (Athletics, Magic, Stealth, Persuasion)
2. **Action**: Start a narrative that involves a challenge (locked door, cliff, social encounter)
3. **Expected**: 
   - AI should generate 3-4 choices
   - At least 1-2 choices should have skill requirements (e.g., "Climb the wall [Athletics 5+]")
   - Skills should match the narrative context logically
   - Mix of skill-required and accessible choices

#### Test 2: Skill Difficulty Matches Context
1. **Setup**: Create scenarios of varying difficulty
2. **Test Scenarios**:
   - **Easy**: Simple lock → Should see "Lockpicking 3+" or "Lockpicking 4+"
   - **Moderate**: Standard challenge → Should see "Athletics 5+" or "Athletics 6+"  
   - **Hard**: Major obstacle → Should see "Magic 7+" or "Magic 8+"
   - **Very Hard**: Epic challenge → Should see "Persuasion 9+" or higher
3. **Expected**: Difficulty levels should feel appropriate to the narrative stakes

#### Test 3: AI Varies Skill Requirements
1. **Setup**: Multiple choice generations in same session
2. **Action**: Generate choices 3-4 times in sequence
3. **Expected**: 
   - Different skills should be featured across generations
   - Not every choice should require the same skill
   - Should see variety like Athletics → Magic → Stealth → Persuasion

### Stage 2: Skill Acknowledgment in Narrative

#### Test 4: Successful Skill Usage Acknowledgment
1. **Setup**: Character with high Athletics skill (8+)
2. **Action**: 
   - Choose an Athletics-based option that the character can pass
   - Generate the next narrative segment
3. **Expected**:
   - Narrative should acknowledge the character's athletic competence
   - Text should reference training, expertise, or skill mastery
   - Examples: "Your training pays off...", "Years of practice show...", "Your expertise becomes evident..."
   - Tone should be triumphant or confident

#### Test 5: Failed Skill Usage Acknowledgment  
1. **Setup**: Character with low Magic skill (2-3)
2. **Action**:
   - Choose a Magic option requiring higher skill level
   - Generate the next narrative segment
3. **Expected**:
   - Narrative should acknowledge the attempt while showing why it failed
   - Should be constructive, not overly punishing
   - Examples: "Despite your efforts...", "You realize you need more practice...", "The technique requires refinement..."
   - Should provide learning opportunity context

#### Test 6: Custom Action Skill Recognition
1. **Setup**: Game session with custom text input enabled
2. **Action**: 
   - Enter a custom action that implies skill usage: "I carefully pick the lock using my tools"
   - Generate narrative response
3. **Expected**:
   - AI should recognize the implicit skill usage (lockpicking)
   - Narrative should reference the character's relevant abilities
   - Should feel authentic to the character's skill set

### Stage 3: Integration and Flow Testing

#### Test 7: Natural Narrative Flow
1. **Action**: Play through 5-6 narrative segments using skill-based choices
2. **Expected**:
   - Skill requirements should feel natural, not forced
   - Acknowledgments should integrate smoothly into story flow
   - No obvious AI "tells" or unnatural phrasing
   - Story progression should feel coherent

#### Test 8: World Without Skills Handling
1. **Setup**: Create a world with no skills defined
2. **Action**: Generate narrative choices
3. **Expected**:
   - Should generate normal choices without skill requirements
   - No errors or broken functionality
   - Graceful degradation to standard choice generation

#### Test 9: Character Without Skills Handling
1. **Setup**: Character with no skills assigned
2. **Action**: Generate choices and narrative
3. **Expected**:
   - Should work normally without skill context
   - No crashes or undefined behavior
   - Falls back to non-skill-based generation

### Stage 4: Edge Cases and Error Handling

#### Test 10: Mixed Skill Availability
1. **Setup**: Character with some high skills, some low skills
2. **Action**: Generate choices requiring various skills
3. **Expected**:
   - Should see mix of available and unavailable options
   - UI should clearly indicate which skills the character can/cannot meet
   - Story should acknowledge character's strengths and weaknesses

#### Test 11: AI Generation Failure Fallback
1. **Setup**: Force AI generation failure (disconnect network temporarily)
2. **Action**: Try to generate skill-based choices
3. **Expected**:
   - Should fall back to default choice generation
   - Fallback choices should still include some skill-based options when possible
   - No application crashes

### Stage 5: Performance and User Experience

#### Test 12: Response Time
1. **Action**: Generate skill-based choices multiple times
2. **Expected**:
   - Response time should be similar to normal choice generation
   - No significant performance degradation
   - Loading states should work properly

#### Test 13: Skill Requirement Display
1. **Action**: Generate choices with skill requirements
2. **Expected**:
   - Skill requirements should be clearly visible in UI
   - Available/unavailable skills should be distinguishable (disabled badges)
   - Character skills that don't meet requirements should show disabled state
   - Hints should provide helpful context without spoiling outcomes

## Success Criteria
- ✅ AI consistently generates appropriate skill requirements
- ✅ Skill difficulties match narrative stakes
- ✅ Success/failure acknowledgments feel natural and meaningful
- ✅ Custom actions trigger appropriate skill recognition
- ✅ Multiple skills are utilized across different scenarios
- ✅ Graceful handling of edge cases (no skills, no character skills)
- ✅ Performance remains acceptable
- ✅ User experience feels seamless and immersive

## Troubleshooting Common Issues

### Issue: No skill requirements appearing
- **Check**: World has skills defined
- **Check**: Character has skills assigned
- **Check**: Narrative context includes challenging situations

### Issue: Inappropriate skill difficulties
- **Check**: Prompt template guidelines are being followed
- **Check**: AI context includes proper difficulty guidance

### Issue: Poor acknowledgment quality
- **Check**: Skill acknowledgment template is being used
- **Check**: Narrative context includes proper skill success/failure tags

### Issue: Skills not varying between choices
- **Check**: Enhanced prompt guidance emphasizing variety
- **Check**: Multiple skill types defined in world

## Notes for Reviewers
- Focus on narrative quality and immersion
- Verify that skills feel meaningful to story progression
- Check that difficulty scaling makes sense for game balance
- Ensure accessibility (not every choice requires skills)
- Test with different world themes to verify adaptability

## Additional Fixes Included
- **State Isolation Fix**: New characters no longer inherit previous game narratives
- **Session Management**: Proper session ID generation ensures character isolation
- **Narrative Data Clearing**: Switching characters properly clears old narrative data