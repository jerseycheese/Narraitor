/**
 * GENERATED FILE — do not hand-edit.
 *
 * Real output from the product's own generation chain, produced by
 * scripts/generate-homepage-showcase.mjs. The homepage presents this as
 * evidence of what the product writes, so editing it by hand would turn it
 * back into a claim nobody checked. Re-run the script instead.
 *
 * Model: gemini-2.5-flash
 * Generated: 2026-08-09T18:53:58.354Z
 * Turns played per world: 3 (the last one is what's kept)
 *
 * The player's side of the exchange is authored, standing in for what someone
 * would bring: the typed description, the world caption, the genre, and the
 * character the story is played as. Everything else here came back from the
 * model: the attribute and skill names, the opening prose, the decision and
 * its options, and the consequence. The skill check numbers are a real roll
 * from the production evaluator, rolled until it failed so the page can show
 * a failure honestly.
 *
 * The attributes and skills came from the typed description on its own, the
 * same single-field call the creation wizard makes. "opening" is turn 1,
 * written from that world plus the authored character. The decision, options,
 * check and consequence are turn 3, played forward from it.
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
      "Brawn",
      "Agility",
      "Wits",
      "Resolve"
    ],
    "skillNames": [
      "Streetwise",
      "Investigation",
      "Intimidation",
      "Persuasion",
      "Shadowing",
      "Bluff"
    ],
    "opening": "The perpetual drizzle clung to your trench coat, a cold, insistent reminder of this city's melancholic grip as you navigated the slick, uneven cobblestones of the waterfront. Under the sickly yellow glow of a flickering gas lamp, the overturned fishing trawler, the 'Sea Serpent,' listed heavily against the barnacle-encrusted pier, its splintered hull a gaping maw to the unforgiving grey sky. A lone, uniformed figure, clearly a beat cop too far from his usual patrol, stood silhouetted against the unnatural twilight, his shoulders hunched, his hat brim pulled low, the faint glint of something metallic in his hand suggesting a fresh, illicit payment. You felt the familiar knot in your gut, the one that always tightened when a job pulled you back into the murky waters you'd sworn to leave behind, but the dead man sprawled across the trawler's deck, half-submerged in a growing pool of crimson, wasn't going to investigate himself.",
    "situation": "“Runner!” you yelled, pointing a finger past the 'Sea Serpent's' bow, towards the dense, rain-streaked shadows of a narrow alleyway. The word hung heavy in the damp air, a flat, unconvincing sound that carried no urgency. The beat cop, his shoulders still hunched, merely shifted his weight, his gaze unwavering as he watched you, the paper-wrapped coins still clutched in his hand. A slow, knowing smirk spread across his face, a silent acknowledgement of your clumsy attempt.",
    "decisionPrompt": "What will you do?",
    "options": [
      {
        "text": "\"Runner, you say? I'm requisitioning your assistance.\"",
        "alignment": "lawful",
        "taken": false
      },
      {
        "text": "Offer the cop your own coins to point out the runner's path.",
        "alignment": "neutral",
        "taken": true
      },
      {
        "text": "Ignore the cop and move towards the alley's mouth, scanning for tracks.",
        "alignment": "neutral",
        "taken": false
      },
      {
        "text": "Snatch the paper-wrapped coins from the cop and dash into the alley.",
        "alignment": "chaotic",
        "taken": false
      }
    ],
    "check": {
      "skillName": "Streetwise",
      "diceRoll": 3,
      "skillLevel": 3,
      "attributeBonus": 1,
      "total": 7,
      "dc": 12
    },
    "consequence": "You reached into your coat, pulling out a small leather pouch, its weight a familiar comfort. As you extended it toward the beat cop, a glint of hope in your eyes, he merely chuckled, a low, guttural sound that seemed to vibrate through the damp air. He held up the roll of coins already in his hand, a mocking gesture, then casually let it drop into his coat pocket. \"Already bought and paid for, Vaughn,\" he rasped, his eyes still fixed on yours, the earlier smirk now a full-blown sneer. \"And you're too late.\""
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
      "Piloting",
      "Mechanics",
      "Security Systems",
      "First Aid",
      "Investigation",
      "Stealth"
    ],
    "opening": "The rhythmic hum of the *Stardust*'s failing life support systems is a constant, grating companion, a testament to six months of deep-space silence broken only by your own shallow breaths. You trace the flickering readout of the cargo bay's environmental controls, the ambient temperature consistently two degrees colder than every other compartment, a chilling anomaly you first noticed buried deep in the maintenance logs. A metallic clang echoes from below, vibrating through the deck plates and straight into your bones, confirming what your gut has screamed for weeks: something heavy, something *alive*, is definitely down there, and it was never on the manifest.",
    "situation": "You initiate the ship's diagnostic sweep, feeling the familiar hum of the internal sensors come to life, a low thrumming under your feet. The main console flickers, a cascade of data streaming across the screen, but instead of the expected green and yellow of system checks, the readouts flash red. The internal sensor grid, a complex web designed to map every inch of the *Stardust*, simply reports \"ERROR: DATA CORRUPT\" across every sub-system, a chilling blank space where critical information should be.",
    "decisionPrompt": "What will you do?",
    "options": [
      {
        "text": "Follow protocol: initiate a full system reboot of the sensor grid.",
        "alignment": "lawful",
        "taken": false
      },
      {
        "text": "Bypass the corrupted grid; attempt a manual sweep of the nearest hold.",
        "alignment": "neutral",
        "taken": true
      },
      {
        "text": "Cross-reference sensor error data with the ship's security logs.",
        "alignment": "neutral",
        "taken": false
      },
      {
        "text": "Overload the sensor grid with a massive data packet, hoping to clear it.",
        "alignment": "chaotic",
        "taken": false
      }
    ],
    "check": {
      "skillName": "Investigation",
      "diceRoll": 7,
      "skillLevel": 3,
      "attributeBonus": 1,
      "total": 11,
      "dc": 12
    },
    "consequence": "You carefully depress the manual override for the cargo bay's nearest hold, a low-priority storage unit used for non-essential supplies. The panel, usually glowing with active diagnostics, remains stubbornly dark, unresponsive to your touch. A faint, almost imperceptible tremor—not from the ship's failing systems, but from *within* the hold itself—vibrates through the cold metal, a subtle, chilling confirmation that your attempt to bypass the corrupted grid has only highlighted the silent, unseen presence lurking just beyond the bulkhead."
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
      "Stamina",
      "Perception"
    ],
    "skillNames": [
      "Rifle Marksmanship",
      "Stealth",
      "Survival (Fieldcraft)",
      "Navigation",
      "First Aid",
      "Observation"
    ],
    "opening": "The stench of damp earth and shattered concrete clung to the air as you pushed through the tangled briars, the heavy M1 Garand feeling like a lead weight in your hands. The distant rumble of artillery, a constant, sickening heartbeat, vibrated through the soles of your worn boots, reminding you of the chaos you'd barely escaped on the beach. Sweat stung your eyes, blurring the already dense hedgerow ahead, a green, impenetrable wall that seemed to swallow sound and light, making every rustle a potential enemy. You glance back at the four grim faces following you, your new squad, the burden of their lives now resting squarely on your shoulders, a corporal by circumstance, not choice.",
    "situation": "You attempt to weave through the densest part of the hedgerow, but the thick, intertwined branches refuse to yield, snagging at your uniform and gear. A branch, thicker than your arm, springs back with surprising force as you try to push past it, striking the side of your rifle with a sharp crack that echoes far too loudly in the oppressive quiet. Ahead, the deer trail, once skirted, now seems like a glaringly obvious, easier path, but the opportunity is lost.",
    "decisionPrompt": "What will you do?",
    "options": [
      {
        "text": "Halt movement and listen intently for any enemy response.",
        "alignment": "lawful",
        "taken": false
      },
      {
        "text": "Backtrack carefully, finding a new, less obvious route.",
        "alignment": "neutral",
        "taken": true
      },
      {
        "text": "Push through the hedgerow, ignoring the noise for now.",
        "alignment": "neutral",
        "taken": false
      },
      {
        "text": "Deliberately snap another branch to mask the first sound.",
        "alignment": "chaotic",
        "taken": false
      }
    ],
    "check": {
      "skillName": "Stealth",
      "diceRoll": 7,
      "skillLevel": 3,
      "attributeBonus": 1,
      "total": 11,
      "dc": 12
    },
    "consequence": "You shift your weight, easing back from the snagging branches, trying to retrace your steps without disturbing a single leaf. The snap of the rifle, however, had already echoed too far. A twig under your boot gives way with a sharp crack, followed by the rustle of disturbed leaves just ahead, off the main trail. You freeze, pressing yourself against the rough bark of a thick oak, your M1 Garand now held tightly across your chest, its cold steel a stark contrast to the sudden clammy sweat on your palms."
  },
  {
    "id": "debt-court",
    "caption": "A court that runs on debts",
    "genre": "fantasy",
    "typed": "A court where nobody uses money and every favour is written down, and the ledger is the only law anyone is afraid of.",
    "protagonist": "Sennen",
    "attributeNames": [
      "Acumen",
      "Composure",
      "Influence",
      "Diligence"
    ],
    "skillNames": [
      "Ledger-keeping",
      "Negotiation",
      "Gossip & Rumor",
      "Etiquette",
      "Debate & Rhetoric",
      "Intimidation"
    ],
    "opening": "The flickering glow of a single tallow candle casts long, dancing shadows across the meticulously stacked ledgers, their leather-bound spines groaning under the weight of countless obligations. Each page, filled with the elegant script of debts owed and favors granted, represents a life intricately woven into the court's unforgiving fabric, and you, a junior clerk, feel the chilling echo of that power as you carefully turn a brittle leaf. A sudden, sharp rap on the heavy oaken door sends a tremor through the quiet chamber, the sound too abrupt, too insistent for a casual visitor, pulling your gaze from the intricate web of ancient promises. You instinctively adjust the worn satchel at your hip, the familiar weight of your own uncalled debt a cold comfort against the sudden, unwelcome intrusion, as the latch clicks with an ominous finality.",
    "situation": "You hold Master Theron's gaze, your own expression unwavering as the ledger's open pages lie plainly between you. The faint scent of aged parchment and drying ink fills the air, a familiar comfort. He studies you for a long moment, his eyes, dark as polished obsidian, seeming to pierce through the very fabric of your composure, before a subtle shift in his posture signals a reluctant acceptance. The tension in the room, thick as the dust motes dancing in the candle's glow, eases almost imperceptibly as he finally turns his attention to the precise, elegant script covering the brittle page.",
    "decisionPrompt": "What will you do?",
    "options": [
      {
        "text": "Point out the precise, elegant script on the brittle page.",
        "alignment": "lawful",
        "taken": false
      },
      {
        "text": "Ask Master Theron to specify which entry concerns him.",
        "alignment": "neutral",
        "taken": true
      },
      {
        "text": "Offer a subtle explanation for the ledger's nuanced entries.",
        "alignment": "neutral",
        "taken": false
      },
      {
        "text": "Casually tear the brittle page from the ledger, offering to rewrite it.",
        "alignment": "chaotic",
        "taken": false
      }
    ],
    "check": {
      "skillName": "Negotiation",
      "diceRoll": 6,
      "skillLevel": 3,
      "attributeBonus": 1,
      "total": 10,
      "dc": 12
    },
    "consequence": "Master Theron’s eyes narrow, the flicker of the candle catching a cold glint within their depths. He doesn't answer your question directly. Instead, his gaze drifts from your face to the ledger, then back again, a silent, weighty assessment that prickles your skin. The air in the small chamber seems to grow heavier, pressing down on you until the quiet hum of the court's distant machinery feels like a judgment."
  }
];
