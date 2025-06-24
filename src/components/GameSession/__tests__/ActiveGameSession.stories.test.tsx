import React from 'react';
import { render } from '@testing-library/react';
import * as stories from '../ActiveGameSession.stories';
import { composeStories } from '@storybook/react';

// Mock scrollTo to avoid errors in tests
beforeAll(() => {
  Element.prototype.scrollTo = jest.fn();
});

// Compose the stories for testing
const composedStories = composeStories(stories);

describe('ActiveGameSession Stories', () => {
  // Test that all stories can render without crashing
  Object.entries(composedStories).forEach(([storyName, Story]) => {
    test(`renders ${storyName} story without crashing`, () => {
      // Just ensure the story renders without throwing
      const { container } = render(<Story />);
      expect(container).toBeTruthy();
    });
  });
});
