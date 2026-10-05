import { initialSceneTemplate } from '../initialSceneTemplate';
import { sceneTemplate } from '../sceneTemplate';

const context = {
  worldName: 'Harbor',
  genre: 'noir',
  playerCharacterBackground: { history: 'Former dock worker.' },
  chapter: {
    number: 2,
    isOpening: true,
    isEnding: false,
    recap: 'Previously: The bridge fell.',
  },
};
afterEach(() => {
  delete process.env.NEXT_PUBLIC_FEATURE_CHAPTERS;
});

it.each([initialSceneTemplate, sceneTemplate])(
  'renders recap separately and preserves flag-off bytes',
  (template) => {
    process.env.NEXT_PUBLIC_FEATURE_CHAPTERS = 'false';
    const baseline = template({ ...context, chapter: undefined });
    expect(template(context)).toBe(baseline);
    process.env.NEXT_PUBLIC_FEATURE_CHAPTERS = 'true';
    expect(template(context)).toContain('CHAPTER RECAP');
    expect(template(context)).toContain(context.chapter.recap);
    expect(template(context)).toContain('Former dock worker.');
  }
);
