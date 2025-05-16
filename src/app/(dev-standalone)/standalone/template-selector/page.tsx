'use client';

import React, { useState, useEffect } from 'react';
import TemplateSelector from '@/components/world/TemplateSelector';
import { templates } from '@/lib/templates/worldTemplates';
import { applyWorldTemplate } from '@/lib/templates/templateLoader';
import { worldStore } from '@/state/worldStore';
import Link from 'next/link';

export default function TemplateSelectorPage() {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [createdWorldId, setCreatedWorldId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [worldCount, setWorldCount] = useState<number>(0);

  // Initialize worldCount safely
  useEffect(() => {
    try {
      const state = worldStore.getState();
      const count = state.worlds ? Object.keys(state.worlds).length : 0;
      setWorldCount(count);
      
      // Subscribe to store changes
      const unsubscribe = worldStore.subscribe(() => {
        const newState = worldStore.getState();
        const newCount = newState.worlds ? Object.keys(newState.worlds).length : 0;
        setWorldCount(newCount);
      });
      
      return () => unsubscribe();
    } catch (err) {
      console.error('Error getting world count:', err);
    }
  }, []);

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    setError(null);
  };

  const handleApplyTemplate = () => {
    try {
      if (!selectedTemplateId) {
        setError('No template selected');
        return;
      }

      const template = templates.find(t => t.id === selectedTemplateId);
      if (!template) {
        setError('Template not found');
        return;
      }

      const worldName = `${template.name} World`;
      const worldId = applyWorldTemplate(template, worldName);
      setCreatedWorldId(worldId);
      
      // Success message
      setError(null);
    } catch (err) {
      console.error('Error applying template:', err);
      setError(`Error applying template: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Template Selector Test Harness</h1>
      
      <div className="mb-4 p-2 bg-gray-100 rounded">
        <p><strong>Test Controls:</strong></p>
        <p>Current world count: {worldCount}</p>
        {selectedTemplateId && (
          <p>Selected template: {templates.find(t => t.id === selectedTemplateId)?.name}</p>
        )}
        {createdWorldId && (
          <p>Created world ID: {createdWorldId}</p>
        )}
        {error && (
          <p className="text-red-500">Error: {error}</p>
        )}
        <div className="mt-2">
          <button 
            className="px-4 py-2 bg-blue-500 text-white rounded mr-2"
            onClick={handleApplyTemplate}
            disabled={!selectedTemplateId}
          >
            Apply Template
          </button>
          <button 
            className="px-4 py-2 bg-gray-500 text-white rounded"
            onClick={() => {
              setSelectedTemplateId(null);
              setCreatedWorldId(null);
              setError(null);
            }}
          >
            Reset
          </button>
        </div>
      </div>

      <div className="border p-4 rounded shadow-sm">
        <TemplateSelector 
          templates={templates}
          onSelect={handleTemplateSelect}
          selectedTemplateId={selectedTemplateId}
        />
      </div>

      <div className="mt-4">
        <Link href="/standalone" className="text-blue-500 hover:underline">
          Back to Standalone Home
        </Link>
      </div>
    </div>
  );
}