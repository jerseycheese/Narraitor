import React from 'react';

interface PortraitCustomizationSectionProps {
  physicalDescription: string;
  setPhysicalDescription: (value: string) => void;
  environmentHint: string;
  setEnvironmentHint: (value: string) => void;
  className?: string;
}

export const PortraitCustomizationSection: React.FC<PortraitCustomizationSectionProps> = ({
  physicalDescription,
  setPhysicalDescription,
  environmentHint,
  setEnvironmentHint,
  className = ""
}) => {
  return (
    <div className={`${className}`}>
      <div>
        <label htmlFor="physical-desc" >
          Physical Description (for portrait)
        </label>
        <textarea
          id="physical-desc"
          value={physicalDescription}
          onChange={(e) => setPhysicalDescription(e.target.value)}
          placeholder="e.g., Long silver hair, green eyes, wearing a blue robe..."
          
          rows={2}
        />
        <p>
          Describe appearance details you want in the portrait. Tip: Add &quot;looks like [actor name]&quot; to generate a portrait resembling a specific person.
        </p>
      </div>


      <div>
        <label htmlFor="environment" >
          Environment/Setting (optional)
        </label>
        <input
          id="environment"
          type="text"
          value={environmentHint}
          onChange={(e) => setEnvironmentHint(e.target.value)}
          placeholder="e.g., In a forest, throne room, starship bridge..."
          
        />
      </div>
    </div>
  );
};
