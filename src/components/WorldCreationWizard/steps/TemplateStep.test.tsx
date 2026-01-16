import React from 'react';
import { render, screen } from '@testing-library/react';
import TemplateStep from './TemplateStep';

jest.mock('@/components/world/TemplateSelector', () => ({
  __esModule: true,
  default: () => <div data-testid="template-selector" />,
}));

jest.mock('@/components/world/SmartTemplates', () => ({
  SmartTemplates: () => <div data-testid="smart-templates" />,
}));

describe('TemplateStep', () => {
  it('renders tutorial anchors for the generate tab and create-own button', () => {
    const { container } = render(
      <TemplateStep
        selectedTemplateId={null}
        onUpdate={jest.fn()}
        errors={{}}
        onComplete={jest.fn()}
      />
    );

    const generateTabAnchor = container.querySelector('[data-tutorial="generate-tab"]');
    expect(generateTabAnchor).toBeInTheDocument();

    const createOwnButton = screen.getByRole('button', { name: /create my own world/i });
    expect(createOwnButton).toHaveAttribute('data-tutorial', 'create-own-world-btn');
  });
});
