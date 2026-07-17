import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SimpleModal, isJoyrideTooltipTarget } from '@/components/shared/SimpleModal';

describe('SimpleModal', () => {
  it('keeps the modal open when interacting with a Joyride tooltip', () => {
    const onClose = jest.fn();

    render(
      <>
        <SimpleModal isOpen={true} onClose={onClose} title="Generate World">
          <div>Modal content</div>
        </SimpleModal>
        <div className="react-joyride__tooltip">
          <button type="button">Next</button>
        </div>
      </>,
    );

    const nextButton = screen.getByRole('button', { name: 'Next', hidden: true });
    fireEvent.pointerDown(nextButton);
    fireEvent.click(nextButton);

    expect(onClose).not.toHaveBeenCalled();
  });

  it('detects Joyride tooltip targets for outside interactions', () => {
    const tooltip = document.createElement('div');
    tooltip.className = 'react-joyride__tooltip';
    const button = document.createElement('button');
    tooltip.appendChild(button);

    expect(isJoyrideTooltipTarget(button)).toBe(true);
    expect(isJoyrideTooltipTarget(document.body)).toBe(false);
    expect(isJoyrideTooltipTarget(null)).toBe(false);
  });

  it('uses overlay scrolling by default', () => {
    render(
      <SimpleModal isOpen={true} onClose={jest.fn()} title="Generate World">
        <div>Modal content</div>
      </SimpleModal>,
    );

    expect(document.querySelector('[data-scroll-container="overlay"]')).toBeTruthy();
    expect(document.querySelector('[data-scroll-container="content"]')).toBeNull();
  });

  it('supports content scrolling when requested', () => {
    render(
      <SimpleModal
        isOpen={true}
        onClose={jest.fn()}
        title="Generate World"
        scrollBehavior="content"
      >
        <div>Modal content</div>
      </SimpleModal>,
    );

    expect(document.querySelector('[data-scroll-container="content"]')).toBeTruthy();
    expect(document.querySelector('[data-scroll-container="overlay"]')).toBeNull();
  });

  it('exposes description as the dialog accessible description', () => {
    render(
      <SimpleModal
        isOpen={true}
        onClose={jest.fn()}
        title="Please wait"
        description="Loading Test World..."
      />,
    );

    expect(screen.getByRole('dialog')).toHaveAccessibleDescription(
      'Loading Test World...',
    );
  });

  it('does not trigger the Radix missing-description warning when description is set', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    render(
      <SimpleModal
        isOpen={true}
        onClose={jest.fn()}
        title="Please wait"
        description="Loading Test World..."
      />,
    );

    const missingDescriptionWarnings = warnSpy.mock.calls.filter((call) =>
      String(call[0]).includes('Missing `Description`'),
    );
    expect(missingDescriptionWarnings).toHaveLength(0);
    warnSpy.mockRestore();
  });

  it('lets ariaDescribedBy point the dialog at a caller-owned element', () => {
    // Radix cannot see caller-owned aria-describedby wiring and still logs
    // its missing-description heuristic warning for this path; silence it so
    // test output stays clean. The accessible description itself resolves.
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    render(
      <SimpleModal
        isOpen={true}
        onClose={jest.fn()}
        title="Generate World"
        ariaDescribedBy="caller-desc"
      >
        <p id="caller-desc">Caller supplied description.</p>
      </SimpleModal>,
    );

    expect(screen.getByRole('dialog')).toHaveAccessibleDescription(
      'Caller supplied description.',
    );
    warnSpy.mockRestore();
  });

  it('supports overlay scrolling with a footer', () => {
    render(
      <SimpleModal
        isOpen={true}
        onClose={jest.fn()}
        title="Generate World"
        stickyFooter={true}
        footer={<button type="button">Generate</button>}
      >
        <div>Modal content</div>
      </SimpleModal>,
    );

    expect(document.querySelector('[data-scroll-container="overlay"]')).toBeTruthy();
    expect(document.querySelector('[data-scroll-container="content"]')).toBeNull();
    expect(document.querySelector('[data-sticky-footer="true"]')).toBeTruthy();
  });
});
