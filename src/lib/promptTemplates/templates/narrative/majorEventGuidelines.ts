export const majorEventGuidelines = `MAJOR EVENT METADATA RULES:

CRITICAL: The majorEvent field must SUMMARIZE actual events from the narrative content you generated, NOT describe generic story concepts or planned future events.

STEP 1 - AFTER WRITING YOUR NARRATIVE:
Review the narrative content you just generated and identify if it contains a SIGNIFICANT story beat that advances the plot.

STEP 2 - QUALIFYING EVENTS:
A major event must be CONSEQUENTIAL and PLOT-ADVANCING. Qualifying categories:
  1. Critical decision with lasting consequences (betrayal, commitment, sacrifice, major choice)
  2. Major revelation or discovery (learning a secret, uncovering truth, realizing deception)
  3. Significant relationship shift (forming/breaking alliances, trust earned/destroyed, new conflict begins)
  4. Major progress toward main goal (achieving key objective, suffering major setback, reaching milestone)
  5. Story-changing events (combat outcomes, character injury/death, dramatic arrivals/departures)

STEP 3 - NON-QUALIFYING EVENTS (set to null):
  - Simple conversations without revelations
  - Movement/walking/traveling to nearby locations (unless arriving at completely new area)
  - Following something without reaching destination
  - Taking steps, approaching objects, getting closer to things
  - Routine item acquisition
  - Small talk or casual interactions
  - Observing environment without discovery
  - Investigating without finding anything significant
  - MAGNITUDE MATTERS: Incremental progress (walking closer, moving forward) is NOT major. Only ARRIVAL or DISCOVERY counts.

STEP 4 - WRITE THE SUMMARY:
If a qualifying event occurred in your narrative:
  - Extract the specific moment from your prose
  - Summarize it in ONE short clause (max 18 words)
  - Use third person, past tense, no markdown
  - Must directly correspond to something described in the content field

EXAMPLES (content → majorEvent):

CONTENT: "The clock radio blares Sonny and Cher's 'I Got You Babe,' and you groan, already knowing what fresh hell this day holds. You swat the snooze button..."
majorEvent: "Phil wakes to discover he's reliving Groundhog Day again" ✓

CONTENT: "You shake hands with the merchant, sealing the deal for 50 gold pieces."
majorEvent: "Agreed to deliver the artifact to the merchant for 50 gold" ✓

CONTENT: "You walk down the cobblestone street toward the tavern."
majorEvent: null ✓ (just movement)

CONTENT: "As you enter the tavern, you spot the wanted poster with YOUR face on it."
majorEvent: "Discovered they are wanted by the authorities" ✓

CONTENT: "You examine the door carefully, running your fingers along the frame."
majorEvent: null ✓ (investigating without discovery)

VALIDATION:
- Before finalizing, verify: Can a reader find this event in the content field?
- If no, set to null
- One major event per segment maximum
- Describe the event plainly (no markdown, no stats, no player-perspective language) so downstream systems can summarize it.`;
