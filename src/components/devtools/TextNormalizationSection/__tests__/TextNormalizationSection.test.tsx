import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TextNormalizationSection } from '../TextNormalizationSection';

// Mock the text normalization utilities
jest.mock('../../../../lib/utils/textNormalization', () => ({
  normalizeTextWithDetails: jest.fn((text, options) => {
    // Simple mock implementation for testing
    if (!text) return {
      normalized: '',
      changes: [],
      stats: { originalLength: 0, normalizedLength: 0, totalChanges: 0, processingTime: 0 }
    };
    
    let result = text;
    const changes: any[] = [];
    
    if (options?.normalizeWhitespace !== false) {
      if (/\s{2,}/.test(result)) {
        changes.push({ type: 'whitespace', description: 'Normalized excessive spaces', count: 1 });
      }
      result = result.replace(/\s+/g, ' ').trim();
    }
    
    if (options?.normalizeLineEndings !== false) {
      if (/\r/.test(result)) {
        changes.push({ type: 'lineEndings', description: 'Normalized line endings', count: 1 });
      }
      result = result.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    }
    
    if (options?.normalizeQuotes !== false) {
      if (/[""'']/.test(result)) {
        changes.push({ type: 'quotes', description: 'Normalized quotes', count: 1 });
      }
      result = result.replace(/[""]/g, '"').replace(/['']/g, "'");
    }
    
    if (options?.normalizeSpecialChars !== false) {
      if (/[—–…]/.test(result)) {
        changes.push({ type: 'specialChars', description: 'Normalized special characters', count: 1 });
      }
      result = result.replace(/—/g, '-').replace(/–/g, '-').replace(/…/g, '...');
    }
    
    return {
      normalized: result,
      changes,
      stats: {
        originalLength: text.length,
        normalizedLength: result.length,
        totalChanges: changes.length,
        processingTime: 1.5
      }
    };
  }),
  
  analyzeText: jest.fn((text) => ({
    characters: text?.length || 0,
    words: text?.split(/\s+/).filter(w => w.length > 0).length || 0,
    lines: text?.split('\n').length || 0,
    paragraphs: text?.split(/\n\n/).length || 0,
    lineEndingFormat: 'unix' as const,
    hasSpecialChars: /[—–…]/.test(text || ''),
    hasSmartQuotes: /[""'']/.test(text || '')
  })),
  
  getWhitespaceStats: jest.fn((text) => ({
    leading: (text?.match(/^\s*/) || [''])[0].length,
    trailing: (text?.match(/\s*$/) || [''])[0].length,
    excessiveSpaces: (text?.match(/\s{2,}/g) || []).length,
    tabs: (text?.match(/\t/g) || []).length,
    multipleLineBreaks: (text?.match(/\n{3,}/g) || []).length
  }))
}));

