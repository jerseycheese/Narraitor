'use client';

import Link from 'next/link';

export default function DevPage() {
  const testHarnesses = {
    'Core Systems': [
      { href: '/dev/game-session', label: 'Game Session', color: 'blue' },
      { href: '/dev/ending-screen', label: 'Ending Screen', color: 'blue' },
      { href: '/dev/narrative-system', label: 'Narrative System', color: 'blue' },
      { href: '/dev/choice-alignment', label: 'Choice Alignment Test', color: 'blue' },
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
  };

  return (
    <div>
      <h1>Development Test Harnesses</h1>
      
      <div>
        {Object.entries(testHarnesses).map(([category, items]) => (
          <div key={category}>
            <h2>{category}</h2>
            <div>
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
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
