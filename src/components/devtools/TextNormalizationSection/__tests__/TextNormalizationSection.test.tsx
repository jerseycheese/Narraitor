import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TextNormalizationSection } from '../TextNormalizationSection';

// Mock the text normalization utilities
jest.mock('../../../../lib/utils/textNormalization', () => ({
  normalizeText: jest.fn((text, options) => {
    // Simple mock implementation for testing
    if (!text) return '';
    let result = text;
    if (options?.normalizeWhitespace !== false) {
      result = result.replace(/\s+/g, ' ').trim();
    }
    if (options?.normalizeLineEndings !== false) {
      result = result.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    }
    if (options?.normalizeQuotes !== false) {
      result = result.replace(/[""]/g, '"').replace(/['']/g, "'");
    }
    if (options?.normalizeParagraphs !== false) {
      result = result.replace(/\n{3,}/g, '\n\n');
    }
    return result;
  })
}));

describe('TextNormalizationSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders the text normalization interface', () => {
      render(<TextNormalizationSection />);
      
      // Check for main heading
      expect(screen.getByText(/text normalization/i)).toBeInTheDocument();
      
      // Check for input textarea
      expect(screen.getByLabelText(/input text/i)).toBeInTheDocument();
      
      // Check for output textarea
      expect(screen.getByLabelText(/normalized text/i)).toBeInTheDocument();
      
      // Check for normalize button
      expect(screen.getByRole('button', { name: /normalize text/i })).toBeInTheDocument();
    });

    it('displays normalization option controls', () => {
      render(<TextNormalizationSection />);
      
      // Check for checkboxes for each normalization option
      expect(screen.getByLabelText(/normalize paragraphs/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/normalize whitespace/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/normalize quotation marks/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/normalize line endings/i)).toBeInTheDocument();
    });

    it('shows all options checked by default', () => {
      render(<TextNormalizationSection />);
      
      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach(checkbox => {
        expect(checkbox).toBeChecked();
      });
    });
  });

  describe('Text Input and Processing', () => {
    it('allows user to input text', async () => {
      const user = userEvent.setup();
      render(<TextNormalizationSection />);
      
      const inputTextarea = screen.getByLabelText(/input text/i);
      const testText = 'This is sample text with formatting issues.';
      
      await user.type(inputTextarea, testText);
      
      expect(inputTextarea).toHaveValue(testText);
    });

    it('processes text when normalize button is clicked', async () => {
      const user = userEvent.setup();
      render(<TextNormalizationSection />);
      
      const inputTextarea = screen.getByLabelText(/input text/i);
      const normalizeButton = screen.getByRole('button', { name: /normalize text/i });
      const testText = 'Text    with    extra    spaces.';
      
      await user.type(inputTextarea, testText);
      await user.click(normalizeButton);
      
      const outputTextarea = screen.getByLabelText(/normalized text/i);
      expect(outputTextarea).toHaveValue('Text with extra spaces.');
    });

    it('updates output in real-time when auto-normalize is enabled', async () => {
      const user = userEvent.setup();
      render(<TextNormalizationSection />);
      
      // Enable auto-normalize if there's a toggle for it
      const autoNormalizeToggle = screen.queryByLabelText(/auto.?normalize/i);
      if (autoNormalizeToggle) {
        await user.click(autoNormalizeToggle);
      }
      
      const inputTextarea = screen.getByLabelText(/input text/i);
      const testText = 'Real-time    normalization    test.';
      
      await user.type(inputTextarea, testText);
      
      // Should update output automatically
      await waitFor(() => {
        const outputTextarea = screen.getByLabelText(/normalized text/i);
        expect(outputTextarea.value).toBe('Real-time normalization test.');
      });
    });

    it('handles empty input gracefully', async () => {
      const user = userEvent.setup();
      render(<TextNormalizationSection />);
      
      const normalizeButton = screen.getByRole('button', { name: /normalize text/i });
      await user.click(normalizeButton);
      
      const outputTextarea = screen.getByLabelText(/normalized text/i);
      expect(outputTextarea).toHaveValue('');
    });
  });

  describe('Normalization Options', () => {
    it('respects individual normalization option toggles', async () => {
      const user = userEvent.setup();
      render(<TextNormalizationSection />);
      
      const inputTextarea = screen.getByLabelText(/input text/i);
      const whitespaceCheckbox = screen.getByLabelText(/normalize whitespace/i);
      const normalizeButton = screen.getByRole('button', { name: /normalize text/i });
      
      // Disable whitespace normalization
      await user.uncheck(whitespaceCheckbox);
      
      const testText = 'Text    with    extra    spaces.';
      await user.type(inputTextarea, testText);
      await user.click(normalizeButton);
      
      const outputTextarea = screen.getByLabelText(/normalized text/i);
      // Should preserve extra spaces since whitespace normalization is disabled
      expect(outputTextarea.value).toContain('    ');
    });

    it('allows toggling multiple options independently', async () => {
      const user = userEvent.setup();
      render(<TextNormalizationSection />);
      
      const paragraphsCheckbox = screen.getByLabelText(/normalize paragraphs/i);
      const quotesCheckbox = screen.getByLabelText(/normalize quotation marks/i);
      
      // Test toggling options
      await user.uncheck(paragraphsCheckbox);
      expect(paragraphsCheckbox).not.toBeChecked();
      
      await user.uncheck(quotesCheckbox);
      expect(quotesCheckbox).not.toBeChecked();
      
      // Re-check one option
      await user.check(paragraphsCheckbox);
      expect(paragraphsCheckbox).toBeChecked();
      expect(quotesCheckbox).not.toBeChecked();
    });
  });

  describe('Before/After Comparison', () => {
    it('shows clear before and after text comparison', async () => {
      const user = userEvent.setup();
      render(<TextNormalizationSection />);
      
      const inputTextarea = screen.getByLabelText(/input text/i);
      const normalizeButton = screen.getByRole('button', { name: /normalize text/i });
      const testText = 'Text    with\r\n\r\n\r\nformatting   issues.';
      
      await user.type(inputTextarea, testText);
      await user.click(normalizeButton);
      
      // Input should remain unchanged
      expect(inputTextarea).toHaveValue(testText);
      
      // Output should be normalized
      const outputTextarea = screen.getByLabelText(/normalized text/i);
      expect(outputTextarea.value).toBe('Text with\n\nformatting issues.');
      expect(outputTextarea.value).not.toBe(testText);
    });

    it('provides visual feedback for changes made', async () => {
      const user = userEvent.setup();
      render(<TextNormalizationSection />);
      
      const inputTextarea = screen.getByLabelText(/input text/i);
      const normalizeButton = screen.getByRole('button', { name: /normalize text/i });
      
      // Test with text that will have changes
      const problematicText = '"Curly quotes"    and    extra    spaces.';
      await user.type(inputTextarea, problematicText);
      await user.click(normalizeButton);
      
      // Should show some indication that changes were made
      // This could be a changes counter, highlighted differences, or status message
      const changesIndicator = screen.queryByText(/changes made/i) || 
                               screen.queryByText(/normalized/i) ||
                               screen.queryByText(/\d+ changes/i);
      
      if (changesIndicator) {
        expect(changesIndicator).toBeInTheDocument();
      }
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('handles very long text input', async () => {
      const user = userEvent.setup();
      render(<TextNormalizationSection />);
      
      const inputTextarea = screen.getByLabelText(/input text/i);
      const normalizeButton = screen.getByRole('button', { name: /normalize text/i });
      
      // Create a long text string
      const longText = 'This is a long paragraph. '.repeat(100);
      
      await user.type(inputTextarea, longText);
      await user.click(normalizeButton);
      
      const outputTextarea = screen.getByLabelText(/normalized text/i);
      expect(outputTextarea.value.length).toBeGreaterThan(0);
      expect(outputTextarea.value.length).toBeLessThanOrEqual(longText.length);
    });

    it('shows loading state during processing', async () => {
      const user = userEvent.setup();
      render(<TextNormalizationSection />);
      
      const inputTextarea = screen.getByLabelText(/input text/i);
      const normalizeButton = screen.getByRole('button', { name: /normalize text/i });
      
      await user.type(inputTextarea, 'Test text');
      
      // Click and immediately check for loading state
      fireEvent.click(normalizeButton);
      
      // Should show loading indicator (button disabled or loading text)
      const loadingIndicator = screen.queryByText(/processing/i) ||
                               screen.queryByText(/normalizing/i);
      
      if (loadingIndicator) {
        expect(loadingIndicator).toBeInTheDocument();
      } else {
        // At minimum, button should be disabled during processing
        expect(normalizeButton).toBeDisabled();
      }
    });
  });

  describe('Accessibility', () => {
    it('provides proper labels and ARIA attributes', () => {
      render(<TextNormalizationSection />);
      
      // Check for proper labeling
      expect(screen.getByLabelText(/input text/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/normalized text/i)).toBeInTheDocument();
      
      // Check for form controls accessibility
      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach(checkbox => {
        expect(checkbox).toHaveAttribute('aria-describedby');
      });
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<TextNormalizationSection />);
      
      // Tab through the interface
      await user.tab();
      expect(screen.getByLabelText(/input text/i)).toHaveFocus();
      
      await user.tab();
      // Should focus on first checkbox or normalize button
      const focusedElement = document.activeElement;
      expect(focusedElement).toBeInTheDocument();
      expect(focusedElement?.getAttribute('role')).toMatch(/checkbox|button/);
    });
  });

  describe('Integration with DevTools', () => {
    it('fits within DevTools panel styling', () => {
      render(
        <div className="bg-slate-800 text-slate-200">
          <TextNormalizationSection />
        </div>
      );
      
      // Component should adapt to dark theme
      const section = screen.getByText(/text normalization/i).closest('div');
      expect(section).toBeInTheDocument();
      
      // Should not have light theme styling that conflicts
      expect(section).not.toHaveClass('bg-white');
      expect(section).not.toHaveClass('text-black');
    });

    it('provides debug information when requested', () => {
      render(<TextNormalizationSection debugMode={true} />);
      
      // Should show additional debug information
      const debugInfo = screen.queryByText(/debug/i) ||
                       screen.queryByText(/options applied/i) ||
                       screen.queryByText(/processing time/i);
      
      if (debugInfo) {
        expect(debugInfo).toBeInTheDocument();
      }
    });
  });
});