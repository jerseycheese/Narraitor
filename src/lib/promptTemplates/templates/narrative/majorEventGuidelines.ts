export const majorEventGuidelines = `MAJOR EVENT METADATA RULES:
- After writing the scene, evaluate whether a SIGNIFICANT story beat occurred that advances the plot.
- A qualifying major event must be CONSEQUENTIAL and PLOT-ADVANCING:
  1. Character makes a critical decision with lasting consequences (betrayal, commitment, sacrifice, major choice)
  2. A major revelation or discovery changes the character's understanding (learning a secret, uncovering truth, realizing deception)
  3. Significant relationship shift (forming/breaking alliances, trust earned/destroyed, new conflict begins)
  4. Major progress toward the main goal (achieving a key objective, suffering a major setback, reaching a milestone)
  5. Story-changing events (combat outcomes, character injury/death, dramatic arrivals/departures)
- Set metadata.majorEvent to null for routine actions like:
  - Simple conversations without revelations
  - Minor location changes (moving between rooms in same building)
  - Routine item acquisition (picking up common items)
  - Small talk or casual interactions
  - Observing the environment without discovery
- Set metadata.majorEvent to ONE short clause (max ~18 words) describing what happened.
- One major event per segment only; choose the most consequential beat.
- Describe the event plainly (no markdown, no stats, no player-perspective language) so downstream systems can summarize it.`;
