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
    if (stepParam) {
      const step = parseInt(stepParam, 10);
      if (!isNaN(step)) {
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
    const templateData = sessionStorage.getItem('smart-template-data');
    
    if (templateData) {
      try {
        const data = JSON.parse(templateData);
        setGeneratedData(data);
        // Clear the stored data so it doesn't persist
        sessionStorage.removeItem('smart-template-data');
      } catch (error) {
        console.error('Failed to parse smart template data:', error);
      }
    } else {
    }

    // Check for recent template data from Choose Template tab
    const recentTemplateData = sessionStorage.getItem('recent-template-data');
    
    if (recentTemplateData) {
      try {
        const data = JSON.parse(recentTemplateData);
        setGeneratedData(data);
        // Clear the stored data
        sessionStorage.removeItem('recent-template-data');
      } catch (error) {
        console.error('Failed to parse recent template data:', error);
      }
    }
  }, [searchParams]);

  const handleComplete = (worldId: string) => {
    router.push(`/worlds/${worldId}`);
  };

  const handleCancel = () => {
    router.push('/worlds');
  };

  
  return (
    <main >
      <h1 >Create New World</h1>
      <WorldCreationWizard 
        onComplete={handleComplete}
        onCancel={handleCancel}
        initialData={generatedData || undefined}
        initialStep={initialStep} // Use step from URL parameter or default to 0
      />
    </main>
  );
}
