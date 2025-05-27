'use client';

import { useRouter } from 'next/navigation';
import WorldCreationWizard from '@/components/WorldCreationWizard/WorldCreationWizard';

export default function CreateWorldPage() {
  const router = useRouter();

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
      />
    </main>
  );
}
