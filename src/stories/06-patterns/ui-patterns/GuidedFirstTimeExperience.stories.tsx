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
    <div >
      <div >
        <h1 >
          Welcome to Narraitor
        </h1>
        <p >
          Create your own world and start your story
        </p>
        <div >
          <p >
            Let&apos;s guide you through creating your first world in just 2 steps, then create your character.
          </p>
        </div>
        <button 
          onClick={() => setCurrentStep(1)}
          
        >
          Get Started
        </button>
      </div>
    </div>
  );

  const renderConceptStep = () => (
    <div >
      <div >
        <h2 >
          World Concept
        </h2>
        <p >
          Create an RPG in any fictional universe or original setting
        </p>
      </div>
      
      <div >
        <div>
          <label htmlFor="world-concept" >
            World Concept <span >*</span>
          </label>
          <textarea
            id="world-concept"
            name="world-concept"
            rows={3}
            
            placeholder="E.g., The world of Harry Potter, Star Wars galaxy, Middle-earth from LOTR, The Office workplace, or your own original fantasy realm..."
          />
        </div>
      </div>
      
      <div >
        <button 
          onClick={() => setCurrentStep(0)}
          
        >
          Back
        </button>
        <button 
          onClick={() => setCurrentStep(2)}
          
        >
          Continue
        </button>
      </div>
    </div>
  );

  const renderDetailsStep = () => (
    <div >
      <div >
        <h2 >
          World Details
        </h2>
        <p >
          Give your world a name and genre
        </p>
      </div>
      
      <div >
        <div>
          <label htmlFor="world-name" >
            World Name (optional)
          </label>
          <input
            id="world-name"
            type="text"
            
            placeholder="E.g., Neo-Tokyo..."
          />
        </div>
        
        <div>
          <label htmlFor="world-genre" >
            Genre <span >*</span>
          </label>
          <select
            id="world-genre"
            
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
      
      <div >
        <button 
          onClick={() => setCurrentStep(1)}
          
        >
          Back
        </button>
        <button 
          onClick={() => alert('World creation complete!')}
          
        >
          Create World
        </button>
      </div>
    </div>
  );

  return (
    <div >
      <div >
        {/* Progress indicator */}
        <div >
          <div >
            {steps.map((step, index) => (
              <div key={step.id} >
                <div
                  className={`${
                    index <= currentStep
                      ? ''
                      : ''
                  }`}
                >
                  {index + 1}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`${
                      index < currentStep ? '' : ''
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step content */}
        <div >
          {currentStep === 0 && renderWelcomeStep()}
          {currentStep === 1 && renderConceptStep()}
          {currentStep === 2 && renderDetailsStep()}
        </div>
      </div>
    </div>
  );
};

const meta: Meta<typeof GuidedFirstTimeExperienceDemo> = {
  title: '06-Patterns/ui-patterns/GuidedFirstTimeExperience',
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