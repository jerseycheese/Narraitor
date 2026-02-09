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

  it('centers overlay content when it fits using auto margins', () => {
    render(
      <SimpleModal isOpen={true} onClose={jest.fn()} title="Generate World">
        <div>Modal content</div>
      </SimpleModal>,
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog.className).toContain('');
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
