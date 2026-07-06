import { render, screen } from '@testing-library/react';
import { WizardContainer } from '../WizardContainer';

describe('WizardContainer', () => {
  it('keeps base, wizard, and custom class tokens separate', () => {
    const { container } = render(
      <WizardContainer title="Setup" className="custom-hook">
        <div>Step body</div>
      </WizardContainer>
    );

    const root = container.firstElementChild as HTMLElement;

    expect(root).toBeInTheDocument();
    expect(root).toHaveClass('component-wizard-container');
    expect(root).toHaveClass('wizard-container');
    expect(root).toHaveClass('custom-hook');
    expect(screen.getByText('Step body')).toBeInTheDocument();
  });

  it('renders a string title as an h1 by default', () => {
    render(
      <WizardContainer title="Create New World">
        <div>Step body</div>
      </WizardContainer>
    );

    expect(
      screen.getByRole('heading', { level: 1, name: 'Create New World' })
    ).toBeInTheDocument();
  });

  it('demotes the title to an h2 when the page already owns the h1', () => {
    render(
      <WizardContainer title="Create Character in Fantasy Realm" titleElement="h2">
        <div>Step body</div>
      </WizardContainer>
    );

    expect(
      screen.getByRole('heading', { level: 2, name: 'Create Character in Fantasy Realm' })
    ).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
  });
});
