'use client';

import WorldListScreen from '@/components/WorldListScreen/WorldListScreen';

export default function WorldListScreenTestHarness() {
  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-2">World List Screen Test Harness</h1>
          <p className="text-gray-600">
            Test world deletion functionality with the confirmation dialog
          </p>
        </header>
        
        <section className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Test Instructions:</h2>
          <ul className="list-disc list-inside space-y-2 mb-6 text-gray-700">
            <li>Click the delete button on any world card</li>
            <li>Verify the confirmation dialog appears</li>
            <li>Test the cancel button to ensure it closes the dialog</li>
            <li>Test the confirm button to delete the world</li>
            <li>Verify the world list updates immediately</li>
            <li>Check that deletion persists on page refresh</li>
            <li>Test keyboard navigation (Escape key)</li>
          </ul>
          
          <div className="border-t pt-6">
            <WorldListScreen />
          </div>
        </section>
      </div>
    </main>
  );
}