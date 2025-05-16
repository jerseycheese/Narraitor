import React from 'react';

export default function TestHarness() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-4">
        <header className="bg-blue-600 text-white p-4 mb-4 rounded shadow">
          <h1 className="text-2xl font-bold">Narraitor Development</h1>
          <p className="text-sm">Test environments for component development</p>
        </header>
        
        <div className="p-4">
          <h1 className="text-2xl font-bold mb-4">Test Component Harness</h1>
          <p>This is a placeholder for the test component harness.</p>
        </div>
      </div>
    </div>
  );
}