describe('TextNormalizationSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders with default props', () => {
      render(<TextNormalizationSection />);
      
      expect(screen.getByText('Text Normalization')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter text to normalize...')).toBeInTheDocument();
      expect(screen.getByText('Export')).toBeInTheDocument();
      expect(screen.getByText('Copy Result')).toBeInTheDocument();
    });

    it('renders with initial text', () => {
      const initialText = 'Hello world';
      render(<TextNormalizationSection initialText={initialText} />);
      
      const input = screen.getByDisplayValue(initialText);
      expect(input).toBeInTheDocument();
    });

    it('renders normalization options', () => {
      render(<TextNormalizationSection />);
      
      expect(screen.getByText('Normalize Whitespace')).toBeInTheDocument();
      expect(screen.getByText('Normalize Line Endings')).toBeInTheDocument();
      expect(screen.getByText('Normalize Quotes')).toBeInTheDocument();
      expect(screen.getByText('Normalize Special Characters')).toBeInTheDocument();
      expect(screen.getByText('Preserve Structure')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('updates input text when user types', async () => {
      const user = userEvent.setup();
      render(<TextNormalizationSection />);
      
      const input = screen.getByPlaceholderText('Enter text to normalize...');
      await user.type(input, 'Hello world');
      
      expect(input).toHaveValue('Hello world');
    });

    it('toggles normalization options when checkboxes are clicked', async () => {
      const user = userEvent.setup();
      render(<TextNormalizationSection />);
      
      const whitespaceCheckbox = screen.getByLabelText('Normalize Whitespace');
      expect(whitespaceCheckbox).toBeChecked();
      
      await user.click(whitespaceCheckbox);
      expect(whitespaceCheckbox).not.toBeChecked();
    });

    it('loads sample data when sample buttons are clicked', async () => {
      const user = userEvent.setup();
      render(<TextNormalizationSection />);
      
      const whitespaceButton = screen.getByText('whitespace');
      await user.click(whitespaceButton);
      
      const input = screen.getByPlaceholderText('Enter text to normalize...');
      expect(input).toHaveValue(expect.stringContaining('Hello'));
    });
  });

  describe('Normalization Display', () => {
    it('displays normalized text in output area', () => {
      render(<TextNormalizationSection initialText="Hello    world" />);
      
      const output = screen.getByDisplayValue('Hello world');
      expect(output).toBeInTheDocument();
      expect(output).toHaveAttribute('readOnly');
    });

    it('shows text statistics', () => {
      render(<TextNormalizationSection initialText="Hello world" />);
      
      expect(screen.getByText(/11 characters/)).toBeInTheDocument();
      expect(screen.getByText(/2 words/)).toBeInTheDocument();
    });

    it('displays changes summary when changes are made', () => {
      render(<TextNormalizationSection initialText="Hello    world" />);
      
      expect(screen.getByText('Changes Made:')).toBeInTheDocument();
      expect(screen.getByText(/whitespace:/)).toBeInTheDocument();
    });
  });

  describe('Advanced Features', () => {
    it('shows text analysis when toggle is clicked', async () => {
      const user = userEvent.setup();
      render(<TextNormalizationSection showAdvanced={true} />);
      
      const analysisButton = screen.getByText('Show Text Analysis');
      await user.click(analysisButton);
      
      await waitFor(() => {
        expect(screen.getByText('Text Analysis:')).toBeInTheDocument();
        expect(screen.getByText('Structure:')).toBeInTheDocument();
        expect(screen.getByText('Format:')).toBeInTheDocument();
      });
    });

    it('shows whitespace stats when toggle is clicked', async () => {
      const user = userEvent.setup();
      render(<TextNormalizationSection showAdvanced={true} />);
      
      const statsButton = screen.getByText('Show Whitespace Stats');
      await user.click(statsButton);
      
      await waitFor(() => {
        expect(screen.getByText('Whitespace Statistics:')).toBeInTheDocument();
        expect(screen.getByText('Leading/Trailing:')).toBeInTheDocument();
        expect(screen.getByText('Internal:')).toBeInTheDocument();
      });
    });

    it('hides advanced features when showAdvanced is false', () => {
      render(<TextNormalizationSection showAdvanced={false} />);
      
      expect(screen.queryByText('Show Text Analysis')).not.toBeInTheDocument();
      expect(screen.queryByText('Show Whitespace Stats')).not.toBeInTheDocument();
    });
  });

  describe('Export and Copy Features', () => {
    it('copies normalized text to clipboard when copy button is clicked', async () => {
      const mockWriteText = jest.fn();
      Object.assign(navigator, {
        clipboard: {
          writeText: mockWriteText,
        },
      });
      
      const user = userEvent.setup();
      render(<TextNormalizationSection initialText="Hello    world" />);
      
      const copyButton = screen.getByText('Copy Result');
      await user.click(copyButton);
      
      expect(mockWriteText).toHaveBeenCalledWith('Hello world');
    });

    it('creates download link when export button is clicked', async () => {
      // Mock URL.createObjectURL and related APIs
      const mockCreateObjectURL = jest.fn(() => 'mock-url');
      const mockRevokeObjectURL = jest.fn();
      const mockClick = jest.fn();
      const mockAppendChild = jest.fn();
      const mockRemoveChild = jest.fn();
      
      Object.assign(window.URL, {
        createObjectURL: mockCreateObjectURL,
        revokeObjectURL: mockRevokeObjectURL,
      });
      
      const mockAnchor = {
        href: '',
        download: '',
        click: mockClick,
      };
      
      jest.spyOn(document, 'createElement').mockReturnValue(mockAnchor as any);
      jest.spyOn(document.body, 'appendChild').mockImplementation(mockAppendChild);
      jest.spyOn(document.body, 'removeChild').mockImplementation(mockRemoveChild);
      
      const user = userEvent.setup();
      render(<TextNormalizationSection initialText="Hello world" />);
      
      const exportButton = screen.getByText('Export');
      await user.click(exportButton);
      
      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockClick).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has proper form labels', () => {
      render(<TextNormalizationSection />);
      
      expect(screen.getByLabelText('Input Text:')).toBeInTheDocument();
      expect(screen.getByLabelText('Normalized Text:')).toBeInTheDocument();
    });

    it('has accessible buttons', () => {
      render(<TextNormalizationSection />);
      
      const exportButton = screen.getByRole('button', { name: 'Export' });
      const copyButton = screen.getByRole('button', { name: 'Copy Result' });
      
      expect(exportButton).toBeInTheDocument();
      expect(copyButton).toBeInTheDocument();
    });

    it('has accessible checkboxes', () => {
      render(<TextNormalizationSection />);
      
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThan(0);
      
      checkboxes.forEach(checkbox => {
        expect(checkbox).toHaveAccessibleName();
      });
    });
  });

  describe('Integration with DevTools', () => {
    it('applies custom className', () => {
      const customClass = 'custom-test-class';
      render(<TextNormalizationSection className={customClass} />);
      
      const container = screen.getByText('Text Normalization').closest('.text-normalization-section');
      expect(container).toHaveClass(customClass);
    });

    it('provides debug information when requested', () => {
      render(<TextNormalizationSection initialText="Test text" />);
      
      // Should show processing time
      expect(screen.getByText(/1.5ms/)).toBeInTheDocument();
      
      // Should show character counts
      expect(screen.getByText(/9 characters/)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles clipboard API failures gracefully', async () => {
      const mockWriteText = jest.fn().mockRejectedValue(new Error('Clipboard error'));
      Object.assign(navigator, {
        clipboard: {
          writeText: mockWriteText,
        },
      });
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const user = userEvent.setup();
      render(<TextNormalizationSection initialText="Hello world" />);
      
      const copyButton = screen.getByText('Copy Result');
      await user.click(copyButton);
      
      expect(consoleSpy).toHaveBeenCalledWith('Failed to copy to clipboard:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });

    it('handles empty and invalid input gracefully', () => {
      render(<TextNormalizationSection initialText="" />);
      
      const output = screen.getByDisplayValue('');
      expect(output).toBeInTheDocument();
      
      expect(screen.getByText(/0 characters/)).toBeInTheDocument();
      expect(screen.getByText(/0 changes made/)).toBeInTheDocument();
    });
  });
});