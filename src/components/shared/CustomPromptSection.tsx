import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface CustomPromptSectionProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  helpText?: string;
  example?: string;
  rows?: number;
  className?: string;
}

export const CustomPromptSection: React.FC<CustomPromptSectionProps> = ({
  value,
  onChange,
  placeholder = "Enter a custom prompt for image generation (optional). Leave empty to use auto-generated prompt.",
  label = "Custom Image Prompt",
  helpText,
  example,
  rows = 3,
  className = ""
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor="custom-prompt">
        {label}
      </Label>
      <Textarea
        id="custom-prompt"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
      />
      {helpText && (
        <p className="text-xs text-gray-600">{helpText}</p>
      )}
      {example && (
        <p className="text-xs text-gray-500">
          Example: {example}
        </p>
      )}
    </div>
  );
};

interface PromptOverrideSectionProps {
  showPromptOverride: boolean;
  setShowPromptOverride: (show: boolean) => void;
  customPrompt: string;
  setCustomPrompt: (prompt: string) => void;
  placeholder?: string;
  label?: string;
  helpText?: string;
  example?: string;
  rows?: number;
  buttonText?: {
    show?: string;
    hide?: string;
  };
  className?: string;
}

export const PromptOverrideSection: React.FC<PromptOverrideSectionProps> = ({
  showPromptOverride,
  setShowPromptOverride,
  customPrompt,
  setCustomPrompt,
  placeholder,
  label,
  helpText,
  example,
  rows = 3,
  buttonText = {
    show: 'Show Custom Prompt',
    hide: 'Hide Custom Prompt'
  },
  className = ""
}) => {
  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setShowPromptOverride(!showPromptOverride)}
        className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
      >
        {showPromptOverride ? buttonText.hide : buttonText.show}
      </button>

      {showPromptOverride && (
        <div className="mt-4">
          <CustomPromptSection
            value={customPrompt}
            onChange={setCustomPrompt}
            placeholder={placeholder}
            label={label}
            helpText={helpText}
            example={example}
            rows={rows}
          />
        </div>
      )}
    </div>
  );
};
