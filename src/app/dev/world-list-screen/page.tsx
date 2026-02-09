'use client';

import WorldListScreen from '@/components/WorldListScreen/WorldListScreen';

export default function WorldListScreenTestHarness() {
  return (
    <main >
      <div >
        <header >
          <h1 >World List Screen Test Harness</h1>
          <p >
            Test world deletion functionality with the confirmation dialog
          </p>
        </header>
        
        <section >
          <h2 >Test Instructions:</h2>
          <ul >
            <li>Click the delete button on any world card</li>
            <li>Verify the confirmation dialog appears</li>
            <li>Test the cancel button to ensure it closes the dialog</li>
            <li>Test the confirm button to delete the world</li>
            <li>Verify the world list updates immediately</li>
            <li>Check that deletion persists on page refresh</li>
            <li>Test keyboard navigation (Escape key)</li>
          </ul>
          
          <div >
            <WorldListScreen />
          </div>
        </section>
      </div>
    </main>
  );
}
