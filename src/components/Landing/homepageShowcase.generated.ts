/**
 * GENERATED FILE — do not hand-edit.
 *
 * Real output from the product's own generation chain, produced by
 * scripts/generate-homepage-showcase.mjs. The homepage presents this as
 * evidence of what the product writes, so editing it by hand would turn it
 * back into a claim nobody checked. Re-run the script instead.
 *
 * Model: gemini-2.5-flash
 * Generated: 2026-08-08T13:21:17.053Z
 * Turns played per world: 3 (the last one is what's kept)
 *
 * The typed descriptions and world captions are authored (they stand in for
 * what a player would write). Everything else here came back from the model:
 * the attribute and skill names, the opening prose, the decision and its
 * options, and the consequence. The skill check numbers are a real roll from
 * the production evaluator, rolled until it failed so the page can show a
 * failure honestly.
 *
 * "opening" is turn 1, so it really is what came back from the typed
 * description. The decision, options, check and consequence are turn
 * 3, played forward from it.
 */

export interface ShowcaseOption {
  text: string;
  alignment: string;
  taken: boolean;
}

export interface ShowcaseCheck {
  skillName: string;
  diceRoll: number;
  skillLevel: number;
  attributeBonus: number;
  total: number;
  dc: number;
}

export interface ShowcaseWorld {
  id: string;
  caption: string;
  genre: string;
  typed: string;
  protagonist: string;
  attributeNames: string[];
  skillNames: string[];
  opening: string;
  /** The passage the choices below answer. Turn 2's scene, not the opening. */
  situation: string;
  decisionPrompt: string;
  options: ShowcaseOption[];
  check: ShowcaseCheck;
  consequence: string;
}

