// src/stories/SmartTemplates.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { TemplatePreview } from '@/components/world/SmartTemplates/TemplatePreview';
import { TabNavigation, TabOption } from '@/components/shared/TabNavigation';
import { LoadingState } from '@/components/ui/LoadingState';
import { WorldTemplate } from '@/lib/ai/templateGenerator';
import { GENRES } from '@/lib/constants/genres';
import { SkillDifficulty } from '@/lib/constants/skillDifficultyLevels';
import { formatDate } from '@/lib/utils';

// Mock data for Storybook
const mockTemplateHistory = [
  {
    template: {
      name: 'Cyber Frontier',
      genre: 'fantasy',
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
    genres: [GENRES[7].label, GENRES[6].label] // Cyberpunk, Western
  }
];

const mockGeneratedTemplate: WorldTemplate = {
  name: 'Generated World',
  description: 'An AI-generated world for testing',
  genre: 'fantasy',
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

type TemplateMode = 'inspired-by' | 'genre-mix' | 'surprise-me';

// Create a mock version of SmartTemplates for Storybook
const MockSmartTemplates: React.FC<{ onTemplateGenerated: (template: WorldTemplate) => void; hasHistory?: boolean }> = ({ 
  onTemplateGenerated, 
  hasHistory = false 
}) => {
  const [mode, setMode] = React.useState<TemplateMode>('inspired-by');
  const [userInput, setUserInput] = React.useState('');
  const [selectedGenres, setSelectedGenres] = React.useState<string[]>([]);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Tab navigation options
  const tabOptions: TabOption<TemplateMode>[] = [
    { value: 'inspired-by', label: 'I want something like...' },
    { value: 'genre-mix', label: 'Genre Mixer' },
    { value: 'surprise-me', label: 'Surprise me!' }
  ];

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
    <div>
      <div>
        <h2>Smart World Templates</h2>
        <p>Get creative starting points for your world with AI assistance</p>
      </div>

      {error && (
        <div>
          {error}
        </div>
      )}

      {isGenerating && (
        <LoadingState message="Generating your world template..." />
      )}

      {!isGenerating && (
        <div>
          {/* Mode Selection */}
          <div>
            {/* Tab-style Mode Selection */}
            <div>
              <TabNavigation
                options={tabOptions}
                activeValue={mode}
                onChange={setMode}
                
              />
            </div>

            {/* Inspired By Mode */}
            {mode === 'inspired-by' && (
              <div>
                <div>
                  <div>
                    <h3>Describe Your World</h3>
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Steampunk Victorian London, Space pirates, etc."
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      
                    />
                    <button
                      onClick={handleGenerate}
                      disabled={!userInput.trim()}
                      
                    >
                      Generate World
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Genre Mixer Mode */}
            {mode === 'genre-mix' && (
              <div>
                <div>
                  <div>
                    <h3>Mix Genres Together</h3>
                    <p>Select 2 or more genres to blend together</p>
                  </div>
                  <div>
                    <div>
                      {['Fantasy', 'Sci-Fi', 'Horror', 'Western', 'Cyberpunk', 'Mystery', 'Modern', 'Historical'].map(genre => (
                        <button
                          key={genre}
                          onClick={() => setSelectedGenres(prev => 
                            prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
                          )}
                          className={`${
                            selectedGenres.includes(genre) 
                              ? '' 
                              : ''
                          }`}
                        >
                          {genre}
                        </button>
                      ))}
                    </div>
                    <div>
                      <span>
                        {selectedGenres.length} genre{selectedGenres.length !== 1 ? 's' : ''} selected
                      </span>
                      <button
                        onClick={handleGenerate}
                        disabled={selectedGenres.length < 2}
                        
                      >
                        Mix Genres
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Surprise Me Mode */}
            {mode === 'surprise-me' && (
              <div>
                <div>
                  <div>
                    <h3>Random World Generation</h3>
                    <p>Generate a completely unexpected world with unique themes, attributes, and gameplay elements.</p>
                  </div>
                  <div>
                    <button
                      onClick={handleGenerate}
                      
                    >
                      Generate Random World
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Template History */}
          {mockHistory.length > 0 && (
            <div>
              <h3>Recent Templates</h3>
              <div>
                {mockHistory.map((entry, index) => (
                  <div 
                    key={index}
                    
                    onClick={() => onTemplateGenerated(entry.template)}
                  >
                    <div>
                      <div>
                        <h4>{entry.template.name}</h4>
                        <p>{entry.template.genre}</p>
                        <p>
                          {formatDate(entry.generatedAt)}
                        </p>
                      </div>
                      <span>
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
            <div>
              <p>No recent templates</p>
              <p>Generate your first template to get started!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const meta: Meta<typeof MockSmartTemplates> = {
  title: '06-Patterns/ai-integration/SmartTemplates',
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

export const Interactive: Story = {
  args: {
    onTemplateGenerated: (template: WorldTemplate) => console.log('Generated template:', template),
    hasHistory: false
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive Smart Templates component showing the new tab-based UI and all three generation modes'
      }
    }
  }
};

export const WithTemplateHistory: Story = {
  args: {
    onTemplateGenerated: (template: WorldTemplate) => console.log('Generated template:', template),
    hasHistory: true
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the component with existing template history for reuse and the improved UX'
      }
    }
  }
};

// Template Preview Stories
const mockTemplate: WorldTemplate = {
  name: 'Neo-Victorian Skyport',
  description: 'A steampunk world of floating cities powered by steam and clockwork, where airship pirates rule the skies and Victorian sensibilities clash with mechanical marvels.',
  genre: 'fantasy',
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

export const PreviewScreen: Story = {
  render: () => (
    <TemplatePreview
      template={mockTemplate}
      isOpen={true}
      onUse={() => console.log('Using template')}
      onBack={() => console.log('Going back')}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Template preview screen showing a generated world template with comprehensive details'
      }
    }
  }
};