'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import WorldCreationWizard from '@/components/WorldCreationWizard/WorldCreationWizard';
import { readJSON, removeKey } from '@/lib/utils/browserStorage';

// Session key used to hand off generated world data into the wizard.
// Read once on mount and then cleared so refreshes don't replay.
const HANDOFF_KEYS = [
  'generated-world-data',
] as const;

export default function CreateWorldPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [generatedData, setGeneratedData] = useState(null);
  const [initialStep, setInitialStep] = useState(0);

  useEffect(() => {
    const stepParam = searchParams.get('step');
    if (stepParam) {
      const step = parseInt(stepParam, 10);
      if (!isNaN(step)) {
        setInitialStep(step);
      }
    }

    for (const key of HANDOFF_KEYS) {
      const data = readJSON<typeof generatedData>('session', key, null);
      if (data) {
        setGeneratedData(data);
        removeKey('session', key);
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
    <section
      className="component-create-world-page wizard-page"
      aria-labelledby="create-world-title"
    >
      <h1 id="create-world-title" className="sr-only">
        Create New World
      </h1>
      <WorldCreationWizard
        onComplete={handleComplete}
        onCancel={handleCancel}
        initialData={generatedData || undefined}
        initialStep={initialStep} // Use step from URL parameter or default to 0
      />
    </section>
  );
}
