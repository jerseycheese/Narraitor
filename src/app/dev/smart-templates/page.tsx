// src/app/dev/smart-templates/page.tsx

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SmartTemplates } from '@/components/world/SmartTemplates';
import { WorldTemplate } from '@/lib/ai/templateGenerator';

export default function SmartTemplatesTestPage() {
  const [generatedTemplate, setGeneratedTemplate] = useState<WorldTemplate | null>(null);
  const router = useRouter();

  const handleTemplateGenerated = (template: WorldTemplate) => {
    console.log('Template generated:', template);
    setGeneratedTemplate(template);
    
    // For test harness, redirect to world creation with step parameter
    // This simulates starting at Basic Info step with template data
    console.log('Redirecting to world creation wizard with template:', template.name);
    
    // Store template data for the wizard to use
    const templateWizardData = {
      selectedTemplateId: 'smart-template',
      createOwnWorld: false,
      name: template.name,
      description: template.description,
      genre: template.genre,
      aiSuggestions: {
        attributes: template.attributes.map(attr => ({
          name: attr.name,
          description: attr.description || `${attr.name} represents a core aspect of characters in this world`,
          minValue: attr.minValue,
          maxValue: attr.maxValue,
          baseValue: attr.baseValue,
          category: attr.category,
          accepted: true // Auto-accept template attributes
        })),
        skills: template.skills.map(skill => ({
          name: skill.name,
          description: skill.description || `${skill.name} is an important skill for characters in this world`,
          difficulty: skill.difficulty,
          category: skill.category,
          baseValue: skill.baseValue,
          minValue: skill.minValue,
          maxValue: skill.maxValue,
          accepted: true // Auto-accept template skills
        }))
      }
    };
    
    console.log('Storing template data in sessionStorage:', templateWizardData);
    sessionStorage.setItem('smart-template-data', JSON.stringify(templateWizardData));
    
    // Verify storage worked
    const storedData = sessionStorage.getItem('smart-template-data');
    console.log('Verification - stored data exists:', !!storedData);
    if (storedData) {
      console.log('Verification - stored data preview:', JSON.parse(storedData).name);
    }
    
    // Add a small delay to ensure storage is complete before navigation
    setTimeout(() => {
      console.log('Navigating to wizard...');
      router.push('/worlds/create?step=1');
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h1 className="text-3xl font-bold mb-4">SmartTemplates Test Harness</h1>
          <p className="text-gray-700 mb-6">
            Test the SmartTemplates component with live AI generation and template history. 
            Clicking &quot;Use This Template&quot; will redirect to the world creation wizard.
          </p>
          
          <div className="border-2 border-blue-200 rounded-lg p-4">
            <SmartTemplates onTemplateGenerated={handleTemplateGenerated} />
          </div>
        </div>

        {generatedTemplate && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Last Generated Template</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">{generatedTemplate.name}</h3>
                <p className="text-gray-700">{generatedTemplate.description}</p>
                <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-900 rounded-full text-sm">
                  {generatedTemplate.genre}
                </span>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Attributes ({generatedTemplate.attributes.length})</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {generatedTemplate.attributes.map((attr, index) => (
                    <div key={index} className="p-2 bg-gray-100 rounded">
                      <span className="font-medium">{attr.name}</span>
                      <span className="text-sm text-gray-700 ml-2">
                        (Base: {attr.baseValue}, Range: {attr.minValue}-{attr.maxValue})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Skills ({generatedTemplate.skills.length})</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {generatedTemplate.skills.map((skill, index) => (
                    <div key={index} className="p-2 bg-gray-100 rounded">
                      <span className="font-medium">{skill.name}</span>
                      <span className="text-sm text-gray-700 ml-2">
                        ({skill.difficulty}, Base: {skill.baseValue})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              {generatedTemplate.explanation && (
                <div>
                  <h4 className="font-medium mb-2">AI Explanation</h4>
                  <p className="text-gray-700 italic">{generatedTemplate.explanation}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}