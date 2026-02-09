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
          description: attr.description || `${attr.name}represents a core aspect of characters in this world`,
          minValue: attr.minValue,
          maxValue: attr.maxValue,
          baseValue: attr.baseValue,
          category: attr.category,
          accepted: true // Auto-accept template attributes
        })),
        skills: template.skills.map(skill => ({
          name: skill.name,
          description: skill.description || `${skill.name}is an important skill for characters in this world`,
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
    <div >
      <div >
        <div >
          <h1 >SmartTemplates Test Harness</h1>
          <p >
            Test the SmartTemplates component with live AI generation and template history. 
            Clicking &quot;Use This Template&quot; will redirect to the world creation wizard.
          </p>
          
          <div >
            <SmartTemplates onTemplateGenerated={handleTemplateGenerated} />
          </div>
        </div>

        {generatedTemplate && (
          <div >
            <h2 >Last Generated Template</h2>
            <div >
              <div>
                <h3 >{generatedTemplate.name}</h3>
                <p >{generatedTemplate.description}</p>
                <span >
                  {generatedTemplate.genre}
                </span>
              </div>
              
              <div>
                <h4 >Attributes ({generatedTemplate.attributes.length})</h4>
                <div >
                  {generatedTemplate.attributes.map((attr, index) => (
                    <div key={index} >
                      <span >{attr.name}</span>
                      <span >
                        (Base: {attr.baseValue}, Range: {attr.minValue}-{attr.maxValue})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 >Skills ({generatedTemplate.skills.length})</h4>
                <div >
                  {generatedTemplate.skills.map((skill, index) => (
                    <div key={index} >
                      <span >{skill.name}</span>
                      <span >
                        ({skill.difficulty}, Base: {skill.baseValue})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              {generatedTemplate.explanation && (
                <div>
                  <h4 >AI Explanation</h4>
                  <p >{generatedTemplate.explanation}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}