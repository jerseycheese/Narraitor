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
    <div className={`space-y-4 ${className}`}>
      <div>
        <label htmlFor="physical-desc" className="block text-sm font-medium text-gray-700 mb-1">
          Physical Description (for portrait)
        </label>
        <textarea
          id="physical-desc"
          value={physicalDescription}
          onChange={(e) => setPhysicalDescription(e.target.value)}
          placeholder="e.g., Long silver hair, green eyes, wearing a blue robe..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          rows={2}
        />
        <p className="text-xs text-gray-500 mt-1">
          Describe appearance details you want in the portrait. Tip: Add &quot;looks like [actor name]&quot; to generate a portrait resembling a specific person.
        </p>
      </div>


      <div>
        <label htmlFor="environment" className="block text-sm font-medium text-gray-700 mb-1">
          Environment/Setting (optional)
        </label>
        <input
          id="environment"
          type="text"
          value={environmentHint}
          onChange={(e) => setEnvironmentHint(e.target.value)}
          placeholder="e.g., In a forest, throne room, starship bridge..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>
  );
};