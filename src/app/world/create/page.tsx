'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import WorldCreationWizard from '@/components/WorldCreationWizard/WorldCreationWizard';

export default function CreateWorldPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [generatedData, setGeneratedData] = useState(null);
  const [initialStep, setInitialStep] = useState(0);

  useEffect(() => {
    // Check for step parameter in URL
    const stepParam = searchParams.get('step');
    console.log('URL step parameter:', stepParam);
    if (stepParam) {
      const step = parseInt(stepParam, 10);
      console.log('Parsed step:', step);
      if (!isNaN(step)) {
        console.log('Setting initial step to:', step);
        setInitialStep(step);
      }
    }

    // Check for generated world data from AI generation
    const storedData = sessionStorage.getItem('generated-world-data');
    if (storedData) {
      try {
        const data = JSON.parse(storedData);
        setGeneratedData(data);
        // Clear the stored data so it doesn't persist
        sessionStorage.removeItem('generated-world-data');
      } catch (error) {
        console.error('Failed to parse generated world data:', error);
      }
    }

    // Check for smart template data from test harness
    console.log('Checking sessionStorage for smart-template-data...');
    const templateData = sessionStorage.getItem('smart-template-data');
    console.log('Smart template data found:', !!templateData);
    console.log('Raw template data:', templateData);
    
    if (templateData) {
      try {
        const data = JSON.parse(templateData);
        console.log('Parsed smart template data:', {
          name: data.name,
          description: data.description?.substring(0, 50) + '...',
          attributeCount: data.aiSuggestions?.attributes?.length,
          skillCount: data.aiSuggestions?.skills?.length,
          firstAttribute: data.aiSuggestions?.attributes?.[0]
        });
        setGeneratedData(data);
        console.log('Smart template data applied to generatedData state');
        // Clear the stored data so it doesn't persist
        sessionStorage.removeItem('smart-template-data');
        console.log('Smart template data removed from sessionStorage');
      } catch (error) {
        console.error('Failed to parse smart template data:', error);
      }
    } else {
      console.log('No smart template data found in sessionStorage');
    }

    // Check for recent template data from Choose Template tab
    console.log('Checking sessionStorage for recent-template-data...');
    const recentTemplateData = sessionStorage.getItem('recent-template-data');
    console.log('Recent template data found:', !!recentTemplateData);
    
    if (recentTemplateData) {
      try {
        const data = JSON.parse(recentTemplateData);
        console.log('Parsed recent template data:', {
          name: data.name,
          description: data.description?.substring(0, 50) + '...',
          attributeCount: data.aiSuggestions?.attributes?.length,
          skillCount: data.aiSuggestions?.skills?.length
        });
        setGeneratedData(data);
        console.log('Recent template data applied to generatedData state');
        // Clear the stored data
        sessionStorage.removeItem('recent-template-data');
        console.log('Recent template data removed from sessionStorage');
      } catch (error) {
        console.error('Failed to parse recent template data:', error);
      }
    }
  }, [searchParams]);

  const handleComplete = (worldId: string) => {
    router.push(`/world/${worldId}`);
  };

  const handleCancel = () => {
    router.push('/worlds');
  };

  console.log('Rendering WorldCreationWizard with initialStep:', initialStep, 'and generatedData:', !!generatedData);
  
  return (
    <main className="min-h-screen">
      <WorldCreationWizard 
        onComplete={handleComplete}
        onCancel={handleCancel}
        initialData={generatedData || undefined}
        initialStep={initialStep} // Use step from URL parameter or default to 0
      />
    </main>
  );
}
