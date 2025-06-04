import { PromptTemplate, PromptType } from '../../types';
import { baseNarrativeTemplate } from './baseNarrativeTemplate';
import { initialSceneTemplate } from './initialSceneTemplate';
import { sceneTemplate } from './sceneTemplate';
import { transitionTemplate } from './transitionTemplate';
import { playerChoiceTemplate } from './playerChoiceTemplate';
import { alignedChoiceTemplate } from './choiceTypeTemplates';

// Convert function templates to PromptTemplate objects
export const narrativeTemplates: PromptTemplate[] = [
  {
    id: 'narrative/base',
    name: 'Base Narrative Template',
    type: PromptType.NarrativeGeneration,
    content: '{{prompt}}',
    variables: [
      {
        name: 'prompt',
        type: 'string',
        description: 'The generated prompt for narrative content',
        required: true
      }
    ],
    generate: baseNarrativeTemplate
  },
  {
    id: 'narrative/initialScene',
    name: 'Initial Scene Template',
    type: PromptType.NarrativeGeneration,
    content: '{{prompt}}',
    variables: [
      {
        name: 'prompt',
        type: 'string',
        description: 'The generated prompt for initial scene',
        required: true
      }
    ],
    generate: initialSceneTemplate
  },
  {
    id: 'narrative/scene',
    name: 'Scene Template',
    type: PromptType.NarrativeGeneration,
    content: '{{prompt}}',
    variables: [
      {
        name: 'prompt',
        type: 'string',
        description: 'The generated prompt for scene content',
        required: true
      }
    ],
    generate: sceneTemplate
  },
  {
    id: 'narrative/transition',
    name: 'Transition Template',
    type: PromptType.NarrativeGeneration,
    content: '{{prompt}}',
    variables: [
      {
        name: 'prompt',
        type: 'string',
        description: 'The generated prompt for transition content',
        required: true
      }
    ],
    generate: transitionTemplate
  },
  {
    id: 'narrative/playerChoice',
    name: 'Player Choice Template',
    type: PromptType.NarrativeGeneration,
    content: '{{prompt}}',
    variables: [
      {
        name: 'prompt',
        type: 'string',
        description: 'The generated prompt for player choices',
        required: true
      }
    ],
    generate: playerChoiceTemplate
  },
  {
    id: 'narrative/alignedPlayerChoice',
    name: 'Aligned Player Choice Template',
    type: PromptType.NarrativeGeneration,
    content: '{{prompt}}',
    variables: [
      {
        name: 'prompt',
        type: 'string',
        description: 'The generated prompt for aligned player choices',
        required: true
      }
    ],
    generate: alignedChoiceTemplate
  }
];
