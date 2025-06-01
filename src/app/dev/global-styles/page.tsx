import React from 'react';
import Link from 'next/link';
import { GlobalStylesDemo } from '@/components/design-system/GlobalStylesDemo';

/**
 * This page provides a direct view of the GlobalStylesDemo component
 * without requiring Storybook. It's useful for quickly viewing the 
 * global styles and ensuring they're working correctly.
 */
export default function GlobalStylesPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <Link 
        href="/dev" 
        className="text-blue-600 hover:text-blue-800 underline"
      >
        ← Back to Dev Harnesses
      </Link>
      <h1 className="text-2xl font-bold mb-6 mt-4">Global Styles Demo</h1>
      <p className="mb-6">
        This page demonstrates the global styles implemented for the Narraitor application.
        You can view this page in both light and dark mode by toggling your system preferences.
      </p>
      
      <div className="border border-gray-200 rounded-lg p-6 mb-8">
        <GlobalStylesDemo />
      </div>
      
      <div className="mt-8 p-4 bg-blue-50 rounded-md">
        <h2 className="text-lg font-semibold mb-2">Developer Notes</h2>
        <p>
          This page provides direct access to the GlobalStylesDemo component
          without requiring Storybook to be running. This can be useful during
          development when you need to quickly check the global styles.
        </p>
        <p className="mt-2">
          To view this component in Storybook with more controls, run <code>npm run storybook</code>
          and navigate to the Design System section.
        </p>
      </div>
    </div>
  );
}