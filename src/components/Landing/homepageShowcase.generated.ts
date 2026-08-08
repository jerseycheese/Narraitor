/**
 * GENERATED FILE — do not hand-edit.
 *
 * Real output from the product's own generation chain, produced by
 * scripts/generate-homepage-showcase.mjs. The homepage presents this as
 * evidence of what the product writes, so editing it by hand would turn it
 * back into a claim nobody checked. Re-run the script instead.
 *
 * Model: gemini-2.5-flash
 * Generated: 2026-08-07T21:25:36.903Z
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
      "Wits",
      "Charm",
      "Prowess"
    ],
    "skillNames": [
      "Shadowing",
      "Interrogation",
      "Streetwise",
      "Firearms",
      "Observation",
      "Bribery"
    ],
    "opening": "The perpetual drizzle clung to your trench coat, a familiar chill seeping into your bones as you stood silhouetted against the flickering neon sign of the 'Blue Siren' bar. The muted glow cast long, distorted shadows across the grimy alley, painting the slick cobblestones in shades of sickly green and bruised purple, a colour scheme no natural light could ever achieve. Inside, the muffled clang of a dropped glass was swallowed by the low hum of discordant jazz and hushed conversations, a testament to the city's ceaseless, desperate pulse. You adjusted the brim of your fedora, the rain beading on the felt, and pushed open the heavy oak door, the scent of stale whiskey and desperation hitting you like a physical blow.",
    "situation": "You attempt a friendly smile, offering to buy a round for him and his cronies, but the words catch in your throat. He doesn't even flinch, his gaze hardening as he leans in closer, the stench of cheap ale on his breath. \"Drinks? You think I need charity, pal?\" he growls, his hand tightening its grip on your shoulder, digging into the damp fabric of your coat. The jazz seems to falter, and a few nearby patrons glance your way before quickly averting their eyes.",
    "decisionPrompt": "What will you do?",
    "options": [
      {
        "text": "Calmly explain your intention was only generosity.",
        "alignment": "lawful",
        "taken": false
      },
      {
        "text": "Offer to buy him a *different* drink, not charity.",
        "alignment": "neutral",
        "taken": true
      },
      {
        "text": "Scan the room for an unnoticed exit or distraction.",
        "alignment": "neutral",
        "taken": false
      },
      {
        "text": "Trip a nearby crony, spilling his drink onto the tough.",
        "alignment": "chaotic",
        "taken": false
      }
    ],
    "check": {
      "skillName": "Bribery",
      "diceRoll": 6,
      "skillLevel": 3,
      "attributeBonus": 1,
      "total": 10,
      "dc": 12
    },
    "consequence": "You try to pivot, a quick offer about a specific, top-shelf whiskey forming on your tongue, but you don't even get the first syllable out. The burly figure's grip on your shoulder tightens further, his knuckles digging painfully into your collarbone. He shoves you back against the damp, grimy wall, the impact rattling your teeth and sending a jolt up your spine. The jazz picks up its mournful wail, and the low hum of conversation resumes, as if nothing at all had happened, leaving you pinned and exposed."
  },
  {
    "id": "survey-ship",
    "caption": "A survey ship, six months dark",
    "genre": "sci-fi",
    "typed": "A survey ship six months into a silent run, the crew down to four, and something in the hold that was not on the manifest.",
    "protagonist": "Aiya",
    "attributeNames": [
      "Physique",
      "Agility",
      "Intellect",
      "Wits"
    ],
    "skillNames": [
      "Navigation",
      "Engineering",
      "Stealth",
      "Medical",
      "Security Protocols",
      "Observation"
    ],
    "opening": "The rhythmic hum of the *Stardust*'s failing atmospheric processors has been your constant companion for six months, a low thrumming bass against the ship's otherwise silent run. Dust motes dance in the weak emergency lights of the maintenance bay, illuminated by the glow of your datapad as you scroll through the endless stream of automated logs, the only crew member left who bothers. Your fingers trace the highlighted variance: a thermal signature spike from Cargo Hold C, six weeks ago, precisely when the manifest showed it empty. A cold dread, sharper than the recycled air, begins to prickle at your skin as you realize the discrepancy isn't just a sensor glitch; something is undeniably in the hold, something that wasn't there before the dark.",
    "situation": "You initiate the high-resolution scan, the console whirring with renewed effort. The granular thermal image on the primary screen sharpens, resolving into a clearer, though still indistinct, form. But then, a sudden, blinding flash of white consumes the feed, followed by a cacophony of static that screeches from the ship's comms, echoing through the silent bridge. The primary screen goes dark, replaced by a stark, red 'ERROR: SENSOR ARRAY OFFLINE' message, the ship's internal lights flickering ominously in response.",
    "decisionPrompt": "What will you do?",
    "options": [
      {
        "text": "Run diagnostic protocols on the sensor array and comms.",
        "alignment": "lawful",
        "taken": false
      },
      {
        "text": "Immediately cut power to external sensors.",
        "alignment": "neutral",
        "taken": true
      },
      {
        "text": "Attempt to re-establish comms manually.",
        "alignment": "neutral",
        "taken": false
      },
      {
        "text": "Override the 'SENSOR ARRAY OFFLINE' message, forcing a system reboot.",
        "alignment": "chaotic",
        "taken": false
      }
    ],
    "check": {
      "skillName": "Navigation",
      "diceRoll": 7,
      "skillLevel": 3,
      "attributeBonus": 1,
      "total": 11,
      "dc": 12
    },
    "consequence": "You lunge for the console, your fingers fumbling for the power conduit. The 'ERROR' message pulses scarlet, reflecting in your wide eyes as your hand misses the intended cut-off, instead slamming into the emergency comms activation panel. A piercing, high-frequency squeal erupts from the ship's internal speakers, a raw, unfiltered shriek of static that vibrates through the deck plating and grinds against your teeth, making your ears ache as the bridge lights flicker wildly in sync with the noise, threatening to plunge you into total darkness."
  },
  {
    "id": "normandy",
    "caption": "Normandy, June 1944",
    "genre": "historical",
    "typed": "Normandy, June 1944. A rifle squad separated from its unit, working inland through the hedgerows with no radio.",
    "protagonist": "Corporal Ade",
    "attributeNames": [
      "Strength",
      "Dexterity",
      "Constitution",
      "Intelligence"
    ],
    "skillNames": [
      "Rifle Marksmanship",
      "Stealth",
      "Survival",
      "Navigation",
      "First Aid",
      "Observation"
    ],
    "opening": "The damp earth beneath your worn boots squelches softly with each step as you push through the dense, thorny hedgerow, the coarse leaves scraping against your fatigues. The distant, sporadic crackle of small arms fire serves as a constant, unwelcome reminder of the chaos you've been cut off from, and the silence of your own squad feels unnervingly loud. You glance back at the four weary faces following you, their eyes reflecting the same grim determination that you feel, the weight of command settling heavy on your shoulders since the beach claimed Sergeant Miller. A sudden rustle in the undergrowth ahead makes your hand instinctively tighten on the cold steel of your M1 Garand, every sense on high alert.",
    "situation": "As you drop low, the sudden shift in your weight causes your M1 to clatter against a fallen branch, a sound that rips through the tense silence. Before Thompson can even begin to move, a burst of automatic fire splinters the wood above your head, showering you with bark and leaves. You instinctively press yourself further into the damp earth, the sharp tang of gunpowder momentarily overriding the smell of wet soil, as the crackle of small arms fire intensifies, now much closer.",
    "decisionPrompt": "What will you do?",
    "options": [
      {
        "text": "Return fire at the source of the automatic fire.",
        "alignment": "lawful",
        "taken": false
      },
      {
        "text": "Crawl low through the undergrowth, seeking cover.",
        "alignment": "neutral",
        "taken": true
      },
      {
        "text": "Shout Thompson's name, trying to locate him.",
        "alignment": "neutral",
        "taken": false
      },
      {
        "text": "Detonate a grenade to create a diversion, then run.",
        "alignment": "chaotic",
        "taken": false
      }
    ],
    "check": {
      "skillName": "Stealth",
      "diceRoll": 1,
      "skillLevel": 3,
      "attributeBonus": 1,
      "total": 5,
      "dc": 12
    },
    "consequence": "As you attempt to press lower and move, a root snags your boot, sending you sprawling forward with a choked gasp. Your M1 slides from your grasp, skittering across the damp leaves with a loud, unmistakable scrape. Before you can even begin to recover, a heavy boot crashes down onto your back, driving the air from your lungs, and a rough hand clamps over your mouth, silencing any cry as you're roughly hauled deeper into the dense undergrowth. Through a blur of leaves, you catch a glimpse of Thompson, frozen, his rifle still pointed, but too far to help."
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
      "Diligence"
    ],
    "skillNames": [
      "Ledger-keeping",
      "Bargaining",
      "Investigation",
      "Flattery",
      "Oratory",
      "Sleight of Hand"
    ],
    "opening": "The flickering candlelight casts long, dancing shadows across the towering shelves, each laden with heavy, leather-bound ledgers. The air in the Grand Archive hangs thick and still, smelling of aged parchment and silent promises, a hush broken only by the scratch of your quill meticulously recording another citizen's obligation. Your fingers, stained with ink, trace the intricate script of a newly acquired debt, a favor for a minor noble that will undoubtedly be called in at the most inconvenient moment, much like your own unspoken burden. You press a heavy brass seal into the fresh wax, the official imprint of the Court of Debts, binding another soul to its intricate, unforgiving system.",
    "situation": "You subtly lean closer to the next workstation, trying to catch a glimpse of the ledger on the clerk's desk, hoping to decipher a name, a date, anything that might hint at the Court's current priorities. However, your movement is too abrupt, rattling the inkpot on your own desk. The clerk, a gaunt woman named Elara, whose face is as sharp as her quill, pauses her meticulous work and fixes you with a cold, unblinking stare. The silence stretches, thick with unspoken accusation, before she pointedly turns back to her own ledger, the message clear: mind your own business.",
    "decisionPrompt": "What will you do?",
    "options": [
      {
        "text": "Apologize to Elara for the disturbance, then resume your own ledger.",
        "alignment": "lawful",
        "taken": false
      },
      {
        "text": "Immediately turn back to your desk, feigning intense focus on your own work.",
        "alignment": "neutral",
        "taken": true
      },
      {
        "text": "Casually drop your quill, then use the distraction to glance at Elara's desk.",
        "alignment": "neutral",
        "taken": false
      },
      {
        "text": "Accidentally-on-purpose knock over your inkpot, splattering ink near Elara's ledger.",
        "alignment": "chaotic",
        "taken": false
      }
    ],
    "check": {
      "skillName": "Ledger-keeping",
      "diceRoll": 3,
      "skillLevel": 3,
      "attributeBonus": 1,
      "total": 7,
      "dc": 12
    },
    "consequence": "You whip your head back to your own workstation, your gaze snapping to the open ledger before you. Your hand, however, still trembles slightly from the abrupt movement, and the quill, caught in your sudden shift, scrapes a jagged, uncontrolled line across the meticulously recorded entry. The dark ink blooms, marring the precise script of the newly acquired debt, a stark, unsightly blot against the parchment. You quickly try to smooth it with the pad of your thumb, only smearing it further, a cold dread tightening in your chest."
  }
];
