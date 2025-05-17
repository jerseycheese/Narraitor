'use client';

import { useRouter } from 'next/navigation';
import WorldListScreen from '@/components/WorldListScreen/WorldListScreen';

export default function WorldsPage() {
  const router = useRouter();

  const handleCreateWorld = () => {
    router.push('/world/create');
  };

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">
            My Worlds
          </h1>
          <button
            onClick={handleCreateWorld}
            data-testid="create-world-button"
            className="py-2 px-4 bg-blue-500 text-white rounded-md border-none cursor-pointer text-base font-medium hover:bg-blue-600 transition-colors"
          >
            Create World
          </button>
        </header>
        <section>
          <WorldListScreen />
        </section>
      </div>
    </main>
  );
}