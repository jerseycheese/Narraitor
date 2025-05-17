'use client';

import { useState, useEffect } from 'react';
import { DevToolsProvider } from '@/components/devtools/DevToolsContext';
import { DevToolsPanel } from '@/components/devtools/DevToolsPanel';
import { create } from 'zustand';

// Create a test store specifically for the test harness
interface TestState {
  counter: number;
  incrementCounter: () => void;
  resetCounter: () => void;
  nested: {
    data: {
      items: string[];
      lastUpdated: string;
    }
  };
  addItem: (item: string) => void;
  clearItems: () => void;
}

// Create a stable date function for testing, to avoid hydration mismatches
const getStableDate = () => {
  // For testing purposes, we use a static date when in development mode
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    return '2023-01-01T00:00:00.000Z'; // Static date for consistent rendering
  }
  return new Date().toISOString(); // Use actual date in production
};

const useTestStore = create<TestState>((set) => ({
  counter: 0,
  incrementCounter: () => set((state) => ({ 
    counter: state.counter + 1,
    nested: {
      ...state.nested,
      data: {
        ...state.nested.data,
        lastUpdated: getStableDate()
      }
    }
  })),
  resetCounter: () => set((state) => ({ 
    counter: 0,
    nested: {
      ...state.nested,
      data: {
        ...state.nested.data,
        lastUpdated: getStableDate()
      }
    }
  })),
  nested: {
    data: {
      items: ['Initial item'],
      lastUpdated: getStableDate()
    }
  },
  addItem: (item: string) => set((state) => ({
    nested: {
      ...state.nested,
      data: {
        items: [...state.nested.data.items, item],
        lastUpdated: getStableDate()
      }
    }
  })),
  clearItems: () => set((state) => ({
    nested: {
      ...state.nested,
      data: {
        items: [],
        lastUpdated: getStableDate()
      }
    }
  }))
}));

// Add the test store to the global namespace to make it visible in DevTools
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // @ts-expect-error - Adding to window for development purposes
  window.testStore = useTestStore;
}

export default function DevToolsTestPage() {
  // Use our test store
  const { counter, incrementCounter, resetCounter, nested, addItem, clearItems } = useTestStore();
  const [renderCount, setRenderCount] = useState(0);
  const [newItem, setNewItem] = useState('');
  
  // Increment render count on each render
  useEffect(() => {
    setRenderCount(prev => prev + 1);
  }, []);
  
  const handleAddItem = () => {
    if (newItem.trim()) {
      addItem(newItem.trim());
      setNewItem('');
    }
  };
  
  return (
    <DevToolsProvider initialIsOpen={true}>
      <div className="min-h-screen p-6" style={{ paddingBottom: '60vh' }}> {/* Extra padding at bottom to ensure visibility */}
        <h1 className="text-2xl font-bold mb-4">DevTools Test Harness</h1>
        
        <div className="mb-6 p-4 border rounded bg-gray-50">
          <h2 className="text-xl font-bold mb-2">State Manipulation</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border p-3 rounded">
              <h3 className="font-bold mb-2">Counter State</h3>
              <p className="mb-2">Current Value: <span className="font-bold">{counter}</span></p>
              <p className="mb-2">Render Count: <span className="font-bold">{renderCount}</span></p>
              
              <div className="flex space-x-3 mt-4">
                <button 
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  onClick={incrementCounter}
                >
                  Increment Counter
                </button>
                <button 
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                  onClick={resetCounter}
                >
                  Reset Counter
                </button>
              </div>
            </div>
            
            <div className="border p-3 rounded">
              <h3 className="font-bold mb-2">Nested Data</h3>
              <p className="mb-2">Items: <span className="font-bold">{nested.data.items.length}</span></p>
              <div className="mb-3">
                <input
                  type="text"
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  placeholder="New item text"
                  className="border rounded p-2 mr-2"
                />
                <button 
                  className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                  onClick={handleAddItem}
                >
                  Add Item
                </button>
              </div>
              
              <div className="mt-2">
                <button 
                  className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                  onClick={clearItems}
                >
                  Clear All Items
                </button>
              </div>
              
              {nested.data.items.length > 0 && (
                <ul className="mt-3 list-disc pl-5">
                  {nested.data.items.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
        
        <div className="mb-6 p-4 border rounded">
          <h2 className="text-xl font-bold mb-2">DevTools Instructions</h2>
          <p className="mb-2">The DevTools panel should appear at the bottom of the screen.</p>
          <ol className="list-decimal list-inside space-y-2">
            <li>The panel is <strong>expanded by default</strong> in this test harness.</li>
            <li>Click the <strong>Hide DevTools</strong> button to collapse it.</li>
            <li>When collapsed, click <strong>Show DevTools</strong> to expand it again.</li>
            <li>Use the buttons above to change state and observe updates in the DevTools panel.</li>
            <li>Explore the state sections to see the Zustand store contents.</li>
            <li>Look for <strong>testStore</strong> in the DevTools panel to see changes you make.</li>
            <li>Collapsible sections can be independently expanded/collapsed.</li>
          </ol>
        </div>
        
        {/* Simulate page content */}
        <div className="border p-4 rounded">
          <h2 className="text-xl font-bold mb-2">Simulated Page Content</h2>
          {Array(20).fill(0).map((_, i) => (
            <p key={i} className="mb-2">Content line {i+1}</p>
          ))}
        </div>
        
        {/* Add placeholder to ensure space for DevTools panel */}
        <div className="h-[60vh] bg-transparent"></div>
      </div>
      
      {/* DevToolsPanel */}
      <div className="fixed bottom-0 left-0 right-0 bg-transparent">
        <DevToolsPanel />
      </div>
    </DevToolsProvider>
  );
}