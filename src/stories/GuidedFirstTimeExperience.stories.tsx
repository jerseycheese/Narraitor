import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import React from 'react';

// Create a mock component that demonstrates the UI without complex dependencies
const MockGuidedFirstTimeExperience = () => {
  const [currentStep, setCurrentStep] = React.useState(0);
  const [formData, setFormData] = React.useState({
    name: '',
    theme: '',
    description: '',
  });

  const steps = [
    { id: 'welcome', label: 'Welcome' },
    { id: 'concept', label: 'World Concept' },
    { id: 'details', label: 'World Details' },
  ];

  const renderWelcomeStep = () => (
    <div className="text-center space-y-6">
      <div className="max-w-md mx-auto">
        <p className="text-lg text-gray-600 mb-6">
          Create your own world and start your story
        </p>
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            Let&apos;s guide you through creating your first world in just 3 steps.
          </p>
        </div>
      </div>
    </div>
  );

  const renderConceptStep = () => (
    <div className="max-w-md mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          World Concept
        </h2>
        <p className="text-gray-600">
          Create an RPG in any fictional universe or original setting
        </p>
      </div>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="world-concept" className="block text-sm font-medium text-gray-700 mb-2">
            World Concept
          </label>
          <textarea
            id="world-concept"
            name="world-concept"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="E.g., The world of Harry Potter, Star Wars galaxy, Middle-earth from LOTR, The Office workplace, or your own original fantasy realm..."
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          />
        </div>
      </div>
    </div>
  );

  const renderDetailsStep = () => (
    <div className="max-w-md mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          World Details
        </h2>
        <p className="text-gray-600">
          Give your world a name and theme
        </p>
      </div>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="world-name" className="block text-sm font-medium text-gray-700 mb-2">
            World Name (optional)
          </label>
          <input
            id="world-name"
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="E.g., Hogwarts Adventures, Galaxy Far Far Away..."
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          />
        </div>
        
        <div>
          <label htmlFor="world-theme" className="block text-sm font-medium text-gray-700 mb-2">
            Theme
          </label>
          <select
            id="world-theme"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.theme}
            onChange={(e) => setFormData(prev => ({ ...prev, theme: e.target.value }))}
          >
            <option value="">Select a theme</option>
            <option value="fantasy">Fantasy</option>
            <option value="sci-fi">Sci-Fi</option>
            <option value="modern">Modern</option>
            <option value="historical">Historical</option>
            <option value="post-apocalyptic">Post-Apocalyptic</option>
            <option value="cyberpunk">Cyberpunk</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0: return renderWelcomeStep();
      case 1: return renderConceptStep();
      case 2: return renderDetailsStep();
      default: return renderWelcomeStep();
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: return true;
      case 1: return formData.description.length > 0;
      case 2: return formData.name.length > 0 && formData.theme.length > 0;
      default: return true;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-auto">
      <div className="p-8">
        <h1 className="text-3xl font-bold text-center mb-8">Get Started</h1>
        
        <div className="space-y-8">
          {/* Progress indicator */}
          <div className="flex justify-center">
            <div className="flex space-x-4">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    index <= currentStep ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {index + 1}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-16 h-1 ml-2 ${
                      index < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>
          
          
          {renderCurrentStep()}
          
          <div className="flex justify-between items-center pt-6">
            <button
              onClick={() => alert('Skip functionality')}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
            >
              Skip
            </button>
            
            <div className="flex gap-3">
              {currentStep > 0 && (
                <button
                  onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
                  className="px-4 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 font-medium rounded-md transition-colors"
                >
                  Back
                </button>
              )}
              
              {currentStep < steps.length - 1 ? (
                <button
                  onClick={() => canProceed() && setCurrentStep(prev => prev + 1)}
                  disabled={!canProceed()}
                  className="min-h-12 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-medium rounded-md transition-colors"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={() => alert('World created successfully!')}
                  disabled={!canProceed()}
                  className="min-h-12 px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-medium rounded-md transition-colors"
                >
                  Try it now
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const meta: Meta<typeof MockGuidedFirstTimeExperience> = {
  title: 'Narraitor/Onboarding/GuidedFirstTimeExperience',
  component: MockGuidedFirstTimeExperience,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'A guided 3-step onboarding flow that helps first-time users create their first world in under 2 minutes. This is a fully interactive demo showing the complete user experience.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Create different starting states by modifying the component
const createStoryWithStep = (initialStep: number, prefilledData?: Partial<{ name: string; theme: string; description: string }>) => {
  return () => {
    const MockWithStep = () => {
      const [currentStep, setCurrentStep] = React.useState(initialStep);
      const [formData, setFormData] = React.useState({
        name: prefilledData?.name || '',
        theme: prefilledData?.theme || '',
        description: prefilledData?.description || '',
      });

      // Copy the same rendering logic but with different initial state
      const steps = [
        { id: 'welcome', label: 'Welcome' },
        { id: 'concept', label: 'World Concept' },
        { id: 'details', label: 'World Details' },
      ];

      const renderWelcomeStep = () => (
        <div className="text-center space-y-6">
          <div className="max-w-md mx-auto">
            <p className="text-lg text-gray-600 mb-6">Create a world and start a story</p>
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">Let&apos;s guide you through creating your first world in just 3 steps.</p>
            </div>
          </div>
        </div>
      );

      const renderConceptStep = () => (
        <div className="max-w-md mx-auto space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">World Concept</h2>
            <p className="text-gray-600">Create an RPG in any fictional universe or original setting</p>
          </div>
          <div className="space-y-4">
            <div>
              <label htmlFor="world-concept" className="block text-sm font-medium text-gray-700 mb-2">World Concept</label>
              <textarea
                id="world-concept"
                name="world-concept"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="E.g., The world of Harry Potter, Star Wars galaxy, Middle-earth from LOTR, The Office workplace, or your own original fantasy realm..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
          </div>
        </div>
      );

      const renderDetailsStep = () => (
        <div className="max-w-md mx-auto space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">World Details</h2>
            <p className="text-gray-600">Give your world a name and theme</p>
          </div>
          <div className="space-y-4">
            <div>
              <label htmlFor="world-name" className="block text-sm font-medium text-gray-700 mb-2">World Name (optional)</label>
              <input
                id="world-name"
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="E.g., Hogwarts Adventures, Galaxy Far Far Away..."
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <label htmlFor="world-theme" className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
              <select
                id="world-theme"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.theme}
                onChange={(e) => setFormData(prev => ({ ...prev, theme: e.target.value }))}
              >
                <option value="">Select a theme</option>
                <option value="fantasy">Fantasy</option>
                <option value="sci-fi">Sci-Fi</option>
                <option value="modern">Modern</option>
                <option value="historical">Historical</option>
                <option value="post-apocalyptic">Post-Apocalyptic</option>
                <option value="cyberpunk">Cyberpunk</option>
              </select>
            </div>
          </div>
        </div>
      );

      const renderCurrentStep = () => {
        switch (currentStep) {
          case 0: return renderWelcomeStep();
          case 1: return renderConceptStep();
          case 2: return renderDetailsStep();
          default: return renderWelcomeStep();
        }
      };

      const canProceed = () => {
        switch (currentStep) {
          case 0: return true;
          case 1: return formData.description.length > 0;
          case 2: return formData.name.length > 0 && formData.theme.length > 0;
          default: return true;
        }
      };

      return (
        <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-auto">
          <div className="p-8">
            <h1 className="text-3xl font-bold text-center mb-8">Get Started</h1>
            <div className="space-y-8">
              <div className="flex justify-center">
                <div className="flex space-x-4">
                  {steps.map((step, index) => (
                    <div key={step.id} className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        index <= currentStep ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {index + 1}
                      </div>
                      {index < steps.length - 1 && (
                        <div className={`w-16 h-1 ml-2 ${
                          index < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                        }`} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
              {renderCurrentStep()}
              <div className="flex justify-between items-center pt-6">
                <button onClick={() => alert('Skip functionality')} className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors">Skip</button>
                <div className="flex gap-3">
                  {currentStep > 0 && (
                    <button onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))} className="px-4 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 font-medium rounded-md transition-colors">Back</button>
                  )}
                  {currentStep < steps.length - 1 ? (
                    <button onClick={() => canProceed() && setCurrentStep(prev => prev + 1)} disabled={!canProceed()} className="min-h-12 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-medium rounded-md transition-colors">Next</button>
                  ) : (
                    <button onClick={() => alert('World created successfully!')} disabled={!canProceed()} className="min-h-12 px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-medium rounded-md transition-colors">Try it now</button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    };
    return <MockWithStep />;
  };
};

export const WelcomeStep: Story = {
  render: createStoryWithStep(0),
  parameters: {
    docs: {
      description: {
        story: 'Step 1: Welcome screen with value proposition and clear call-to-action. Shows 3-step overview for creating your world.',
      },
    },
  },
};

export const ConceptStep: Story = {
  render: createStoryWithStep(1),
  parameters: {
    docs: {
      description: {
        story: 'Step 2: World concept definition. Users describe their world idea with fictional universe examples.',
      },
    },
  },
};


export const DetailsStep: Story = {
  render: createStoryWithStep(2),
  parameters: {
    docs: {
      description: {
        story: 'Step 3: World details form. Users provide name and theme, with validation preventing progression until complete.',
      },
    },
  },
};


export const MobileExperience: Story = {
  render: createStoryWithStep(0),
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Mobile-optimized experience with touch-friendly buttons and responsive layout.',
      },
    },
  },
};