'use client';

import React from 'react';
import { AttributeSuggestion, SkillSuggestion } from './WizardState';

interface AISuggestionsProps {
  loading: boolean;
  error?: string;
  attributes: AttributeSuggestion[];
  skills: SkillSuggestion[];
  onAcceptAttribute: (attribute: AttributeSuggestion) => void;
  onRejectAttribute: (attribute: AttributeSuggestion) => void;
  onAcceptSkill: (skill: SkillSuggestion) => void;
  onRejectSkill: (skill: SkillSuggestion) => void;
}

export const AISuggestions: React.FC<AISuggestionsProps> = ({
  loading,
  error,
  attributes,
  skills,
  onAcceptAttribute,
  onRejectAttribute,
  onAcceptSkill,
  onRejectSkill,
}: AISuggestionsProps) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" role="status">
          <span className="sr-only">Loading...</span>
        </div>
        <p className="mt-2 text-gray-600" aria-live="polite">Analyzing world description...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (attributes.length === 0 && skills.length === 0) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
        <p className="text-gray-600">No AI suggestions available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {attributes.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Suggested Attributes</h3>
          <div className="space-y-3">
            {attributes.map((attribute, index) => (
              <div
                key={index}
                role="article"
                className={`p-4 border rounded-md ${
                  attribute.accepted ? 'accepted bg-green-50 border-green-300' : 'bg-white border-gray-300'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium">{attribute.name}</h4>
                    <p className="text-sm text-gray-600">{attribute.description}</p>
                    {attribute.category && (
                      <span className="text-xs text-gray-500">Category: {attribute.category}</span>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => onAcceptAttribute(attribute)}
                      className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                      aria-label={`Accept ${attribute.name}`}
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => onRejectAttribute(attribute)}
                      className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                      aria-label={`Reject ${attribute.name}`}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {skills.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Suggested Skills</h3>
          <div className="space-y-3">
            {skills.map((skill, index) => (
              <div
                key={index}
                role="article"
                className={`p-4 border rounded-md ${
                  skill.accepted ? 'accepted bg-green-50 border-green-300' : 'bg-white border-gray-300'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium">{skill.name}</h4>
                    <p className="text-sm text-gray-600">{skill.description}</p>
                    <div className="flex gap-3 mt-1">
                      {skill.difficulty && (
                        <span className="text-xs text-gray-500">Difficulty: {skill.difficulty}</span>
                      )}
                      {skill.category && (
                        <span className="text-xs text-gray-500">Category: {skill.category}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => onAcceptSkill(skill)}
                      className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                      aria-label={`Accept ${skill.name}`}
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => onRejectSkill(skill)}
                      className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                      aria-label={`Reject ${skill.name}`}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};