'use client';

import React from 'react';
import StyleTest from '@/config-tests/StyleTest';

export default function StyleTestPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Tailwind CSS Test Harness</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border border-gray-200 rounded p-4">
          <h2 className="text-xl font-semibold mb-2">Basic Styles</h2>
          <StyleTest />
        </div>
        
        <div className="border border-gray-200 rounded p-4">
          <h2 className="text-xl font-semibold mb-2">Responsive Styles</h2>
          <StyleTest showResponsive={true} />
        </div>
        
        <div className="border border-gray-200 rounded p-4">
          <h2 className="text-xl font-semibold mb-2">Hover States</h2>
          <StyleTest showHover={true} />
        </div>
        
        <div className="border border-gray-200 rounded p-4">
          <h2 className="text-xl font-semibold mb-2">All Features</h2>
          <StyleTest showResponsive={true} showHover={true} />
        </div>
      </div>
      
      {/* Test utility classes */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-2">Utility Classes Test</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className="bg-red-500 p-2 text-white">bg-red-500</div>
          <div className="bg-green-500 p-2 text-white">bg-green-500</div>
          <div className="bg-blue-500 p-2 text-white">bg-blue-500</div>
          <div className="bg-yellow-500 p-2 text-white">bg-yellow-500</div>
          
          <div className="bg-gray-100 p-2 text-lg">text-lg</div>
          <div className="bg-gray-100 p-2 text-xl">text-xl</div>
          <div className="bg-gray-100 p-2 text-2xl">text-2xl</div>
          <div className="bg-gray-100 p-2 text-3xl">text-3xl</div>
          
          <div className="bg-gray-100 p-2 font-normal">font-normal</div>
          <div className="bg-gray-100 p-2 font-medium">font-medium</div>
          <div className="bg-gray-100 p-2 font-semibold">font-semibold</div>
          <div className="bg-gray-100 p-2 font-bold">font-bold</div>
        </div>
      </div>
    </div>
  );
}
