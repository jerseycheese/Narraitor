// src/stories/SmartTemplates.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { TemplatePreview } from '@/components/world/SmartTemplates/TemplatePreview';
import { WorldTemplate } from '@/lib/ai/templateGenerator';
import { AVAILABLE_GENRES } from '@/lib/constants/genres';
import { SkillDifficulty } from '@/lib/constants/skillDifficultyLevels';

// Mock data for Storybook
const mockTemplateHistory = [
  {
    template: {
      name: 'Cyber Frontier',
      theme: 'Cyberpunk Western',
      description: 'A world where high-tech meets the wild west',
      attributes: [
        { name: 'Tech Savvy', baseValue: 60, minValue: 0, maxValue: 100, category: 'Mental' },
        { name: 'Grit', baseValue: 70, minValue: 0, maxValue: 100, category: 'Social' }
      ],
      skills: [
        { name: 'Hacking', baseValue: 45, minValue: 0, maxValue: 100, difficulty: 'hard' as SkillDifficulty, category: 'Technical' },
        { name: 'Quick Draw', baseValue: 50, minValue: 0, maxValue: 100, difficulty: 'medium' as SkillDifficulty, category: 'Combat' }
      ],
      explanation: 'This genre mix combines cyberpunk technology with western frontier themes'
    } as WorldTemplate,
    generatedAt: '2023-01-01',
    generationType: 'genre-mix' as 'inspired-by' | 'genre-mix' | 'surprise-me',
    genres: [AVAILABLE_GENRES[4], AVAILABLE_GENRES[3]] // Cyberpunk, Western
  }
];

const mockGeneratedTemplate: WorldTemplate = {
  name: 'Generated World',
  description: 'An AI-generated world for testing',
  theme: 'Fantasy',
  attributes: [
    { name: 'Strength', baseValue: 50, minValue: 0, maxValue: 100, category: 'Physical' },
    { name: 'Intelligence', baseValue: 60, minValue: 0, maxValue: 100, category: 'Mental' }
  ],
  skills: [
    { name: 'Swordplay', baseValue: 40, minValue: 0, maxValue: 100, difficulty: 'medium' as SkillDifficulty, category: 'Combat' },
    { name: 'Magic', baseValue: 35, minValue: 0, maxValue: 100, difficulty: 'hard' as SkillDifficulty, category: 'Mystical' }
  ],
  explanation: 'A classic fantasy world with balanced attributes and skills'
};

