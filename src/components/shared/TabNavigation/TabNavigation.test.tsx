// src/components/shared/TabNavigation/TabNavigation.test.tsx

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TabNavigation, TabOption } from './TabNavigation';

describe('TabNavigation', () => {
  const mockOnChange = jest.fn();
  const defaultOptions: TabOption<string>[] = [
    { value: 'tab1', label: 'First Tab' },
    { value: 'tab2', label: 'Second Tab' },
    { value: 'tab3', label: 'Third Tab' }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    test('renders all tab options', () => {
      render(
        <TabNavigation
          options={defaultOptions}
          activeValue="tab1"
          onChange={mockOnChange}
        />
      );

      expect(screen.getByRole('button', { name: 'First Tab' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Second Tab' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Third Tab' })).toBeInTheDocument();
    });

    test('highlights active tab with correct styling', () => {
      render(
        <TabNavigation
          options={defaultOptions}
          activeValue="tab2"
          onChange={mockOnChange}
        />
      );

      const activeTab = screen.getByRole('button', { name: 'Second Tab' });
      const inactiveTab = screen.getByRole('button', { name: 'First Tab' });

      expect(activeTab).toHaveClass('bg-blue-500', 'text-white');
      expect(inactiveTab).toHaveClass('bg-gray-200', 'text-gray-700');
    });

    test('applies custom className to container', () => {
      const { container } = render(
        <TabNavigation
          options={defaultOptions}
          activeValue="tab1"
          onChange={mockOnChange}
          className="custom-class"
        />
      );

      const tabContainer = container.firstChild as HTMLElement;
      expect(tabContainer).toHaveClass('custom-class');
    });
  });

  describe('Interaction', () => {
    test('calls onChange when tab is clicked', () => {
      render(
        <TabNavigation
          options={defaultOptions}
          activeValue="tab1"
          onChange={mockOnChange}
        />
      );

      const secondTab = screen.getByRole('button', { name: 'Second Tab' });
      fireEvent.click(secondTab);

      expect(mockOnChange).toHaveBeenCalledWith('tab2');
    });

    test('does not call onChange when clicking active tab', () => {
      render(
        <TabNavigation
          options={defaultOptions}
          activeValue="tab1"
          onChange={mockOnChange}
        />
      );

      const activeTab = screen.getByRole('button', { name: 'First Tab' });
      fireEvent.click(activeTab);

      expect(mockOnChange).toHaveBeenCalledWith('tab1');
    });
  });

  describe('Disabled States', () => {
    test('disables individual tabs when option is disabled', () => {
      const optionsWithDisabled: TabOption<string>[] = [
        { value: 'tab1', label: 'First Tab' },
        { value: 'tab2', label: 'Second Tab', disabled: true },
        { value: 'tab3', label: 'Third Tab' }
      ];

      render(
        <TabNavigation
          options={optionsWithDisabled}
          activeValue="tab1"
          onChange={mockOnChange}
        />
      );

      const disabledTab = screen.getByRole('button', { name: 'Second Tab' });
      expect(disabledTab).toBeDisabled();
      expect(disabledTab).toHaveClass('opacity-50', 'cursor-not-allowed');

      fireEvent.click(disabledTab);
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    test('disables all tabs when component is disabled', () => {
      render(
        <TabNavigation
          options={defaultOptions}
          activeValue="tab1"
          onChange={mockOnChange}
          disabled={true}
        />
      );

      defaultOptions.forEach(option => {
        const tab = screen.getByRole('button', { name: option.label });
        expect(tab).toBeDisabled();
        expect(tab).toHaveClass('opacity-50', 'cursor-not-allowed');
      });

      // Try clicking any tab
      const firstTab = screen.getByRole('button', { name: 'First Tab' });
      fireEvent.click(firstTab);
      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('Generic Type Support', () => {
    test('works with numeric values', () => {
      const numericOptions: TabOption<number>[] = [
        { value: 1, label: 'One' },
        { value: 2, label: 'Two' },
        { value: 3, label: 'Three' }
      ];

      const mockNumericOnChange = jest.fn();

      render(
        <TabNavigation
          options={numericOptions}
          activeValue={2}
          onChange={mockNumericOnChange}
        />
      );

      const firstTab = screen.getByRole('button', { name: 'One' });
      fireEvent.click(firstTab);

      expect(mockNumericOnChange).toHaveBeenCalledWith(1);
    });

    test('works with union type values', () => {
      type Mode = 'inspired-by' | 'genre-mix' | 'surprise-me';
      const modeOptions: TabOption<Mode>[] = [
        { value: 'inspired-by', label: 'I want something like...' },
        { value: 'genre-mix', label: 'Genre Mixer' },
        { value: 'surprise-me', label: 'Surprise me!' }
      ];

      const mockModeOnChange = jest.fn();

      render(
        <TabNavigation
          options={modeOptions}
          activeValue="inspired-by"
          onChange={mockModeOnChange}
        />
      );

      const genreMixerTab = screen.getByRole('button', { name: 'Genre Mixer' });
      fireEvent.click(genreMixerTab);

      expect(mockModeOnChange).toHaveBeenCalledWith('genre-mix');
    });
  });

  describe('Mobile Responsiveness', () => {
    test('uses wrap layout by default', () => {
      const { container } = render(
        <TabNavigation
          options={defaultOptions}
          activeValue="tab1"
          onChange={mockOnChange}
        />
      );

      const tabContainer = container.firstChild as HTMLElement;
      expect(tabContainer).toHaveClass('flex-wrap');
      expect(tabContainer).not.toHaveClass('overflow-x-auto');
    });

    test('uses scroll layout when specified', () => {
      const { container } = render(
        <TabNavigation
          options={defaultOptions}
          activeValue="tab1"
          onChange={mockOnChange}
          mobileLayout="scroll"
        />
      );

      const tabContainer = container.firstChild as HTMLElement;
      expect(tabContainer).toHaveClass('overflow-x-auto');
      expect(tabContainer).not.toHaveClass('flex-wrap');
    });

    test('applies mobile-responsive classes to buttons', () => {
      render(
        <TabNavigation
          options={defaultOptions}
          activeValue="tab1"
          onChange={mockOnChange}
        />
      );

      const firstTab = screen.getByRole('button', { name: 'First Tab' });
      expect(firstTab).toHaveClass('px-2', 'py-1.5', 'sm:px-4', 'sm:py-2');
      expect(firstTab).toHaveClass('text-sm', 'sm:text-base');
      expect(firstTab).toHaveClass('whitespace-nowrap');
    });

    test('adds flex-shrink-0 for scroll layout', () => {
      render(
        <TabNavigation
          options={defaultOptions}
          activeValue="tab1"
          onChange={mockOnChange}
          mobileLayout="scroll"
        />
      );

      const firstTab = screen.getByRole('button', { name: 'First Tab' });
      expect(firstTab).toHaveClass('flex-shrink-0');
    });
  });

  describe('Accessibility', () => {
    test('renders buttons with proper type', () => {
      render(
        <TabNavigation
          options={defaultOptions}
          activeValue="tab1"
          onChange={mockOnChange}
        />
      );

      defaultOptions.forEach(option => {
        const tab = screen.getByRole('button', { name: option.label });
        expect(tab).toHaveAttribute('type', 'button');
      });
    });

    test('supports keyboard navigation', () => {
      render(
        <TabNavigation
          options={defaultOptions}
          activeValue="tab1"
          onChange={mockOnChange}
        />
      );

      const secondTab = screen.getByRole('button', { name: 'Second Tab' });
      
      // Focus and press Enter
      secondTab.focus();
      fireEvent.keyDown(secondTab, { key: 'Enter' });
      fireEvent.click(secondTab);

      expect(mockOnChange).toHaveBeenCalledWith('tab2');
    });
  });
});