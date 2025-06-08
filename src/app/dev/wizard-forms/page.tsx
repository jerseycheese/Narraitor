'use client';

import React, { useState } from 'react';
import { WizardForm } from '@/components/shared/wizard/components/WizardForm';
import {
  WizardFormField,
  WizardInput,
  WizardTextarea,
  WizardSelect,
  WizardButton,
  WizardFormSection,
} from '@/components/shared/wizard/components/WizardFormComponents';

interface TestFormData {
  name: string;
  description: string;
  theme: string;
  difficulty: string;
  tags: string;
}

const themeOptions = [
  { value: 'fantasy', label: 'Fantasy' },
  { value: 'sci-fi', label: 'Science Fiction' },
  { value: 'modern', label: 'Modern' },
  { value: 'historical', label: 'Historical' },
  { value: 'post-apocalyptic', label: 'Post-Apocalyptic' },
  { value: 'cyberpunk', label: 'Cyberpunk' },
];

const difficultyOptions = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
  { value: 'expert', label: 'Expert' },
];

export default function WizardFormsTestPage() {
  const [formData, setFormData] = useState<TestFormData>({
    name: '',
    description: '',
    theme: '',
    difficulty: '',
    tags: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showErrorExample, setShowErrorExample] = useState(false);

  // Validation function
  const validateForm = (data: Partial<TestFormData>): Record<string, string> => {
    const newErrors: Record<string, string> = {};
    
    if (data.name !== undefined) {
      if (!data.name.trim()) {
        newErrors.name = 'Name is required';
      } else if (data.name.length < 3) {
        newErrors.name = 'Name must be at least 3 characters';
      } else if (data.name.length > 50) {
        newErrors.name = 'Name must be less than 50 characters';
      }
    }

    if (data.description !== undefined) {
      if (!data.description.trim()) {
        newErrors.description = 'Description is required';
      } else if (data.description.length < 10) {
        newErrors.description = 'Description must be at least 10 characters';
      } else if (data.description.length > 500) {
        newErrors.description = 'Description must be less than 500 characters';
      }
    }

    if (data.theme !== undefined && !data.theme) {
      newErrors.theme = 'Please select a theme';
    }

    return newErrors;
  };


  const handleSubmit = () => {
    const allErrors = validateForm(formData);
    setErrors(allErrors);
    
    if (Object.keys(allErrors).length === 0) {
      alert('Form submitted successfully!\n\n' + JSON.stringify(formData, null, 2));
    }
  };

  const handleReset = () => {
    setFormData({
      name: '',
      description: '',
      theme: '',
      difficulty: '',
      tags: '',
    });
    setErrors({});
  };

  const loadErrorExample = () => {
    setFormData({
      name: 'AB', // Too short
      description: 'Short', // Too short
      theme: '', // Required
      difficulty: 'medium',
      tags: 'action, adventure',
    });
    setErrors(validateForm({
      name: 'AB',
      description: 'Short',
      theme: '',
    }));
    setShowErrorExample(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Wizard Form Components Test Harness
            </h1>
            <p className="text-gray-600 mb-6">
              This page demonstrates the new shadcn/ui-based wizard form components with enhanced accessibility features.
            </p>
            
            <div className="flex gap-4 mb-6">
              <WizardButton 
                variant="secondary" 
                onClick={loadErrorExample}
              >
                Load Error Example
              </WizardButton>
              <WizardButton 
                variant="secondary" 
                onClick={handleReset}
              >
                Reset Form
              </WizardButton>
              <WizardButton 
                variant="secondary" 
                onClick={() => setShowErrorExample(!showErrorExample)}
              >
                {showErrorExample ? 'Disable' : 'Enable'} Live Validation
              </WizardButton>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <WizardFormSection
                title="Enhanced Form Example"
                description="Try the form below with keyboard navigation and screen readers."
              >
                <WizardForm
                  data={formData}
                >
                  <WizardFormField
                    name="name"
                    label="Project Name"
                    required
                    description="Enter a unique name for your project"
                  >
                    <WizardInput
                      placeholder="Enter project name"
                      maxLength={50}
                    />
                  </WizardFormField>

                  <WizardFormField
                    name="description"
                    label="Description"
                    required
                    description="Provide a detailed description (10-500 characters)"
                  >
                    <WizardTextarea
                      placeholder="Enter project description"
                      rows={4}
                      maxLength={500}
                    />
                  </WizardFormField>

                  <WizardFormField
                    name="theme"
                    label="Theme"
                    required
                    description="Select the primary theme for your project"
                  >
                    <WizardSelect
                      options={themeOptions}
                      placeholder="Select a theme"
                    />
                  </WizardFormField>

                  <WizardFormField
                    name="difficulty"
                    label="Difficulty Level"
                    description="Optional difficulty setting"
                  >
                    <WizardSelect
                      options={difficultyOptions}
                      placeholder="Select difficulty"
                    />
                  </WizardFormField>

                  <WizardFormField
                    name="tags"
                    label="Tags"
                    description="Optional comma-separated tags"
                  >
                    <WizardInput
                      placeholder="e.g., action, adventure, magic"
                    />
                  </WizardFormField>

                  <div className="flex gap-4 pt-4">
                    <WizardButton 
                      variant="primary" 
                      onClick={handleSubmit}
                    >
                      Submit Form
                    </WizardButton>
                    <WizardButton 
                      variant="secondary" 
                      onClick={handleReset}
                    >
                      Reset
                    </WizardButton>
                  </div>
                </WizardForm>
              </WizardFormSection>
            </div>

            <div>
              <WizardFormSection
                title="Form Data & Validation"
                description="Current form state and validation results"
              >
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Current Form Data:</h4>
                    <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                      {JSON.stringify(formData, null, 2)}
                    </pre>
                  </div>

                  {Object.keys(errors).length > 0 && (
                    <div>
                      <h4 className="font-medium text-red-900 mb-2">Validation Errors:</h4>
                      <pre className="bg-red-50 border border-red-200 p-3 rounded text-sm overflow-auto text-red-700">
                        {JSON.stringify(errors, null, 2)}
                      </pre>
                    </div>
                  )}

                  <div className="bg-blue-50 border border-blue-200 rounded p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Accessibility Features:</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Proper ARIA labels and descriptions</li>
                      <li>• Keyboard navigation support (Tab, Enter, Arrow keys)</li>
                      <li>• Error message associations with aria-describedby</li>
                      <li>• Focus management and visual indicators</li>
                      <li>• Required field indicators (*)</li>
                      <li>• Screen reader announcements</li>
                    </ul>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded p-4">
                    <h4 className="font-medium text-green-900 mb-2">Testing Instructions:</h4>
                    <ol className="text-sm text-green-800 space-y-1 list-decimal list-inside">
                      <li>Use Tab key to navigate between fields</li>
                      <li>Use arrow keys in select dropdowns</li>
                      <li>Enable &quot;Live Validation&quot; to see real-time errors</li>
                      <li>Try &quot;Load Error Example&quot; to see error states</li>
                      <li>Test with a screen reader for announcements</li>
                    </ol>
                  </div>
                </div>
              </WizardFormSection>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}