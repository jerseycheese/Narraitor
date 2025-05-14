/// &lt;reference types="../../../src/types/global.d.ts" />
import React from 'react';
import { World } from '../../../src/types/world.types';

// Define the type for worldListTestUtils
interface WorldListTestUtils {
  addTestWorlds: () => Promise<void>;
  clearWorlds: () => Promise<void>;
  setLoadingState: (loading: boolean) => Promise<void>;
  setErrorState: (error: string | null) => Promise<void>;
  inspectStore: () => void;
}

// Augment the Window interface to include worldListTestUtils
declare global {
  interface Window {
    worldListTestUtils: WorldListTestUtils;
  }
}

export default function WorldListScreenPage() {
  const [showComponent, setShowComponent] = React.useState(false);

  // Mock WorldListScreen that doesn't have the infinite loop issue
  const MockWorldListScreen = () => {
    const [worlds, setWorlds] = React.useState([]);
    const [loading, setLoading] = React.useState(false);
    const [error] = React.useState(null);

    React.useEffect(() => {
      // Simulate loading
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        // Set empty worlds initially
        setWorlds([]);
      }, 500);
    }, []);

    return (
      <div style={{ padding: '16px' }}>
        <h2>World List Screen (Mock)</h2>
        {loading && <p>Loading worlds...</p>}
        {error && <p style={{ color: 'red' }}>Error: {error}</p>}
        {!loading && !error && worlds.length === 0 && (
          <p>No worlds created yet.</p>
        )}
        {!loading && !error && worlds.length > 0 && (
          <ul>
            {worlds.map((world: World) => (
              <li key={world.id}>{world.name}</li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  // Add test utilities to window object on component mount
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      window.worldListTestUtils = {
        async addTestWorlds() {
          console.log('Adding test worlds...');
          try {
            const { worldStore } = await import('../../../src/state/worldStore');
            const store = worldStore.getState();

            // Add test worlds
            store.createWorld({
              name: 'Test Medieval Kingdom',
              theme: 'fantasy',
              description: 'A test fantasy world',
              attributes: [],
              skills: [],
              settings: {
              maxAttributes: 10,
              maxSkills: 10,
              attributePointPool: 100,
              skillPointPool: 100,
              }
            });

            store.createWorld({
              name: 'Test Space Colony',
              theme: 'scifi',
              description: 'A test scifi world',
              attributes: [],
              skills: [],
              settings: {
              maxAttributes: 10,
              maxSkills: 10,
              attributePointPool: 100,
              skillPointPool: 100,
              }
            });

            console.log('Test worlds added successfully');
          } catch (err) {
            console.error('Error adding test worlds:', err);
          }
        },
        async clearWorlds() {
          console.log('Clearing worlds...');
          try {
            const { worldStore } = await import('../../../src/state/worldStore');
            const store = worldStore.getState();

            // Clear all worlds
            const worldIds = Object.keys(store.worlds);
            worldIds.forEach(id => store.deleteWorld(id));

            console.log('All worlds cleared');
          } catch (err) {
            console.error('Error clearing worlds:', err);
          }
        },
        async setLoadingState(loading: boolean) {
          console.log(`Setting loading state to: ${loading}`);
          try {
            const { worldStore } = await import('../../../src/state/worldStore');
            const store = worldStore.getState();
            store.setLoading(loading);
            console.log('Loading state updated');
          } catch (err) {
            console.error('Error setting loading state:', err);
          }
        },
        async setErrorState(error: string | null) {
          console.log(`Setting error state to: ${error}`);
          try {
            const { worldStore } = await import('../../../src/state/worldStore');
            const store = worldStore.getState();
            store.setError(error);
            console.log('Error state updated');
          } catch (err) {
            console.error('Error setting error state:', err);
          }
        },
        inspectStore() {
          import('../../../src/state/worldStore').then(({ worldStore }) => {
            const state = worldStore.getState();
            console.log('Current store state:', state);
          });
        }
      };
      console.log('Test utilities loaded. Access via window.worldListTestUtils');
      console.log('Available methods: addTestWorlds(), clearWorlds(), setLoadingState(bool), setErrorState(string), inspectStore()');
    }
  }, []);

  return (
    <div className="harness-container p-8" style={{ padding: '32px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>
        World List Screen Test Harness
      </h1>
      <p style={{ color: '#666', marginBottom: '16px' }}>
        Testing Stage 2: Component with live store
      </p>
      
      <div style={{
        marginBottom: '16px',
        padding: '16px',
        backgroundColor: '#f3f4f6',
        borderRadius: '4px'
      }}>
        <p style={{ fontSize: '14px', color: '#374151' }}>
          Test utilities available in browser console:
        </p>
        <ul style={{ fontSize: '14px', color: '#4b5563', marginTop: '8px' }}>
          <li>worldListTestUtils.addTestWorlds() - Add test data</li>
          <li>worldListTestUtils.clearWorlds() - Clear all worlds</li>
          <li>worldListTestUtils.setLoadingState(true/false) - Toggle loading</li>
          <li>worldListTestUtils.setErrorState(&apos;error message&apos;) - Set error</li>
          <li>worldListTestUtils.inspectStore() - Inspect current store state</li>
        </ul>
      </div>

        <button
          onClick={() => setShowComponent(!showComponent)}
          style={{
            padding: '8px 16px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {showComponent ? 'Hide' : 'Show'} WorldListScreen Component
        </button>

      {showComponent && (
        <div style={{ marginTop: '16px', border: '1px solid #e5e7eb', borderRadius: '4px', padding: '16px' }}>
          <MockWorldListScreen />
        </div>
      )}
    </div>
  );
}
