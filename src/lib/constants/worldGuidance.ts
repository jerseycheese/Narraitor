import { GENRE_LABELS, GenreValue } from '@/lib/constants/genres';

export type AIGuidanceSource = 'ai' | 'fallback' | 'template' | 'initial';

export interface WorldGuidance {
  label: string;
  tagline: string;
  nameExamples: string[];
  descriptionPrompt: string;
  descriptionExample: string;
  attributeExamples: string[];
  skillExamples: string[];
  aiFocus?: string;
}

const WORLD_GUIDANCE_MAP: Record<GenreValue | 'default', WorldGuidance> = {
  default: {
    label: 'Any Genre',
    tagline: 'Highlight the main conflict, the tone you want players to feel, and the types of challenges that should show up.',
    nameExamples: ['Aurora Frontier', 'The Obsidian Accord', 'Echoes of Verdant'],
    descriptionPrompt: 'Explain who lives here, what is changing, and why it matters to the people in this world.',
    descriptionExample:
      'A fractured coalition of city-states is racing to claim mysterious crystals that distort reality itself. Each faction bends physics in a different way, and the citizens fear what uncontrolled experimentation will unleash.',
    attributeExamples: ['Resolve', 'Resourcefulness', 'Influence'],
    skillExamples: ['Negotiation', 'Fieldcraft', 'Adaptive Engineering'],
    aiFocus: 'The AI looks for tone keywords, genre cues, and threats to suggest matching stats.'
  },
  fantasy: {
    label: GENRE_LABELS['fantasy'],
    tagline: 'Mention how magic works, who wields it, and the legendary stakes your heroes face.',
    nameExamples: ['Elderwind Realms', 'The Shattered Grove', 'Crown of Embers'],
    descriptionPrompt: 'Describe iconic locations, magical traditions, and the looming prophecy or crisis the world must solve.',
    descriptionExample:
      'Floating citadels circle a wounded sun while order and chaos mages duel for control of the ley-lines. Knights fly gryphon patrols to shield village shards from the creeping shadow tide that erodes reality.',
    attributeExamples: ['Arcane Resonance', 'Gryphon Bond', 'Stalwart Will'],
    skillExamples: ['Spellweaving', 'Rune Cartography', 'Beast Diplomacy'],
    aiFocus: 'References to magic schools, mythical beings, or prophesied calamities help the AI craft tailored stats.'
  },
  'sci-fi': {
    label: GENRE_LABELS['sci-fi'],
    tagline: 'Call out the technology level, the frontier being explored, and any runaway science experiments.',
    nameExamples: ['Nova Arcology', 'Helios Verge', 'Protocol Horizon'],
    descriptionPrompt: 'Explain the governing factions, the tech that defines daily life, and the paradox or threat the crew must solve.',
    descriptionExample:
      'Megacities orbit a wormhole lattice that collapses without constant calibrations. Corporations hire drift pilots to plunge into event horizons while rogue synthetics question whether humanity should remain in charge.',
    attributeExamples: ['Quantum Intuition', 'Cybernetic Loadout', 'Zero-G Conditioning'],
    skillExamples: ['Gravitic Engineering', 'Slipspace Piloting', 'Systems Intrusion'],
    aiFocus: 'Mention signature gadgets, AI relationships, and alien frontiers to steer the suggestions.'
  },
  modern: {
    label: GENRE_LABELS['modern'],
    tagline: 'Focus on the city vibe, everyday stakes, and the social or investigative pressure your cast faces.',
    nameExamples: ['Neon District 12', 'Harborline Collective', 'Glass & Steel'],
    descriptionPrompt: 'Outline the community, the power structures, and the mystery or crisis people are whispering about.',
    descriptionExample:
      'A boom-town tech hub hides a spiral of missing-person cases tied to a viral app. Journalists, street crew fixers, and exhausted detectives race to uncover who is rewriting memories from the cloud.',
    attributeExamples: ['Street Cred', 'Emotional Resilience', 'Operational Insight'],
    skillExamples: ['Digital Forensics', 'Crisis Negotiation', 'Social Engineering'],
    aiFocus: 'Grounding details like neighborhoods, institutions, and pop culture references improve realism.'
  },
  historical: {
    label: GENRE_LABELS['historical'],
    tagline: 'Anchor the era with real events, social norms, and the tension between tradition and change.',
    nameExamples: ['Age of Steamfall', 'The Gilded Passage', 'Empire of Lanterns'],
    descriptionPrompt: 'State the historical period, key factions or classes, and the upheaval threatening the status quo.',
    descriptionExample:
      'In 1872 Cairo, inventors smuggle clockwork devices past imperial checkpoints while revolutionaries coordinate uprisings through coded operas. Scholars argue whether progress will liberate the city or shatter it.',
    attributeExamples: ['Cultural Acumen', 'Industrial Grit', 'Social Standing'],
    skillExamples: ['Cipher Craft', 'Etiquette Maneuvering', 'Steamcraft Repair'],
    aiFocus: 'Specific dates, locations, and authentic roles help the AI respect historical nuance.'
  },
  horror: {
    label: GENRE_LABELS['horror'],
    tagline: 'Describe the dread source, how it corrupts the familiar, and what fragile hope remains.',
    nameExamples: ['Nightfall Parish', 'Veilbrook Asylum', 'The Hollowed Coast'],
    descriptionPrompt: 'Explain the entities haunting the world, the rules of survival, and the cost of learning the truth.',
    descriptionExample:
      'An abandoned coastal town awakens each dusk as fog-born echoes reenact their final night. Survivors barter secrets to delay possession while rituals stitched from salt and memory hold the darkness back.',
    attributeExamples: ['Nerve', 'Occult Sensitivity', 'Faith Anchor'],
    skillExamples: ['Ritual Binding', 'Pattern Recognition', 'Wardcraft'],
    aiFocus: 'Mention sensory details, forbidden knowledge, and escalating dread for sharper prompts.'
  },
  mystery: {
    label: GENRE_LABELS['mystery'],
    tagline: 'Clarify the central case, notable suspects, and the investigative methods that matter.',
    nameExamples: ['The Veiled Circuit', 'Crimson Ledger', 'Midnight Brief'],
    descriptionPrompt: 'Lay out the puzzle pieces - crime scene, motive theories, and the obstacles preventing the truth.',
    descriptionExample:
      'An elite arbitration tower loses a judge mid-verdict, triggering lockdown. Each corporate envoy hides conflicting evidence while encrypted testimonies vanish from the vault system.',
    attributeExamples: ['Deductive Reasoning', 'Intuition', 'Network Access'],
    skillExamples: ['Evidence Synthesis', 'Disguise Work', 'Microexpression Reading'],
    aiFocus: 'Clues, red herrings, and investigative tools inform smarter skill pairings.'
  },
  western: {
    label: GENRE_LABELS['western'],
    tagline: 'Highlight the frontier, contested resources, and moral lines the posse won't cross.',
    nameExamples: ['Dustwake Territory', "Crow's Claim", 'Frontier Meridian'],
    descriptionPrompt: 'Describe the town, the controlling forces, and the showdown that keeps everyone on edge.',
    descriptionExample:
      'A rail baron dammed the canyon river to fuel an ore refinery, leaving homesteads to wither. Drifters, lawkeepers, and displaced tribes weigh whether justice means sabotage or open war.',
    attributeExamples: ['Grit', 'Trail Sense', 'Reputation'],
    skillExamples: ['Sharpshooting', 'Frontier Medicine', 'Mounted Pursuit'],
    aiFocus: 'Geography, alliances, and moral stakes guide the AI toward grounded suggestions.'
  },
  cyberpunk: {
    label: GENRE_LABELS['cyberpunk'],
    tagline: 'Detail the megacorp struggles, street-level resistance, and the augmented edge people rely on.',
    nameExamples: ['Chrome Undertow', 'Neon Null Sector', 'Synapse Alley'],
    descriptionPrompt: 'Explain the city layers, corporate plots, and what happens when tech fails or rebels.',
    descriptionExample:
      'Skyscraper canyons glow with neural graffiti that rewrites reality filters. Hack crews siphon memories to sell on the dream market while corporate archons deploy empathy-killing firmware updates.',
    attributeExamples: ['Augmentation Threshold', 'Street Repute', 'Signal Intuition'],
    skillExamples: ['Neurohacking', 'Drone Swarm Control', 'Bio-mod Surgery'],
    aiFocus: 'Talk about implants, data wars, and social stratification to fine-tune AI guidance.'
  },
  other: {
    label: GENRE_LABELS['other'],
    tagline: 'Define what makes this world unique - genre mashups, surreal rules, or experimental storytelling hooks.',
    nameExamples: ['Polychrome Dreamspace', 'Chronicle of Fragments', 'The Liminal Fold'],
    descriptionPrompt: 'Explain the custom premise, how reality behaves, and the themes players should explore.',
    descriptionExample:
      'Time loops across five emotional states that repaint districts nightly. Residents architect feelings like buildings, and visitors must barter memories to avoid fading into the collective chorus.',
    attributeExamples: ['Emotive Resonance', 'Continuum Drift', 'Mythic Awareness'],
    skillExamples: ['Timeline Tuning', 'Mythweaving', 'Paradox Diplomacy'],
    aiFocus: 'Any unique rule or mashup detail helps the AI avoid generic fantasy or sci-fi fallbacks.'
  }
};

export function getWorldGuidance(genre?: GenreValue | null): WorldGuidance {
  if (!genre) {
    return WORLD_GUIDANCE_MAP.default;
  }

  return WORLD_GUIDANCE_MAP[genre] ?? WORLD_GUIDANCE_MAP.default;
}
