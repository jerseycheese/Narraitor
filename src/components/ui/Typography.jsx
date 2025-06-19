import React from 'react';

export function Typography() {
  return (
    <div className="p-8 max-w-4xl">
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6 pb-2 border-b">Headings</h2>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-500 mb-1">H1 - 3xl (1.875rem/30px)</p>
            <h1 className="text-3xl font-bold">The quick brown fox jumps over the lazy dog</h1>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">H2 - 2xl (1.5rem/24px)</p>
            <h2 className="text-2xl font-bold">The quick brown fox jumps over the lazy dog</h2>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">H3 - xl (1.25rem/20px)</p>
            <h3 className="text-xl font-bold">The quick brown fox jumps over the lazy dog</h3>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">H4 - lg (1.125rem/18px)</p>
            <h4 className="text-lg font-semibold">The quick brown fox jumps over the lazy dog</h4>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">H5 - base (1rem/16px)</p>
            <h5 className="text-base font-semibold">The quick brown fox jumps over the lazy dog</h5>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">H6 - sm (0.875rem/14px)</p>
            <h6 className="text-sm font-semibold">The quick brown fox jumps over the lazy dog</h6>
          </div>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6 pb-2 border-b">Body Text</h2>
        <div className="space-y-6">
          <div>
            <p className="text-sm text-gray-500 mb-2">Large text - lg (1.125rem/18px)</p>
            <p className="text-lg">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor 
              incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud 
              exercitation ullamco laboris.
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-2">Base text - base (1rem/16px)</p>
            <p className="text-base">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor 
              incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud 
              exercitation ullamco laboris.
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-2">Small text - sm (0.875rem/14px)</p>
            <p className="text-sm">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor 
              incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud 
              exercitation ullamco laboris.
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-2">Extra small text - xs (0.75rem/12px)</p>
            <p className="text-xs">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor 
              incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud 
              exercitation ullamco laboris.
            </p>
          </div>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6 pb-2 border-b">Links</h2>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-500 mb-2">Default link style</p>
            <p className="text-base">
              This is a paragraph with an <a href="#">inline link</a> that shows the default blue color 
              and hover effect. Links are styled with blue-600 (#2563eb) and transition to blue-700 (#1d4ed8) on hover.
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-2">Link sizes</p>
            <div className="space-y-2">
              <p className="text-lg">Large: <a href="#">Click here for more information</a></p>
              <p className="text-base">Base: <a href="#">Click here for more information</a></p>
              <p className="text-sm">Small: <a href="#">Click here for more information</a></p>
              <p className="text-xs">Extra small: <a href="#">Click here for more information</a></p>
            </div>
          </div>
          <div className="bg-gray-900 text-white p-4 rounded">
            <p className="text-sm text-gray-400 mb-2">Links on dark background</p>
            <p>
              Links in dark contexts like the <a href="#" className="hover:text-gray-300">navigation bar</a> inherit 
              the parent text color to maintain readability.
            </p>
          </div>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6 pb-2 border-b">Font Weights</h2>
        <div className="space-y-3">
          <p className="font-thin">Thin (100): The quick brown fox jumps over the lazy dog</p>
          <p className="font-extralight">Extra Light (200): The quick brown fox jumps over the lazy dog</p>
          <p className="font-light">Light (300): The quick brown fox jumps over the lazy dog</p>
          <p className="font-normal">Normal (400): The quick brown fox jumps over the lazy dog</p>
          <p className="font-medium">Medium (500): The quick brown fox jumps over the lazy dog</p>
          <p className="font-semibold">Semibold (600): The quick brown fox jumps over the lazy dog</p>
          <p className="font-bold">Bold (700): The quick brown fox jumps over the lazy dog</p>
          <p className="font-extrabold">Extra Bold (800): The quick brown fox jumps over the lazy dog</p>
          <p className="font-black">Black (900): The quick brown fox jumps over the lazy dog</p>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6 pb-2 border-b">Text Colors</h2>
        <div className="space-y-3">
          <p className="text-gray-900">Gray 900 - Primary text</p>
          <p className="text-gray-700">Gray 700 - Secondary text</p>
          <p className="text-gray-600">Gray 600 - Tertiary text</p>
          <p className="text-gray-500">Gray 500 - Placeholder/hint text</p>
          <p className="text-gray-400">Gray 400 - Disabled text</p>
          <p className="text-blue-600">Blue 600 - Links and primary actions</p>
          <p className="text-green-600">Green 600 - Success messages</p>
          <p className="text-red-600">Red 600 - Error messages</p>
          <p className="text-amber-600">Amber 600 - Warning messages</p>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6 pb-2 border-b">Special Text Styles</h2>
        <div className="space-y-6">
          <div>
            <p className="text-sm text-gray-500 mb-2">Narraitor Logo Style</p>
            <div className="text-2xl">
              <span className="font-light">Narr</span>
              <span className="font-bold">ai</span>
              <span className="font-light">tor</span>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-2">Code/Monospace</p>
            <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
              {`const world = createWorld({ name: 'Adventure Land' });`}
            </code>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-2">Emphasis Styles</p>
            <p className="space-x-4">
              <span className="italic">Italic text</span>
              <span className="underline">Underlined text</span>
              <span className="line-through">Strikethrough text</span>
              <span className="uppercase">Uppercase text</span>
            </p>
          </div>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6 pb-2 border-b">Line Heights</h2>
        <div className="space-y-6">
          <div>
            <p className="text-sm text-gray-500 mb-2">Tight - leading-tight (1.25)</p>
            <p className="leading-tight max-w-md">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor 
              incididunt ut labore et dolore magna aliqua.
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-2">Normal - leading-normal (1.5)</p>
            <p className="leading-normal max-w-md">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor 
              incididunt ut labore et dolore magna aliqua.
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-2">Relaxed - leading-relaxed (1.625)</p>
            <p className="leading-relaxed max-w-md">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor 
              incididunt ut labore et dolore magna aliqua.
            </p>
          </div>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6 pb-2 border-b">Common Typography Patterns</h2>
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-bold mb-2">Card Title</h3>
            <p className="text-gray-600 mb-4">
              This is a typical card description using gray-600 for secondary text.
            </p>
            <a href="#" className="text-blue-600 hover:text-blue-700">Learn more →</a>
          </div>
          
          <div className="border-l-4 border-blue-500 pl-4 py-2">
            <h4 className="font-semibold">Info Box Title</h4>
            <p className="text-sm text-gray-600">
              Informational text that provides additional context or help.
            </p>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded p-4">
            <p className="text-red-800 font-medium">Error Message</p>
            <p className="text-red-600 text-sm mt-1">
              Something went wrong. Please try again later.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
