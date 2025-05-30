'use client';

import React from 'react';

interface CharacterBackground {
  history: string;
  personality: string;
  goals: string[];
  fears: string[];
  physicalDescription?: string;
}

interface CharacterBackgroundDisplayProps {
  background: CharacterBackground;
}

export function CharacterBackgroundDisplay({ background }: CharacterBackgroundDisplayProps) {
  return (
    <div className="space-y-6">
      {/* History Section */}
      <div>
        <h4 className="text-lg font-semibold mb-2 text-gray-700">
          History
        </h4>
        <p className="text-gray-600 leading-relaxed">
          {background.history}
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

      {/* Goals Section */}
      {background.goals && background.goals.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold mb-2 text-gray-700">
            Goals & Motivations
          </h4>
          {background.goals.length === 1 ? (
            <p className="text-gray-600 leading-relaxed">
              {background.goals[0]}
            </p>
          ) : (
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              {background.goals.map((goal, index) => (
                <li key={index}>{goal}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Fears Section */}
      {background.fears && background.fears.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold mb-2 text-gray-700">
            Fears
          </h4>
          <ul className="list-disc list-inside text-gray-600 space-y-1">
            {background.fears.map((fear, index) => (
              <li key={index}>{fear}</li>
            ))}
          </ul>
        </div>
      )}

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