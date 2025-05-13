// src/stories/utilities/TextFormatter.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { formatAIResponse, FormattingOptions } from '../../lib/utils/textFormatter';

// Helper component to display formatting
const TextFormatterDemo: React.FC<{
  input: string;
  options?: FormattingOptions;
  showComparison?: boolean;
}> = ({ input, options, showComparison = true }) => {
  const formatted = formatAIResponse(input, options);
  
  return (
    <div className="narraitor-formatter-demo">
      {showComparison && (
        <div className="narraitor-formatter-input">
          <h3 className="text-lg font-semibold mb-2">Input:</h3>
          <pre className="bg-gray-100 p-4 rounded" data-testid="formatter-input">
            {input}
          </pre>
        </div>
      )}
      
      <div className="narraitor-formatter-output mt-4">
        <h3 className="text-lg font-semibold mb-2">Formatted Output:</h3>
        <div 
          className="bg-blue-50 p-4 rounded prose"
          data-testid="formatter-output"
          dangerouslySetInnerHTML={{ __html: formatted }}
        />
      </div>
      
      <div className="narraitor-formatter-options mt-4">
        <h3 className="text-lg font-semibold mb-2">Options:</h3>
        <pre className="bg-gray-100 p-4 rounded" data-testid="formatter-options">
          {JSON.stringify(options || {}, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default {
  title: 'Narraitor/Utilities/TextFormatter',
  component: TextFormatterDemo,
  parameters: {
    docs: {
      description: {
        component: 'Formats AI-generated text with paragraphs, dialogue, and italics support'
      }
    }
  }
} as Meta<typeof TextFormatterDemo>;

type Story = StoryObj<typeof TextFormatterDemo>;

export const BasicFormatting: Story = {
  args: {
    input: 'Simple text without any special formatting.'
  }
};

export const ParagraphFormatting: Story = {
  args: {
    input: 'First paragraph of narrative text.\n\nSecond paragraph continues the story.\n\n\nThird paragraph after extra breaks.'
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates paragraph break normalization'
      }
    }
  }
};

export const DialogueFormatting: Story = {
  args: {
    input: 'The knight said, We must defend the castle!\nThe wizard replied, I shall prepare the spells.',
    options: {
      formatDialogue: true
    }
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows dialogue formatting with quotation marks'
      }
    }
  }
};

export const ItalicsFormatting: Story = {
  args: {
    input: 'The *ancient* tome contained *mysterious* secrets that were *critically* important.',
    options: {
      enableItalics: true
    }
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates italics formatting using asterisks'
      }
    }
  }
};

export const CombinedFormatting: Story = {
  args: {
    input: 'The hero entered the chamber.\n\nShe exclaimed, This is *incredible*!\n\nThe ancient text read: *Beware the guardian.*',
    options: {
      formatDialogue: true,
      enableItalics: true
    }
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows all formatting options working together'
      }
    }
  }
};

export const WhitespaceHandling: Story = {
  args: {
    input: '  Text   with    irregular     spacing.  \n\n\n   And multiple    paragraph    breaks.   ',
    options: {}
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates whitespace normalization'
      }
    }
  }
};

export const NarrativeExample: Story = {
  args: {
    input: 'The sun set over the mountains.\n\nKara looked at her companion and said, We need to find shelter soon.\n\nThe path ahead was treacherous, marked by *ancient* symbols that warned of danger.\n\n\nThey pressed on despite their fears.',
    options: {
      formatDialogue: true,
      enableItalics: true
    }
  },
  parameters: {
    docs: {
      description: {
        story: 'A complete narrative example with all formatting features'
      }
    }
  }
};

export const EdgeCases: Story = {
  args: {
    input: '*Starting* with italics. Ending with italics *properly*.\n\nUnmatched asterisk here*\n\nDialogue at the end: she said, Hello',
    options: {
      formatDialogue: true,
      enableItalics: true
    }
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests edge cases in formatting including unmatched asterisks'
      }
    }
  }
};

export const UnmatchedAsterisks: Story = {
  args: {
    input: 'Text with a single * asterisk\nAnd another * here\nBut *this is matched*',
    options: {
      enableItalics: true
    }
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows that unmatched asterisks are preserved as-is'
      }
    }
  }
};
