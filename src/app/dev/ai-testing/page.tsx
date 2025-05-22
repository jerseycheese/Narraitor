'use client';

import React from 'react';
import { AITestingPanel } from '../../../components/devtools/AITestingPanel';

/**
 * AI Testing Panel Test Harness
 * 
 * This page provides a standalone environment for testing the AI Testing Panel
 * component without requiring the full DevTools panel setup.
 */
export default function AITestingPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            AI Testing Panel Test Harness
          </h1>
          <p className="text-gray-600">
            Test the AI Testing Panel component in isolation. This panel allows developers 
            to override world, character, and narrative context to test AI responses.
          </p>
        </div>

        {/* AI Testing Panel in a dark container to simulate DevTools */}
        <div className="bg-slate-800 p-6 rounded-lg border-2 border-slate-600">
          <h2 className="text-slate-200 text-lg font-medium mb-4">
            DevTools - AI Testing Panel
          </h2>
          <div className="bg-slate-800 text-slate-200">
            <AITestingPanel />
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-3">
            Testing Instructions
          </h3>
          <div className="prose text-gray-600">
            <ul className="space-y-2">
              <li>Use the World Override section to test different world contexts</li>
              <li>Use the Character Override section to test different character contexts</li>
              <li>Click &quot;Generate Narrative&quot; to test the AI generation process</li>
              <li>Check the developer console for any errors or warnings</li>
              <li>Verify that the dark theme styling is consistent and readable</li>
            </ul>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-8 flex space-x-4">
          <a 
            href="/dev" 
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            ← Back to Dev Tools
          </a>
          <a 
            href="/dev/devtools-test" 
            className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            Full DevTools Test →
          </a>
        </div>
      </div>
    </div>
  );
}