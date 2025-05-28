'use client';

import Link from 'next/link';

export default function DevPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Development Test Harnesses</h1>
      <div className="space-y-2">
        <Link href="/dev/world-creation-wizard" className="block p-4 bg-blue-100 hover:bg-blue-200 rounded">
          World Creation Wizard Test Harness
        </Link>
        <Link href="/dev/devtools-test" className="block p-4 bg-blue-100 hover:bg-blue-200 rounded">
          DevTools Test Harness
        </Link>
        <Link href="/dev/ai-testing" className="block p-4 bg-blue-100 hover:bg-blue-200 rounded">
          AI Testing Panel Test Harness
        </Link>
        <Link href="/dev/world-card" className="block p-4 bg-blue-100 hover:bg-blue-200 rounded">
          World Card Test Harness
        </Link>
        <Link href="/dev/game-session" className="block p-4 bg-blue-100 hover:bg-blue-200 rounded">
          Game Session Test Harness
        </Link>
        <Link href="/dev/world-list-screen" className="block p-4 bg-blue-100 hover:bg-blue-200 rounded">
          World List Screen Test Harness
        </Link>
        <Link href="/dev/narrative-system" className="block p-4 bg-blue-100 hover:bg-blue-200 rounded">
          Narrative System Test Harness
        </Link>
        <Link href="/dev/choice-generator" className="block p-4 bg-blue-100 hover:bg-blue-200 rounded">
          Player Choice Generator Test Harness
        </Link>
        <Link href="/dev/character-creation" className="block p-4 bg-blue-100 hover:bg-blue-200 rounded">
          Character Creation Wizard Test Harness
        </Link>
        <Link href="/dev/test-character-form" className="block p-4 bg-green-100 hover:bg-green-200 rounded">
          Character Form Debug (Test Data Pre-fill)
        </Link>
        <Link href="/dev/portrait-prompt-test" className="block p-4 bg-purple-100 hover:bg-purple-200 rounded">
          Portrait Prompt Testing & Logic Visualization
        </Link>
        <Link href="/dev/character-generation" className="block p-4 bg-orange-100 hover:bg-orange-200 rounded">
          Character Generation Test Harness
        </Link>
        <Link href="/dev/world-generation" className="block p-4 bg-orange-100 hover:bg-orange-200 rounded">
          World Generation Test Harness
        </Link>
        <Link href="/dev/attribute-editor" className="block p-4 bg-yellow-100 hover:bg-yellow-200 rounded">
          Attribute Editor Test Harness
        </Link>
        <Link href="/dev/lore-viewer" className="block p-4 bg-indigo-100 hover:bg-indigo-200 rounded">
          Lore Viewer Test Harness
        </Link>
      </div>
    </div>
  );
}
