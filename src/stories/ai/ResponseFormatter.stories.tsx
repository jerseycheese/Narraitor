// src/stories/ai/ResponseFormatter.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { ResponseFormatter } from '../../lib/ai/responseFormatter';
import { AIResponse } from '../../lib/ai/types';

const ResponseFormatterDemo: React.FC<{
  content: string;
  templateType: 'narrative' | 'dialogue' | 'journal';
  showRaw?: boolean;
}> = ({ content, templateType, showRaw = true }) => {
  const formatter = new ResponseFormatter();
  
  // Create mock AI response
  const aiResponse: AIResponse = {
    content,
    finishReason: 'STOP'
  };
  
  // Get formatting options based on template type
  const formattingOptions = formatter.getFormattingOptionsForTemplate(templateType);
  
  // Format the response
  const formatted = formatter.format(aiResponse, formattingOptions);
  
  return (
    <div className="narraitor-formatter-demo">
      {showRaw && (
        <div className="narraitor-formatter-raw" data-testid="formatter-raw">
          <h3 className="text-lg font-semibold mb-2">Raw AI Response:</h3>
          <pre className="bg-gray-100 p-4 rounded">{content}</pre>
        </div>
      )}
      
      <div className="narraitor-formatter-formatted mt-4" data-testid="formatter-formatted">
        <h3 className="text-lg font-semibold mb-2">Formatted Response:</h3>
        <div 
          className="bg-blue-50 p-4 rounded prose"
          dangerouslySetInnerHTML={{ __html: formatted.formattedContent || '' }}
        />
      </div>
      
      <div className="narraitor-formatter-metadata mt-4" data-testid="formatter-metadata">
        <h3 className="text-lg font-semibold mb-2">Format Settings:</h3>
        <div className="bg-gray-50 p-4 rounded">
          <p><strong>Template Type:</strong> {templateType}</p>
          <p><strong>Options:</strong> {JSON.stringify(formattingOptions)}</p>
        </div>
      </div>
    </div>
  );
};

export default {
  title: 'Narraitor/AI/ResponseFormatter',
  component: ResponseFormatterDemo,
  parameters: {
    docs: {
      description: {
        component: 'Formats AI responses with context-appropriate styling'
      }
    }
  }
} as Meta<typeof ResponseFormatterDemo>;

type Story = StoryObj<typeof ResponseFormatterDemo>;

export const NarrativeResponse: Story = {
  args: {
    content: 'The hero entered the dark chamber.\n\nShe said, Who goes there?\n\nA voice echoed back, speaking in *ancient* tongues.',
    templateType: 'narrative'
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows narrative formatting with dialogue and italics'
      }
    }
  }
};

export const DialogueResponse: Story = {
  args: {
    content: 'The merchant said, Welcome to my shop!\nHe continued, What can I help you find?',
    templateType: 'dialogue',
    showRaw: true
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows dialogue-specific formatting'
      }
    }
  }
};

export const JournalResponse: Story = {
  args: {
    content: 'Day 15: Found the *ancient* artifact in the ruins.\n\nThe locals warned of its cursed nature.',
    templateType: 'journal'
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows journal entry formatting'
      }
    }
  }
};

export const EmptyResponse: Story = {
  args: {
    content: '',
    templateType: 'narrative'
  },
  parameters: {
    docs: {
      description: {
        story: 'Handles empty AI responses gracefully'
      }
    }
  }
};

export const ComplexNarrative: Story = {
  args: {
    content: '  The battle raged on.  \n\n\nKara shouted, Stand your ground!  \n\nThe enemy commander replied, You cannot win!  \n\n\n\nThe *legendary* sword began to glow with an *ethereal* light.  ',
    templateType: 'narrative',
    showRaw: true
  },
  parameters: {
    docs: {
      description: {
        story: 'Complex formatting with whitespace, dialogue, and italics'
      }
    }
  }
};
