import { render, screen } from '@testing-library/react';
import { WizardProgress } from '../WizardProgress';

describe('WizardProgress', () => {
  const steps = [
    { id: 'basic', label: 'Basic Information' },
    { id: 'description', label: 'Description' },
    { id: 'attributes', label: 'Attributes' },
    { id: 'skills', label: 'Skills' },
    { id: 'finalize', label: 'Finalize' },
  ];

  it('renders ordered list semantics with aria-current="step" on the active step', () => {
    render(<WizardProgress steps={steps} currentStep={2} />);

    const list = screen.getByRole('list');
    expect(list).toBeInTheDocument();

    const listItems = screen.getAllByRole('listitem');
    expect(listItems).toHaveLength(5);

    expect(listItems[0]).not.toHaveAttribute('aria-current');
    expect(listItems[1]).not.toHaveAttribute('aria-current');
    expect(listItems[2]).toHaveAttribute('aria-current', 'step');
    expect(listItems[3]).not.toHaveAttribute('aria-current');
    expect(listItems[4]).not.toHaveAttribute('aria-current');
  });

  it('renders accessible mobile step indicator without aria-hidden on text content', () => {
    const { container } = render(<WizardProgress steps={steps} currentStep={1} />);

    const mobileContainer = container.querySelector('.wizard-progress-mobile');
    expect(mobileContainer).not.toHaveAttribute('aria-hidden');

    const mobileCount = container.querySelector('.wizard-progress-mobile-count');
    expect(mobileCount).toHaveTextContent('Step 2 of 5');

    const mobileCurrent = container.querySelector('.wizard-progress-mobile-current');
    expect(mobileCurrent).toHaveTextContent('Description');
    expect(mobileCurrent).toHaveAttribute('aria-current', 'step');

    const segmentsContainer = container.querySelector('.wizard-progress-segments');
    expect(segmentsContainer).toHaveAttribute('aria-hidden', 'true');

    const segments = container.querySelectorAll('.wizard-progress-segment');
    expect(segments).toHaveLength(5);
  });
});