export const HOMEPAGE_SHOWCASE: ShowcaseWorld[] = [
  {
    "id": "port-city",
    "caption": "A rain-soaked port city",
    "genre": "mystery",
    "typed": "A rain-soaked port city where it never stops raining and every cop is on someone's payroll. Nineteen-forties, but the light is the wrong colour.",
    "protagonist": "Vaughn",
    "attributeNames": [
      "Grit",
      "Charm",
      "Wits",
      "Prowess"
    ],
    "skillNames": [
      "Intimidation",
      "Streetwise",
      "Investigation",
      "Persuasion",
      "Brawling",
      "Firearms"
    ],
    "opening": "The incessant drizzle, a constant companion in this city, plastered your trench coat to your skin as you hunched under the flickering neon sign of 'The Drowned Man' speakeasy, its red glow casting a sickly pallor on the already grimy street. Inside, the air was thick with stale tobacco smoke and the low murmur of illicit deals, a familiar symphony that always set your teeth on edge. You spotted him immediately: Silas Thorne, a known associate of the docks foreman, hunched over a whiskey, his fat fingers tracing patterns on the condensation of his glass.",
    "situation": "You meet the bouncer's cold stare, a silent challenge passing between you. You brace yourself, subtly shifting your weight, preparing for a shove or a follow-up question. Instead, his grip tightens on your shoulder, a bone-jarring squeeze that sends a sharp, unexpected pain radiating down your arm. He doesn't say a word, just pushes you forward, a forceful nudge that sends you stumbling off balance towards the bar, away from Silas Thorne's watchful eyes.",
    "decisionPrompt": "What will you do?",
    "options": [
      {
        "text": "Calmly find an empty stool at the bar, observing Silas Thorne.",
        "alignment": "lawful",
        "taken": false
      },
      {
        "text": "Steadily regain balance, then scan the room for an escape route.",
        "alignment": "neutral",
        "taken": true
      },
      {
        "text": "Immediately turn to the bartender, ordering a drink while watching the bouncer.",
        "alignment": "neutral",
        "taken": false
      },
      {
        "text": "Trip over a barstool, sending a tray of drinks crashing near Silas Thorne.",
        "alignment": "chaotic",
        "taken": false
      }
    ],
    "check": {
      "skillName": "Streetwise",
      "diceRoll": 5,
      "skillLevel": 3,
      "attributeBonus": 1,
      "total": 9,
      "dc": 12
    },
    "consequence": "You manage to keep your feet under you, the bouncer's rough shove sending a jolt through your shoulder, but the sudden momentum leaves you disoriented. As you try to assess your surroundings, your gaze sweeps past the darkened corners too quickly, a blur of shadowy figures and glinting bottles. Before you can properly focus, the bouncer's heavy hand is back, guiding you with an unwelcome firmness towards an empty stool at the bar, effectively blocking any clear view of Silas Thorne."
  },
  {
    "id": "survey-ship",
    "caption": "A survey ship, six months dark",
    "genre": "sci-fi",
    "typed": "A survey ship six months into a silent run, the crew down to four, and something in the hold that was not on the manifest.",
    "protagonist": "Aiya",
    "attributeNames": [
      "Constitution",
      "Dexterity",
      "Intelligence",
      "Wits"
    ],
    "skillNames": [
      "Astrogation",
      "Engineering",
      "Security Protocols",
      "Survival (Ship)",
      "Investigation",
      "First Aid"
    ],
    "opening": "The rhythmic groan of the *Charon*'s failing atmospheric processors was a constant, grating reminder of six months of dead air and dwindling supplies. You hunched over the flickering diagnostic display in the cramped engineering bay, the stale air thick with the smell of ozone and recycled sweat, your fingers tracing the anomaly in the manifest against the ship's current inventory. A single, inexplicable entry, buried deep in the cargo hold's logs, pulsed crimson: 'Unidentified Organic Mass — 1 unit.' The ship's internal sensors, usually so precise, offered only a vague, unsettling hum from that section, a silence far more terrifying than any alarm.",
    "situation": "You quickly moved to the auxiliary console, its screen still a hazy green from infrequent use, and rerouted the diagnostic. A low, steady thrum immediately replaced the unsettling silence from the cargo hold section. On the display, a schematic of the *Charon*'s power grid flickered to life, showing a clear, strong conduit leading directly to the cargo bay, its energy flow stable and uncompromised. The 'Unidentified Organic Mass' entry remained, now accompanied by a new data point: 'Power Draw: 1.2 GW – stable.'",
    "decisionPrompt": "What will you do?",
    "options": [
      {
        "text": "Initiate full cargo bay lockdown and report the anomaly to central command.",
        "alignment": "lawful",
        "taken": false
      },
      {
        "text": "Isolate the cargo bay power conduit to observe changes in the mass.",
        "alignment": "neutral",
        "taken": true
      },
      {
        "text": "Begin detailed spectral analysis of the 'Unidentified Organic Mass' from the console.",
        "alignment": "neutral",
        "taken": false
      },
      {
        "text": "Overload the cargo bay's power conduit, hoping to disrupt the mass.",
        "alignment": "chaotic",
        "taken": false
      }
    ],
    "check": {
      "skillName": "Engineering",
      "diceRoll": 4,
      "skillLevel": 3,
      "attributeBonus": 1,
      "total": 8,
      "dc": 12
    },
    "consequence": "You carefully rerouted the power, intending to cut the conduit to the cargo bay, but your fingers slipped on the auxiliary console's slick plating. Instead of isolating the connection, a surge of energy pulsed through the entire grid. The low thrum from the cargo hold instantly intensified, vibrating through the deck plates and up your legs, a deep, resonant hum that filled the engineering bay, pressing in on your eardrums until the air itself felt heavy and thick with an unseen presence. The 'Unidentified Organic Mass' entry on the display flashed, the 'Power Draw: 1.2 GW – stable' momentarily replaced by a rapid, chaotic fluctuation before settling back to its original reading, a fraction higher than before."
  },
  {
    "id": "normandy",
    "caption": "Normandy, June 1944",
    "genre": "historical",
    "typed": "Normandy, June 1944. A rifle squad separated from its unit, working inland through the hedgerows with no radio.",
    "protagonist": "Corporal Ade",
    "attributeNames": [
      "Strength",
      "Agility",
      "Constitution",
      "Perception"
    ],
    "skillNames": [
      "Rifle Marksmanship",
      "Stealth",
      "Navigation",
      "Survival (Rural)",
      "First Aid",
      "Close Quarters Combat"
    ],
    "opening": "The stench of damp earth and distant cordite clung to the air as you pushed through the last tangled hedgerow, thorns snagging at your worn fatigue jacket. Your shoulders ached from the weight of your gear, the M1 Garand feeling like a lead pipe after the hell of the beach, but you kept moving, driven by the five pairs of eyes behind you looking for direction. The oppressive green tunnel of the Norman countryside pressed in, sunlight filtering through the dense leaves in fractured beams, illuminating the swirling dust kicked up by your boots. A distant, muffled thud echoed, a reminder of the relentless, unseen enemy somewhere beyond the next field.",
    "situation": "You push through the dense undergrowth, trying to keep the line of bushes to your left as you attempt to circle around. The foliage, thicker than you anticipated, snags at your clothes and equipment, slowing your progress. The ground beneath your feet becomes uneven, a slight incline leading to a sudden drop, and you stumble, your boot catching on a gnarled root. The M1 Garand clatters against your webbing, and a small, loose stone dislodges, rolling with an unnerving patter into the unseen dip ahead.",
    "decisionPrompt": "What will you do?",
    "options": [
      {
        "text": "Halt movement, secure the M1 Garand, and listen intently for reactions.",
        "alignment": "lawful",
        "taken": false
      },
      {
        "text": "Freeze in place, slowly retrieve the M1 Garand, and scan the dip ahead.",
        "alignment": "neutral",
        "taken": true
      },
      {
        "text": "Carefully push aside foliage for a discreet peek into the dip.",
        "alignment": "neutral",
        "taken": false
      },
      {
        "text": "Immediately drop prone, M1 Garand ready, and scan for targets.",
        "alignment": "chaotic",
        "taken": false
      }
    ],
    "check": {
      "skillName": "Stealth",
      "diceRoll": 4,
      "skillLevel": 3,
      "attributeBonus": 1,
      "total": 8,
      "dc": 12
    },
    "consequence": "Before you can fully steady yourself, a sharp, guttural shout rips through the quiet, followed by the unmistakable sound of a bolt being worked. Your head snaps up, eyes wide, just in time to see the glint of a helmet through the gap in the bushes directly ahead, a rifle barrel swinging to bear. The sound of your stumbling, the soft clatter of the M1, and the rolling stone had given you away. There's no time to react."
  },
  {
    "id": "debt-court",
    "caption": "A court that runs on debts",
    "genre": "fantasy",
    "typed": "A court where nobody uses money and every favour is written down, and the ledger is the only law anyone is afraid of.",
    "protagonist": "Sennen",
    "attributeNames": [
      "Acumen",
      "Influence",
      "Composure",
      "Insight"
    ],
    "skillNames": [
      "Ledger-keeping",
      "Oration",
      "Etiquette",
      "Favorsmithing",
      "Debt Recall",
      "Whisper Network"
    ],
    "opening": "The flickering candlelight casts long, dancing shadows across the towering shelves, each laden with heavy, leather-bound ledgers. The air in the Grand Archive is thick with the scent of aged parchment and unspoken obligations, a silent testament to a thousand favors owed and countless lives bound by invisible chains. You trace a finger along the spine of a ledger marked 'House Volkov,' its weight a familiar comfort in your hands, the knowledge of its contents a heavy burden you carry daily. A hushed whisper from the far corner of the room, barely audible over the scratching of a distant quill, speaks of a newly incurred debt, and a chill settles deep in your bones, a stark reminder of the ledger's unforgiving nature.",
    "situation": "You bend over, a practiced nonchalance in your movements, but your hand trembles slightly as you retrieve the fallen ledger. The heavy thud still reverberates in the quiet space, and the two cloaked figures have not resumed their hushed conversation. Instead, their gazes, though obscured by deep hoods, feel sharp and focused, piercing through your feigned indifference. A low, resonant voice, deep as a cavern, breaks the silence, cutting through the thick air like a blade. \"Sennen, a moment of your time.\"",
    "decisionPrompt": "What will you do?",
    "options": [
      {
        "text": "Present the ledger, awaiting their instructions respectfully.",
        "alignment": "lawful",
        "taken": false
      },
      {
        "text": "Offer the ledger, asking how you can be of service.",
        "alignment": "neutral",
        "taken": true
      },
      {
        "text": "Glance at the ledger's open page before responding.",
        "alignment": "neutral",
        "taken": false
      },
      {
        "text": "Drop the ledger again, feigning clumsiness while scanning the room.",
        "alignment": "chaotic",
        "taken": false
      }
    ],
    "check": {
      "skillName": "Oration",
      "diceRoll": 7,
      "skillLevel": 3,
      "attributeBonus": 1,
      "total": 11,
      "dc": 12
    },
    "consequence": "You extend the heavy ledger, your hand shaking imperceptibly as you offer it to the closer of the two cloaked figures. The gesture, meant to convey helpfulness, feels clumsy, the weight of the book suddenly oppressive. The figure doesn't take it. Instead, a gloved hand reaches out, not for the ledger, but to firmly cup your wrist, a silent, unyielding grip that sends a jolt through you. \"Sennen, the ledger can wait,\" the deep voice rumbles, its tone now laced with an edge of impatience that prickles your skin."
  }
];
