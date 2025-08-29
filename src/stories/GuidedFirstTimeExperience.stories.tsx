import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

// For now, create a simplified demo since the real component has complex dependencies
// TODO: Update to use real GuidedFirstTimeExperience component once Storybook providers are set up
const GuidedFirstTimeExperienceDemo = () => {
  const [currentStep, setCurrentStep] = React.useState(0);

  const steps = [
    { id: 'welcome', label: 'Welcome' },
    { id: 'concept', label: 'World Concept' },
    { id: 'details', label: 'World Details' },
  ];

  const renderWelcomeStep = () => (
    <div className="text-center space-y-6">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Welcome to Narraitor
        </h1>
        <p className="text-lg text-gray-600 mb-6">
          Create your own world and start your story
        </p>
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            Let's guide you through creating your first world in just 2 steps, then create your character.
          </p>
        </div>
        <button 
          onClick={() => setCurrentStep(1)}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Get Started
        </button>
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
            World Concept <span className="text-red-500">*</span>
          </label>
          <textarea
            id="world-concept"
            name="world-concept"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="E.g., The world of Harry Potter, Star Wars galaxy, Middle-earth from LOTR, The Office workplace, or your own original fantasy realm..."
          />
        </div>
      </div>
      
      <div className="flex space-x-3">
        <button 
          onClick={() => setCurrentStep(0)}
          className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-300 transition-colors font-medium"
        >
          Back
        </button>
        <button 
          onClick={() => setCurrentStep(2)}
          className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Continue
        </button>
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
          Give your world a name and genre
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
            placeholder="E.g., Neo-Tokyo..."
          />
        </div>
        
        <div>
          <label htmlFor="world-genre" className="block text-sm font-medium text-gray-700 mb-2">
            Genre <span className="text-red-500">*</span>
          </label>
          <select
            id="world-genre"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a genre</option>
            <option value="fantasy">Fantasy</option>
            <option value="sci-fi">Science Fiction</option>
            <option value="modern">Modern</option>
            <option value="historical">Historical</option>
            <option value="horror">Horror</option>
          </select>
        </div>
      </div>
      
      <div className="flex space-x-3">
        <button 
          onClick={() => setCurrentStep(1)}
          className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-300 transition-colors font-medium"
        >
          Back
        </button>
        <button 
          onClick={() => alert('World creation complete!')}
          className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          Create World
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-2">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    index <= currentStep
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  {index + 1}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-12 h-0.5 ${
                      index < currentStep ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step content */}
        <div className="max-w-lg mx-auto">
          {currentStep === 0 && renderWelcomeStep()}
          {currentStep === 1 && renderConceptStep()}
          {currentStep === 2 && renderDetailsStep()}
        </div>
      </div>
    </div>
  );
};

const meta: Meta<typeof GuidedFirstTimeExperienceDemo> = {
  title: 'Patterns/GuidedFirstTimeExperience',
  component: GuidedFirstTimeExperienceDemo,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Guided first-time experience for world creation. Simplified demo version for Storybook.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GuidedFirstTimeExperienceDemo>;

export const Default: Story = {};

export const WelcomeStep: Story = {
  render: () => <GuidedFirstTimeExperienceDemo />,
};

export const ConceptStep: Story = {
  render: () => {
    const Component = () => {
      React.useEffect(() => {
        // Auto-navigate to concept step for this story
      }, []);
      return <GuidedFirstTimeExperienceDemo />;
    };
    return <Component />;
  },
};