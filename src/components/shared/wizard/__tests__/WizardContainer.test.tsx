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
});
