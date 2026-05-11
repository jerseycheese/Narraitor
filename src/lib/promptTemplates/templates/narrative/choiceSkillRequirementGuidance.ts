interface ChoiceWorldSkill {
  id: string;
  name: string;
  description: string;
}

export const buildAvailableSkillsSection = (
  worldSkills?: ChoiceWorldSkill[]
): string => {
  if (!worldSkills || worldSkills.length === 0) {
    return '';
  }

  return `
AVAILABLE SKILLS IN THIS WORLD:
${worldSkills.map(skill => `- ${skill.name}: ${skill.description}`).join('\n')}`;
};

export const buildSkillRequirementGuidance = (): string => `SKILL REQUIREMENTS (CRITICAL FOR MVP):
Generate choices with skill requirements ONLY when the situation naturally calls for specialized abilities AND the skill exists in the "AVAILABLE SKILLS" list:
- ONLY use the exact skill names from the "AVAILABLE SKILLS" list provided above.
- NEVER invent new skills or use generic skills (like "Stealth", "Persuasion", "Athletics", etc.) unless they are explicitly listed in the "AVAILABLE SKILLS" for this world.
- If NO "AVAILABLE SKILLS" are listed for this world, do NOT include any "Requirements:" lines in your options.
- Analyze the current scene for opportunities where the provided world skills would logically apply.
- **IMPORTANT: Create a MIX of difficulty levels** for the requirements:
  * Easy tasks: 3-4 skill level
  * Moderate tasks: 5-6 skill level
  * Hard tasks: 7-8 skill level
  * Very hard tasks: 9+ skill level
- Generate some challenging options that push beyond average skill levels to create interesting story moments.
- VARY skill requirements across choices when multiple world skills are applicable.
- Format skill requirements as: Requirements: SkillName X+ (where SkillName is from the world's skill list).`;
