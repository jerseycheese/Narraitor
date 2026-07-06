import { ContentRating, NarrativeStyle, LanguageComplexity } from '@/types/tone-settings.types';

/**
 * Detailed AI guidance for language complexity levels
 */
export const LANGUAGE_COMPLEXITY_GUIDANCE: Record<LanguageComplexity, string> = {
  simple: `
SIMPLE LANGUAGE COMPLEXITY:
- Use common, everyday vocabulary (avoid technical, archaic, or obscure words)
- Write short, clear sentences (8-15 words average)
- Use straightforward sentence structures (mostly subject-verb-object)
- Avoid complex metaphors, abstract concepts, or nested clauses
- Prefer active voice over passive voice
- Use concrete, specific words rather than abstract terms
- Example: "You walk into the dark forest. The trees are tall and old. You hear strange sounds nearby. A bird flies overhead."`,

  moderate: `
MODERATE LANGUAGE COMPLEXITY:
- Use standard vocabulary with occasional sophisticated words (explain complex terms when used)
- Mix short and medium sentences (10-20 words average)
- Include some compound sentences and simple dependent clauses
- Use clear but varied sentence structures
- Include moderate use of descriptive language and simple metaphors
- Balance between simple and complex expression
- Example: "As you venture into the ancient forest, the towering trees cast long shadows across your path. Mysterious sounds echo from the depths ahead, while a lone raven circles overhead, watching your progress."`,

  advanced: `
ADVANCED LANGUAGE COMPLEXITY:
- Use rich, varied vocabulary including sophisticated and technical terms
- Employ complex sentence structures with multiple clauses and varied length (15-30 words average)
- Include metaphors, imagery, and literary devices (alliteration, symbolism)
- Vary sentence rhythm and structure for narrative flow
- Use nuanced word choices that convey subtle meaning
- Include occasional advanced vocabulary appropriate to context
- Example: "The primordial forest beckons you forward into its verdant embrace, where colossal sentinels of oak and ash stand sentinel over secrets whispered through rustling leaves, their ancient boughs reaching skyward like gnarled fingers grasping at forgotten dreams."`,

  literary: `
LITERARY LANGUAGE COMPLEXITY:
- Use sophisticated, artistic language with carefully chosen, nuanced vocabulary
- Employ complex syntax, parallel structures, and advanced rhetorical devices
- Include symbolism, extended metaphors, allegory, and layered meaning
- Create rhythmic, poetic prose with careful attention to sound, cadence, and flow
- Use advanced literary techniques (foreshadowing, irony, juxtaposition)
- Employ sophisticated imagery that engages multiple senses
- Example: "Into the cathedral of ancient wood you venture, where time itself seems suspended among the towering pillars of bark and bone, and the very air thrums with the ineffable mysteries of epochs untold—each footfall a whispered prayer upon the hallowed ground of forgotten gods."`
};

/**
 * Detailed AI guidance for narrative style
 */
const NARRATIVE_STYLE_GUIDANCE: Record<NarrativeStyle, string> = {
  serious: `
SERIOUS NARRATIVE STYLE:
- Maintain a mature, thoughtful tone with gravitas and weight
- Focus on meaningful consequences and substantial themes
- Use measured pacing that allows for reflection
- Avoid frivolous elements, jokes, or comedic relief
- Present situations with appropriate gravity and respect
- Include meaningful character development and moral complexity
- Address themes with depth and sincerity
- Example tone: "The decision weighs heavily upon you as you consider the far-reaching consequences of your actions."`,

  humorous: `
HUMOROUS NARRATIVE STYLE:
- Include light-hearted elements, wordplay, and comedic situations
- Use witty dialogue and amusing character interactions
- Include absurd or unexpected elements that create humor
- Balance comedy with narrative progression
- Use irony, puns, and amusing observations
- Create entertaining scenarios without undermining story stakes
- Maintain levity while respecting character agency
- Example tone: "The dragon pauses mid-roar to sneeze, accidentally incinerating its own eyebrows in a puff of embarrassed smoke."`,

  dramatic: `
DRAMATIC NARRATIVE STYLE:
- Emphasize intense emotions and high-stakes situations
- Use passionate, emotionally charged language
- Include conflict, tension, and pivotal moments
- Focus on character relationships and emotional arcs
- Build toward climactic moments and revelations
- Use vivid imagery to heighten emotional impact
- Present choices with significant emotional weight
- Example tone: "Your heart pounds as you realize the terrible truth—everything you believed was a lie, and now lives hang in the balance."`,

  lighthearted: `
LIGHTHEARTED NARRATIVE STYLE:
- Maintain an optimistic, cheerful atmosphere
- Focus on positive outcomes and hopeful themes
- Include pleasant surprises and uplifting moments
- Use gentle humor and warm character interactions
- Avoid overly dark or disturbing elements
- Emphasize friendship, kindness, and positive values
- Create a sense of wonder and joy in discovery
- Example tone: "The meadow sparkles with morning dew as friendly woodland creatures gather to help you on your quest."`,

  mysterious: `
MYSTERIOUS NARRATIVE STYLE:
- Create an atmosphere of intrigue and hidden secrets
- Use subtle hints and foreshadowing
- Include unexplained phenomena and puzzling elements
- Build suspense through gradual revelation
- Use atmospheric descriptions that suggest hidden depths
- Leave some questions unanswered to maintain mystery
- Focus on discovery and investigation
- Example tone: "Strange symbols carved into the ancient stone seem to shift when you're not looking directly at them."`,

  'action-packed': `
ACTION-PACKED NARRATIVE STYLE:
- Emphasize fast-paced sequences and exciting events
- Use dynamic, energetic language and short, punchy sentences
- Include frequent action verbs and movement
- Focus on immediate, visceral experiences
- Build excitement through escalating challenges
- Use vivid descriptions of physical action and adventure
- Maintain high energy and momentum
- Example tone: "You sprint through the crumbling corridor as the ceiling collapses behind you, each step a race against certain doom."`,

  contemplative: `
CONTEMPLATIVE NARRATIVE STYLE:
- Encourage reflection and philosophical thinking
- Include introspective moments and internal dialogue
- Explore deeper meaning and existential questions
- Use thoughtful pacing that allows for consideration
- Focus on personal growth and understanding
- Include moments of quiet observation and insight
- Address complex moral and ethical questions
- Example tone: "You pause to consider the weight of your journey, wondering what lessons the road has taught you about yourself."`,

  epic: `
EPIC NARRATIVE STYLE:
- Present grand-scale adventures with heroic themes
- Use elevated language befitting legendary tales
- Focus on larger-than-life characters and situations
- Include themes of destiny, honor, and great purpose
- Present world-changing events and consequences
- Use sweeping descriptions of vast landscapes and mighty deeds
- Emphasize the significance of heroic actions
- Example tone: "The fate of kingdoms rests upon your shoulders as you stand before the ancient gateway, knowing that your choice will echo through the ages."`,

  balanced: `
BALANCED NARRATIVE STYLE:
- Adapt tone appropriately to match the current situation
- Mix elements of different styles as context requires
- Maintain consistency while allowing for variety
- Include both serious and lighter moments as appropriate
- Respond to the emotional needs of the scene
- Create natural shifts in mood based on events
- Provide a well-rounded narrative experience
- Example tone: "The peaceful moment is broken by distant thunder, reminding you that greater challenges lie ahead."`
};

