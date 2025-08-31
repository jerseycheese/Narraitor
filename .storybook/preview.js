/**
 * Simplified Storybook Preview Configuration
 * Without dark mode support
 */
import '../src/app/globals.css';
import './storybook.css';

const preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    options: {
      storySort: {
        order: [
          '01-Atoms', 
          [
            '01-Atoms', 
            [
              'buttons',
              'display', 
              'feedback',
              'forms',
              ['forms', ['inputs', 'controls']]
            ]
          ],
          '02-Molecules', 
          [
            '02-Molecules', 
            [
              'character-display',
              'devtools',
              'forms',
              ['forms', ['editors', 'managers']],
              'ui-components',
              ['ui-components', ['cards', 'layout', 'selectors']],
              'world-forms'
            ]
          ],
          '03-Organisms', 
          [
            '03-Organisms', 
            [
              'character',
              ['character', ['display', 'portrait', 'editor']],
              'world',
              ['world', ['display', 'lists', 'editor', 'actions']],
              'narrative',
              ['narrative', ['display', 'controls', 'core']],
              'navigation',
              'journal',
              'dialogs',
              'devtools',
              ['devtools', ['panels', 'sections']],
              'game-session',
              ['game-session', ['controls', 'setup']],
              'editor-components'
            ]
          ],
          '04-Templates', 
          [
            '04-Templates', 
            [
              'layouts',
              'wizards',
              ['wizards', ['character', 'world', 'game']]
            ]
          ],
          '05-Pages',
          [
            '05-Pages',
            [
              'game-session',
              'standalone'
            ]
          ],
          '06-Patterns',
          [
            '06-Patterns',
            [
              'ai-integration',
              'navigation', 
              'data-management',
              'ui-patterns'
            ]
          ]
        ],
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#ffffff' },
      ],
    },
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/',
        query: {},
        push: (...args) => {
          console.log('[Storybook] router.push called with:', args);
          return Promise.resolve(true);
        },
        replace: (...args) => {
          console.log('[Storybook] router.replace called with:', args);
          return Promise.resolve(true);
        },
        back: () => {
          console.log('[Storybook] router.back called');
        },
      },
    },
  },
};

export default preview;