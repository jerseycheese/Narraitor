'use client';

import Link from 'next/link';

export default function DevPage() {
  const testHarnesses = {
    'Core Systems': [
      { href: '/dev/game-session', label: 'Game Session', color: 'blue' },
      { href: '/dev/ending-screen', label: 'Ending Screen', color: 'blue' },
      { href: '/dev/narrative-system', label: 'Narrative System', color: 'blue' },
      { href: '/dev/personalization-test', label: 'Personalization System', color: 'pink' },
      { href: '/dev/choice-generator', label: 'Player Choice Generator', color: 'blue' },
      { href: '/dev/choice-alignment', label: 'Choice Alignment Test', color: 'blue' },
      { href: '/dev/decision-points', label: 'Decision Points Test', color: 'blue' },
      { href: '/dev/lore-viewer', label: 'Lore Viewer', color: 'indigo' },
    ],
    'World Management': [
      { href: '/dev/world-creation-wizard', label: 'World Creation Wizard', color: 'green' },
      { href: '/dev/world-card', label: 'World Card', color: 'green' },
      { href: '/dev/world-list-screen', label: 'World List Screen', color: 'green' },
      { href: '/dev/world-generation', label: 'World Generation (AI)', color: 'orange' },
      { href: '/dev/attribute-editor', label: 'Attribute Editor', color: 'yellow' },
    ],
    'Character Management': [
      { href: '/dev/character-creation', label: 'Character Creation Wizard', color: 'purple' },
      { href: '/dev/test-character-form', label: 'Character Form Debug', color: 'purple' },
      { href: '/dev/character-generation', label: 'Character Generation (AI)', color: 'orange' },
      { href: '/dev/portrait-prompt-test', label: 'Portrait Testing', color: 'purple' },
    ],
    'Journal System': [
      { href: '/dev/enhanced-journal', label: 'Enhanced Journal UI', color: 'amber' },
      { href: '/dev/journal-access', label: 'Basic Journal Access', color: 'orange' },
    ],
    'Navigation & UI': [
      { href: '/dev/navigation-flow', label: 'Navigation Flow', color: 'teal' },
      { href: '/dev/template-selector', label: 'Template Selector', color: 'cyan' },
    ],
    'Development Tools': [
      { href: '/dev/devtools-test', label: 'DevTools Panel', color: 'gray' },
      { href: '/dev/ai-testing', label: 'AI Testing Panel', color: 'gray' },
      { href: '/dev/performance-utils', label: 'Performance Utils Test Harness', color: 'gray' },
    ],
  };

  const colorClasses = {
    blue: 'bg-blue-100 hover:bg-blue-200',
    green: 'bg-green-100 hover:bg-green-200',
    purple: 'bg-blue-100 hover:bg-blue-200',
    orange: 'bg-amber-100 hover:bg-amber-200',
    yellow: 'bg-amber-100 hover:bg-amber-200',
    gray: 'bg-gray-100 hover:bg-gray-200',
    indigo: 'bg-blue-100 hover:bg-blue-200',
    teal: 'bg-blue-100 hover:bg-blue-200',
    pink: 'bg-red-100 hover:bg-red-200',
    cyan: 'bg-blue-100 hover:bg-blue-200',
    amber: 'bg-amber-100 hover:bg-amber-200',
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Development Test Harnesses</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {Object.entries(testHarnesses).map(([category, items]) => (
          <div key={category}>
            <h2 className="text-xl font-semibold mb-3 text-gray-700">{category}</h2>
            <div className="space-y-2">
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block p-4 rounded transition-colors ${colorClasses[item.color as keyof typeof colorClasses]}`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
