'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import WorldCreationWizard from '@/components/WorldCreationWizard/WorldCreationWizard';

export default function CreateWorldPage() {
  const router = useRouter();
  const [generatedData, setGeneratedData] = useState(null);

  useEffect(() => {
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
  }, []);

  const handleComplete = (worldId: string) => {
    router.push(`/world/${worldId}`);
  };

  const handleCancel = () => {
    router.push('/worlds');
  };

  return (
    <main className="min-h-screen bg-gray-100">
      <WorldCreationWizard 
        onComplete={handleComplete}
        onCancel={handleCancel}
        initialData={generatedData ? { worldData: generatedData } : undefined}
        initialStep={generatedData ? 5 : 0} // Skip to final step if we have generated data
      />
    </main>
  );
}
