'use client';

import React from 'react';

interface CharacterBackground {
  description: string;
  personality: string;
  motivation: string;
  physicalDescription?: string;
}

interface CharacterBackgroundDisplayProps {
  background: CharacterBackground;
}

export function CharacterBackgroundDisplay({ background }: CharacterBackgroundDisplayProps) {
  return (
    <div className="space-y-6">
      {/* Description Section */}
      <div>
        <h4 className="text-lg font-semibold mb-2 text-gray-700">
          Description
        </h4>
        <p className="text-gray-600 leading-relaxed">
          {background.description}
        </p>
      </div>

      {/* Personality Section */}
      <div>
        <h4 className="text-lg font-semibold mb-2 text-gray-700">
          Personality
        </h4>
        <p className="text-gray-600 leading-relaxed">
          {background.personality}
        </p>
      </div>

      {/* Motivation Section */}
      <div>
        <h4 className="text-lg font-semibold mb-2 text-gray-700">
          Motivation
        </h4>
        <p className="text-gray-600 leading-relaxed">
          {background.motivation}
        </p>
      </div>

      {/* Physical Description Section (optional) */}
      {background.physicalDescription && (
        <div>
          <h4 className="text-lg font-semibold mb-2 text-gray-700">
            Physical Appearance
          </h4>
          <p className="text-gray-600 leading-relaxed">
            {background.physicalDescription}
          </p>
        </div>
      )}
    </div>
  );
}