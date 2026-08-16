import { generateUniqueId } from '@/lib/utils/generateId';
import type { Decision, NarrativeContext, DecisionOption } from '@/types/narrative.types';
import type { World } from '@/types/world.types';
import { createFallbackContextSummary } from './choiceGenerator.parser';

export const generateFallbackChoices = (
  world: World,
  narrativeContext: NarrativeContext
): Decision => {
  const location = narrativeContext?.currentLocation || 'here';
  const prompt = `What will you do in ${location}?`;
  const options: DecisionOption[] = [];
  const genre = (world?.genre || 'fantasy').toLowerCase();

  // Each genre branch contributes exactly three options, matching what the
  // generator asks the model for. A conditional fourth used to ride along here
  // and get silently dropped downstream.
  switch (genre) {
    case 'fantasy':
      options.push(
        {
          id: generateUniqueId('option'),
          text: 'Search for clues',
          alignment: 'neutral',
          hint: 'Look around carefully for important details',
        },
        {
          id: generateUniqueId('option'),
          text: 'Talk to nearby characters',
          alignment: 'lawful',
          hint: 'Gather information through conversation',
          requirements: [
            {
              type: 'skill',
              targetId: 'persuasion',
              operator: 'gte',
              value: 3,
            },
          ],
        },
        {
          id: generateUniqueId('option'),
          text: 'Cast a spell to illuminate the area',
          alignment: 'neutral',
          hint: 'Use magic to reveal hidden things',
          requirements: [
            {
              type: 'skill',
              targetId: 'magic',
              operator: 'gte',
              value: 4,
            },
          ],
        }
      );
      break;
    case 'sci-fi':
    case 'science fiction':
      options.push(
        { id: generateUniqueId('option'), text: 'Scan the area', alignment: 'neutral' },
        { id: generateUniqueId('option'), text: 'Access the terminal', alignment: 'lawful' },
        {
          id: generateUniqueId('option'),
          text: 'Override the airlock and vent the corridor',
          alignment: 'chaotic',
        }
      );
      break;
    case 'horror':
      options.push(
        { id: generateUniqueId('option'), text: 'Hide', alignment: 'neutral' },
        { id: generateUniqueId('option'), text: 'Call for help', alignment: 'lawful' },
        {
          id: generateUniqueId('option'),
          text: 'Set the room ablaze and run for the door',
          alignment: 'chaotic',
        }
      );
      break;
    default:
      options.push(
        { id: generateUniqueId('option'), text: 'Look around', alignment: 'neutral' },
        { id: generateUniqueId('option'), text: 'Talk to someone', alignment: 'lawful' },
        {
          id: generateUniqueId('option'),
          text: 'Upend the table and seize the upper hand',
          alignment: 'chaotic',
        }
      );
  }

  return {
    id: generateUniqueId('decision'),
    prompt,
    options,
    decisionWeight: 'minor',
    contextSummary: createFallbackContextSummary(narrativeContext),
  };
};
