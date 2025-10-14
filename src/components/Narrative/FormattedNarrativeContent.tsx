import React from 'react';

interface FormattedNarrativeContentProps {
  content: string;
  className?: string;
}

export const FormattedNarrativeContent: React.FC<FormattedNarrativeContentProps> = ({ content, className }) => {
  // Split content into paragraphs (separated by blank lines)
  const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  
  return (
    <div className={`narrative-content ${className || ''}`}>
      {paragraphs.map((paragraph, index) => {
        // Process emphasis markers (*italic*, **bold**)
        const parts = paragraph.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/);
        
        const formattedParts = parts.map((part, i) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return (
              <strong key={i} className="text-emphasis font-bold">
                {part.slice(2, -2)}
              </strong>
            );
          } else if (part.startsWith('*') && part.endsWith('*')) {
            return (
              <em key={i} className="text-emphasis italic">
                {part.slice(1, -1)}
              </em>
            );
          }
          return <span key={i}>{part}</span>;
        });

        return (
          <p 
            key={index} 
            className="my-4 leading-relaxed max-w-3xl mx-auto first-of-type:mt-0 last-of-type:mb-0"
          >
            {formattedParts}
          </p>
        );
      })}
    </div>
  );
};

FormattedNarrativeContent.displayName = 'FormattedNarrativeContent';
