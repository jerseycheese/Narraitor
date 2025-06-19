import { getDetailedToneInstructions } from '../toneSettingsGuidance';

describe('getDetailedToneInstructions', () => {
  it('generates comprehensive instructions for G-rated, serious, simple content', () => {
    const instructions = getDetailedToneInstructions('G', 'serious', 'simple');
    
    // Should include G-rated content guidelines
    expect(instructions).toContain('G-RATED CONTENT GUIDELINES');
    expect(instructions).toContain('NO violence, weapons, fighting, or physical harm');
    expect(instructions).toContain('wholesome adventure, friendship, and discovery');
    
    // Should include serious narrative style
    expect(instructions).toContain('SERIOUS NARRATIVE STYLE');
    expect(instructions).toContain('mature, thoughtful tone with gravitas');
    expect(instructions).toContain('meaningful consequences and substantial themes');
    
    // Should include simple language complexity
    expect(instructions).toContain('SIMPLE LANGUAGE COMPLEXITY');
    expect(instructions).toContain('common, everyday vocabulary');
    expect(instructions).toContain('short, clear sentences (8-15 words average)');
    
    // Should include critical adherence instruction
    expect(instructions).toContain('CRITICAL: All generated content MUST strictly adhere');
  });

  it('generates appropriate instructions for different complexity levels', () => {
    const literaryInstructions = getDetailedToneInstructions('PG', 'epic', 'literary');
    
    expect(literaryInstructions).toContain('LITERARY LANGUAGE COMPLEXITY');
    expect(literaryInstructions).toContain('sophisticated, artistic language');
    expect(literaryInstructions).toContain('rhetorical devices');
    expect(literaryInstructions).toContain('symbolism, extended metaphors');
  });

  it('includes custom instructions when provided', () => {
    const customInstructions = 'Focus on environmental themes and nature';
    const instructions = getDetailedToneInstructions('PG', 'balanced', 'moderate', customInstructions);
    
    expect(instructions).toContain('CUSTOM INSTRUCTIONS:');
    expect(instructions).toContain(customInstructions);
  });

  it('provides specific examples for each complexity level', () => {
    const simpleInstructions = getDetailedToneInstructions('G', 'balanced', 'simple');
    expect(simpleInstructions).toContain('Example: "You walk into the dark forest');
    
    const advancedInstructions = getDetailedToneInstructions('PG', 'balanced', 'advanced');
    expect(advancedInstructions).toContain('Example: "The primordial forest beckons');
  });

  it('provides different content guidelines for different ratings', () => {
    const gRatedInstructions = getDetailedToneInstructions('G', 'balanced', 'simple');
    expect(gRatedInstructions).toContain('NO violence, weapons, fighting');
    
    const pgRatedInstructions = getDetailedToneInstructions('PG', 'balanced', 'simple');
    expect(pgRatedInstructions).toContain('Mild fantasy violence only');
    
    const rRatedInstructions = getDetailedToneInstructions('R', 'balanced', 'simple');
    expect(rRatedInstructions).toContain('Realistic violence with consequences');
  });

  it('provides specific narrative style guidance', () => {
    const humorousInstructions = getDetailedToneInstructions('PG', 'humorous', 'moderate');
    expect(humorousInstructions).toContain('HUMOROUS NARRATIVE STYLE');
    expect(humorousInstructions).toContain('light-hearted elements, wordplay');
    
    const mysteriousInstructions = getDetailedToneInstructions('PG', 'mysterious', 'moderate');
    expect(mysteriousInstructions).toContain('MYSTERIOUS NARRATIVE STYLE');
    expect(mysteriousInstructions).toContain('atmosphere of intrigue and hidden secrets');
  });
});