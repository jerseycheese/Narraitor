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
    <div className="prose prose-gray dark:prose-invert space-y-6">
      {/* History Section */}
      <div>
        <h3 className="text-lg font-semibold mb-2">
          History
        </h3>
        <p>
          {background.history}
        </p>
      </div>

      {/* Personality Section */}
      <div>
        <h3 className="text-lg font-semibold mb-2">
          Personality
        </h3>
        <p>
          {background.personality}
        </p>
      </div>

      {/* Goals Section */}
      {background.goals && background.goals.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-2">
            Goals & Motivations
          </h3>
          {background.goals.length === 1 ? (
            <p>
              {background.goals[0]}
            </p>
          ) : (
            <ul className="list-disc list-inside space-y-1">
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
          <h3 className="text-lg font-semibold mb-2">
            Fears
          </h3>
          <ul className="list-disc list-inside space-y-1">
            {background.fears.map((fear, index) => (
              <li key={index}>{fear}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Physical Description Section (optional) */}
      {background.physicalDescription && (
        <div>
          <h3 className="text-lg font-semibold mb-2">
            Physical Appearance
          </h3>
          <p>
            {background.physicalDescription}
          </p>
        </div>
      )}
    </div>
  );
}