/**
 * Detailed AI guidance for content rating compliance
 */
const CONTENT_RATING_GUIDANCE: Record<ContentRating, string> = {
  'G': `
G-RATED CONTENT GUIDELINES:
- NO violence, weapons, fighting, or physical harm
- NO mature themes, adult situations, or innuendo
- NO frightening or disturbing imagery
- NO alcohol, drugs, or substance use
- NO crude language or inappropriate behavior
- Focus on wholesome adventure, friendship, and discovery
- Use gentle conflict resolution and positive problem-solving
- Include themes of kindness, cooperation, and learning
- Keep all content suitable for young children
- Example appropriate content: "You help the lost kitten find its way home, earning the gratitude of the village."`,

  'PG': `
PG-RATED CONTENT GUIDELINES:
- Mild fantasy violence only (no graphic descriptions)
- Brief scary moments that resolve positively
- Gentle themes of conflict and resolution
- Mild language (no profanity or crude terms)
- Simple moral lessons and character growth
- Adventure elements with minimal danger
- Brief references to mild peril that is quickly overcome
- Focus on courage, friendship, and overcoming challenges
- Example appropriate content: "The guardian blocks your path, but you find a peaceful way to prove your noble intentions."`,

  'PG-13': `
PG-13 CONTENT GUIDELINES:
- Moderate fantasy violence (some detail but not graphic)
- Some intense moments and moderate peril
- Themes of loss, sacrifice, and moral complexity
- Mild to moderate language (occasional strong words)
- More complex moral situations and consequences
- Adventure with real stakes and meaningful choices
- Brief references to mature themes handled tastefully
- Character development through adversity
- Example appropriate content: "The battle is fierce, and you see allies fall, but your determination drives you forward to victory."`,

  'R': `
R-RATED CONTENT GUIDELINES:
- Realistic violence with consequences (still avoid excessive gore)
- Strong language and mature themes
- Complex moral situations with unclear right/wrong
- Themes of sacrifice, loss, and difficult choices
- Adult situations handled with narrative purpose
- Intense conflict with lasting consequences
- Characters facing serious personal struggles
- Mature themes explored with depth and responsibility
- Example appropriate content: "The cost of victory weighs heavily as you survey the battlefield, knowing that hard choices led to this moment."`,

  'NC-17': `
NC-17 CONTENT GUIDELINES:
- Intense, realistic scenarios with serious consequences
- Strong language and complex mature themes
- Graphic violence where narratively justified
- Explicit exploration of adult themes and situations
- Morally complex scenarios with no clear answers
- Intense psychological and emotional content
- Advanced themes requiring mature perspective
- Content suitable only for adult audiences
- Example appropriate content: "The brutal reality of war confronts you as you make impossible choices between competing moral imperatives."`
};

/**
 * Get detailed AI instructions for specific tone settings
 */
export function getDetailedToneInstructions(
  contentRating: ContentRating,
  narrativeStyle: NarrativeStyle,
  languageComplexity: LanguageComplexity,
  customInstructions?: string
): string {
  return `
DETAILED TONE GUIDANCE:

${CONTENT_RATING_GUIDANCE[contentRating]}

${NARRATIVE_STYLE_GUIDANCE[narrativeStyle]}

${LANGUAGE_COMPLEXITY_GUIDANCE[languageComplexity]}

${customInstructions ? `
CUSTOM INSTRUCTIONS:
${customInstructions}
` : ''}

CRITICAL: All generated content MUST strictly adhere to these detailed guidelines. Every sentence should reflect the specified content rating, narrative style, and language complexity. When in doubt, err on the side of caution for content appropriateness.`;
}