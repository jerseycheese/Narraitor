import { baseNarrativeTemplate } from './baseNarrativeTemplate';
import { initialSceneTemplate } from './initialSceneTemplate';
import { sceneTemplate } from './sceneTemplate';
import { transitionTemplate } from './transitionTemplate';
import { playerChoiceTemplate } from './playerChoiceTemplate';
import { alignedChoiceTemplate } from './choiceTypeTemplates';
import { skillAcknowledgmentTemplate } from './skillAcknowledgmentTemplate';
import { actionTemplate } from './actionTemplate';

export const narrativeTemplates = [
  {
    id: 'narrative/base',
    generate: baseNarrativeTemplate
  },
  {
    id: 'narrative/action',
    generate: actionTemplate
  },
  {
    id: 'narrative/initialScene',
    generate: initialSceneTemplate
  },
  {
    id: 'narrative/scene',
    generate: sceneTemplate
  },
  {
    id: 'narrative/transition',
    generate: transitionTemplate
  },
  {
    id: 'narrative/playerChoice',
    generate: playerChoiceTemplate
  },
  {
    id: 'narrative/alignedPlayerChoice',
    generate: alignedChoiceTemplate
  },
  {
    id: 'narrative/skillAcknowledgment',
    generate: skillAcknowledgmentTemplate
  }
];
