import type { Meta, StoryObj } from '@storybook/react';
import { TextNormalizationSection } from './TextNormalizationSection';

const meta: Meta<typeof TextNormalizationSection> = {
  title: 'Narraitor/DevTools/Sections/TextNormalizationSection',
  component: TextNormalizationSection,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
The Text Normalization Section is a DevTools component that provides developers with 
tools to test and validate text normalization functionality. It allows testing different 
normalization options and comparing before/after results.

**Key Features:**
- Live text input and normalization
- Configurable normalization options (paragraphs, whitespace, quotes, line endings)
- Before/after comparison view
- Real-time or manual processing modes
- Performance testing with large text
- Integration with DevTools panel styling

**Acceptance Criteria Testing:**
1. Text normalization standardizes paragraph breaks
2. Whitespace is consistently handled across different inputs
3. Quotation marks and special characters are normalized
4. Line ending formats are standardized
5. The output maintains semantic structure

**Usage:**
This component is designed for development and testing purposes, allowing developers 
to validate text normalization behavior with various inputs and option combinations.
        `
      }
    }
  },
  decorators: [
    (Story) => (
      <div className="bg-slate-800 p-4 text-slate-200">
        <div style={{ maxWidth: '800px' }}>
          <Story />
        </div>
      </div>
    ),
  ],
  argTypes: {
    debugMode: {
      control: 'boolean',
      description: 'Enable debug mode to show additional processing information'
    },
    autoNormalize: {
      control: 'boolean',
      description: 'Enable real-time normalization as user types'
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes to apply to the component'
    }
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default state of the Text Normalization Section
 */
export const Default: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'The default state shows empty input and output areas with all normalization options enabled.'
      }
    }
  }
};

/**
 * Example with sample text showing common formatting issues
 */
export const WithSampleText: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: `
This story demonstrates the component with sample text that has common formatting issues:
- Extra whitespace and spacing
- Mixed line ending formats (\\r\\n, \\r, \\n)
- Curly quotes and em dashes
- Excessive paragraph breaks

Use the "Normalize Text" button to see the normalization in action.
        `
      }
    }
  },
  play: async ({ canvasElement }) => {
    // This would be filled by the component with sample problematic text
    const sampleText = `This    is    sample    text    with    formatting    issues.\r\n\r\n\r\n\r\n"Hello," she said. 'How are you doing today?'\r\n\r\nThe journey—filled with adventure—continues onward.\r\n\r\n\r\n\r\nFinal paragraph with   extra   spaces   everywhere.`;
    
    // The component should allow setting initial text for demonstration
    // This would be implemented in the actual component
  }
};

/**
 * Paragraph break normalization focus
 */
export const ParagraphBreakNormalization: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: `
This story focuses on paragraph break normalization:
- Multiple consecutive line breaks (3+ \\n) become double line breaks
- Single line breaks between sentences become paragraph breaks
- Proper paragraph structure is maintained

**Test Cases:**
- Text with 4+ consecutive line breaks
- Single line breaks that should become paragraphs
- Mixed paragraph structures
        `
      }
    }
  }
};

/**
 * Whitespace normalization examples
 */
export const WhitespaceNormalization: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: `
This story demonstrates whitespace normalization:
- Multiple spaces between words become single spaces
- Tabs and mixed whitespace characters are normalized
- Leading and trailing whitespace is trimmed from lines
- Paragraph spacing is preserved

**Test Cases:**
- Text with excessive spaces
- Mixed tabs and spaces
- Leading/trailing whitespace on lines
        `
      }
    }
  }
};

/**
 * Quotation mark and special character normalization
 */
export const QuotationMarkNormalization: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: `
This story focuses on quotation mark and special character normalization:
- Curly quotes (" ") become straight quotes (")
- Single curly quotes (' ') become straight quotes (')
- Em dashes (—) become double hyphens (--)
- Apostrophes in contractions are preserved

**Test Cases:**
- Text with curly quotes in dialogue
- Mixed quotation mark styles
- Em dashes in descriptive text
- Contractions with apostrophes
        `
      }
    }
  }
};

/**
 * Line ending normalization across platforms
 */
export const LineEndingNormalization: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: `
This story demonstrates line ending normalization:
- Windows line endings (\\r\\n) become Unix format (\\n)
- Mac line endings (\\r) become Unix format (\\n)
- Mixed line ending formats are standardized
- Unix line endings (\\n) are preserved

**Test Cases:**
- Windows formatted text (\\r\\n)
- Mac formatted text (\\r)
- Mixed line ending formats
- Already Unix formatted text
        `
      }
    }
  }
};

/**
 * Custom normalization options
 */
export const CustomOptions: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: `
This story demonstrates selective normalization options:
- Individual normalization features can be toggled
- Users can test specific normalization combinations
- Options include: paragraphs, whitespace, quotes, line endings
- Real-time feedback shows which options are applied

**Interactive Testing:**
1. Uncheck specific normalization options
2. Input text with various formatting issues
3. Observe how different combinations affect the output
        `
      }
    }
  }
};

/**
 * Performance testing with large text
 */
export const PerformanceTesting: Story = {
  args: {
    debugMode: true
  },
  parameters: {
    docs: {
      description: {
        story: `
This story is designed for performance testing:
- Debug mode shows processing time information
- Large text inputs test normalization efficiency
- Memory usage and performance metrics
- Stress testing with various text sizes

**Performance Criteria:**
- Processing should complete in <100ms for typical text
- Large texts (1000+ paragraphs) should process without hanging
- Memory usage should remain stable
- No performance degradation with repeated normalizations
        `
      }
    }
  }
};

/**
 * Error handling and edge cases
 */
export const ErrorHandling: Story = {
  args: {
    debugMode: true
  },
  parameters: {
    docs: {
      description: {
        story: `
This story tests error handling and edge cases:
- Empty input handling
- Null/undefined input handling
- Malformed text with unusual characters
- Very long single lines
- Text with only whitespace/line breaks

**Edge Cases:**
- Empty strings
- Strings with only whitespace
- Extremely long texts
- Unicode characters and emoji
- Malformed formatting
        `
      }
    }
  }
};

/**
 * Integration with DevTools panel
 */
export const DevToolsIntegration: Story = {
  args: {
    debugMode: true,
    autoNormalize: true
  },
  decorators: [
    (Story) => (
      <div className="bg-slate-800 text-slate-200 p-4">
        <div className="border border-slate-600 rounded-lg">
          <div className="bg-slate-700 px-4 py-2 border-b border-slate-600">
            <h3 className="text-sm font-medium">DevTools - Text Normalization</h3>
          </div>
          <div className="p-4">
            <Story />
          </div>
        </div>
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: `
This story shows the component integrated within a DevTools panel:
- Dark theme styling consistent with other DevTools components
- Compact layout suitable for panel integration
- Auto-normalize mode for real-time feedback
- Debug information for development insights

**DevTools Features:**
- Collapsible sections for space efficiency
- Consistent styling with other DevTools components
- Performance metrics and debug information
- Real-time processing capabilities
        `
      }
    }
  }
};

/**
 * Accessibility and keyboard navigation
 */
export const AccessibilityFeatures: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: `
This story demonstrates accessibility features:
- Proper ARIA labels and descriptions
- Keyboard navigation support
- Screen reader compatibility
- Focus management
- High contrast support

**Keyboard Shortcuts:**
- Tab: Navigate between controls
- Space: Toggle checkboxes
- Enter: Trigger normalization
- Escape: Clear inputs (if implemented)

**Screen Reader Support:**
- All form controls are properly labeled
- Status updates are announced
- Processing states are communicated
        `
      }
    }
  }
};