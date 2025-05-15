'use client';

import { useRouter } from 'next/navigation';
import WorldListScreen from '@/components/WorldListScreen/WorldListScreen';

export default function WorldsPage() {
  const router = useRouter();

  const handleCreateWorld = () => {
    router.push('/test-harness'); // or whatever route you want for creating worlds
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', padding: '2rem' }}>
      <div style={{ maxWidth: '64rem', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>
            My Worlds
          </h1>
          <button
            onClick={handleCreateWorld}
            data-testid="create-world-button"
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              borderRadius: '0.375rem',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '500',
            }}
          >
            Create World
          </button>
        </div>
        <WorldListScreen />
      </div>
    </div>
  );
}