// Create a mock version of SmartTemplates for Storybook
const MockSmartTemplates: React.FC<{ onTemplateGenerated: (template: WorldTemplate) => void; hasHistory?: boolean }> = ({ 
  onTemplateGenerated, 
  hasHistory = false 
}) => {
  const [mode, setMode] = React.useState<'inspired-by' | 'genre-mix' | 'surprise-me'>('inspired-by');
  const [userInput, setUserInput] = React.useState('');
  const [selectedGenres, setSelectedGenres] = React.useState<string[]>([]);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleGenerate = () => {
    setIsGenerating(true);
    setError(null);
    
    // Simulate AI generation
    setTimeout(() => {
      setIsGenerating(false);
      onTemplateGenerated(mockGeneratedTemplate);
    }, 2000);
  };

  const mockHistory = hasHistory ? mockTemplateHistory : [];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Smart World Templates</h2>
        <p className="text-gray-600 mt-2">Get creative starting points for your world with AI assistance</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {isGenerating && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Generating your world template...</p>
        </div>
      )}

      {!isGenerating && (
        <div className="space-y-6">
          {/* Mode Selection */}
          <div className="grid gap-4">
            {/* Inspired By Mode */}
            <div className={`border rounded-lg p-6 ${mode === 'inspired-by' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">I want something like...</h3>
                <button
                  onClick={() => setMode('inspired-by')}
                  className={`px-4 py-2 rounded ${mode === 'inspired-by' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                >
                  {mode === 'inspired-by' ? 'Selected' : 'Select'}
                </button>
              </div>
              {mode === 'inspired-by' && (
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Describe what you want (e.g., 'Steampunk Victorian London')"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <button
                    onClick={handleGenerate}
                    disabled={!userInput.trim()}
                    className="bg-blue-600 text-white px-6 py-2 rounded disabled:opacity-50"
                  >
                    Generate World
                  </button>
                </div>
              )}
            </div>

            {/* Genre Mixer Mode */}
            <div className={`border rounded-lg p-6 ${mode === 'genre-mix' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Genre Mixer</h3>
                <button
                  onClick={() => setMode('genre-mix')}
                  className={`px-4 py-2 rounded ${mode === 'genre-mix' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                >
                  {mode === 'genre-mix' ? 'Selected' : 'Select'}
                </button>
              </div>
              {mode === 'genre-mix' && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">Select 2 or more genres to blend together</p>
                  <div className="grid grid-cols-3 gap-2">
                    {['Fantasy', 'Sci-Fi', 'Horror', 'Western', 'Cyberpunk', 'Mystery'].map(genre => (
                      <button
                        key={genre}
                        onClick={() => setSelectedGenres(prev => 
                          prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
                        )}
                        className={`px-3 py-2 rounded text-sm ${
                          selectedGenres.includes(genre) 
                            ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                            : 'bg-gray-100 border border-gray-300'
                        }`}
                      >
                        {genre}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={handleGenerate}
                    disabled={selectedGenres.length < 2}
                    className="bg-blue-600 text-white px-6 py-2 rounded disabled:opacity-50"
                  >
                    Mix Genres
                  </button>
                </div>
              )}
            </div>

            {/* Surprise Me Mode */}
            <div className="border rounded-lg p-6 border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Surprise me!</h3>
                  <p className="text-sm text-gray-600">Generate a completely unexpected world</p>
                </div>
                <button
                  onClick={handleGenerate}
                  className="bg-purple-600 text-white px-6 py-2 rounded"
                >
                  Surprise me!
                </button>
              </div>
            </div>
          </div>

          {/* Template History */}
          {mockHistory.length > 0 && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Recent Templates</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {mockHistory.map((entry, index) => (
                  <div 
                    key={index}
                    className="border rounded-lg p-4 hover:border-gray-400 cursor-pointer transition-colors"
                    onClick={() => onTemplateGenerated(entry.template)}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">{entry.template.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{entry.template.theme}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(entry.generatedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                        {(() => {
                          switch(entry.generationType) {
                            case 'inspired-by': return 'Inspired';
                            case 'genre-mix': return 'Mixed';
                            case 'surprise-me': return 'Surprise';
                            default: return 'Unknown';
                          }
                        })()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {mockHistory.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No recent templates</p>
              <p className="text-sm">Generate your first template to get started!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const meta: Meta<typeof MockSmartTemplates> = {
  title: 'World/SmartTemplates',
  component: MockSmartTemplates,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Smart world template generation with AI assistance. Supports three modes: inspired-by, genre mixing, and surprise generation.'
      }
    }
  },
  argTypes: {
    onTemplateGenerated: { action: 'template-generated' },
    hasHistory: { 
      control: 'boolean',
      description: 'Show template history'
    }
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    onTemplateGenerated: (template: WorldTemplate) => console.log('Generated template:', template),
    hasHistory: false
  }
};

export const WithHistory: Story = {
  args: {
    onTemplateGenerated: (template: WorldTemplate) => console.log('Generated template:', template),
    hasHistory: true
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the component with existing template history for reuse'
      }
    }
  }
};

export const Loading: Story = {
  args: {
    onTemplateGenerated: (template: WorldTemplate) => console.log('Generated template:', template),
    hasHistory: false
  },
  play: async ({ canvasElement }) => {
    // Simulate clicking "Surprise me" to show loading state
    const canvas = canvasElement;
    const surpriseButton = canvas.querySelector('button') as HTMLButtonElement;
    if (surpriseButton && surpriseButton.textContent?.includes('Surprise')) {
      surpriseButton.click();
    }
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates the loading state during template generation'
      }
    }
  }
};

// Template Preview Stories
const mockTemplate: WorldTemplate = {
  name: 'Neo-Victorian Skyport',
  description: 'A steampunk world of floating cities powered by steam and clockwork, where airship pirates rule the skies and Victorian sensibilities clash with mechanical marvels.',
  theme: 'Steampunk',
  attributes: [
    { name: 'Ingenuity', baseValue: 65, minValue: 0, maxValue: 100, category: 'Mental' },
    { name: 'Dexterity', baseValue: 60, minValue: 0, maxValue: 100, category: 'Physical' },
    { name: 'Social Standing', baseValue: 45, minValue: 0, maxValue: 100, category: 'Social' },
    { name: 'Steam Affinity', baseValue: 55, minValue: 0, maxValue: 100, category: 'Mystical' }
  ],
  skills: [
    { name: 'Engineering', baseValue: 50, minValue: 0, maxValue: 100, difficulty: 'medium', category: 'Technical' },
    { name: 'Airship Piloting', baseValue: 40, minValue: 0, maxValue: 100, difficulty: 'hard', category: 'Technical' },
    { name: 'Clockwork Repair', baseValue: 45, minValue: 0, maxValue: 100, difficulty: 'medium', category: 'Technical' },
    { name: 'Etiquette', baseValue: 35, minValue: 0, maxValue: 100, difficulty: 'easy', category: 'Social' },
    { name: 'Dueling', baseValue: 40, minValue: 0, maxValue: 100, difficulty: 'medium', category: 'Combat' },
    { name: 'Steam Magic', baseValue: 30, minValue: 0, maxValue: 100, difficulty: 'hard', category: 'Mystical' }
  ],
  explanation: 'Steampunk worlds emphasize mechanical ingenuity and Victorian social structures. The Steam Affinity attribute represents connection to the mystical power source, while skills balance technical expertise with social graces and combat readiness.'
};

export const TemplatePreviewStory: Story = {
  render: () => (
    <TemplatePreview
      template={mockTemplate}
      onUse={() => console.log('Using template')}
      onBack={() => console.log('Going back')}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Preview screen showing a generated world template with all details'
      }
    }
  }
};

export const MobileView: Story = {
  args: {
    onTemplateGenerated: (template: WorldTemplate) => console.log('Generated template:', template),
    hasHistory: false
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1'
    },
    docs: {
      description: {
        story: 'Mobile-responsive view of the Smart Templates component'
      }
    }
  }
};