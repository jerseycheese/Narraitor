'use client';

import { useState } from 'react';

const THEMES = [
  { key: 'ds1', label: 'DS1 Drafting Table', demoPath: '/dev/design-system/session' },
  { key: 'ds2', label: 'DS2 Warm Earth', demoPath: '/dev/design-system-2/session' },
  { key: 'ds3', label: 'DS3 Mechanical Manuscript', demoPath: '/dev/design-system-3/session' },
] as const;

const headerStyle: React.CSSProperties = {
  padding: '4px 8px',
  background: '#1a1a1a',
  color: '#ccc',
  fontSize: '12px',
};

const tabStyle = (active: boolean): React.CSSProperties => ({
  padding: '3px 10px',
  background: active ? '#444' : 'transparent',
  color: active ? '#fff' : '#999',
  border: '1px solid',
  borderColor: active ? '#666' : '#444',
  borderRadius: 4,
  fontSize: '11px',
  cursor: 'pointer',
  fontFamily: 'inherit',
});

export default function GameSessionComparePage() {
  const [themeIdx, setThemeIdx] = useState(0);
  const theme = THEMES[themeIdx];

  return (
    <div
      className="game-session-compare"
      style={{
        position: 'fixed',
        inset: 0,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gridTemplateRows: 'auto auto 1fr',
        zIndex: 50,
      }}
    >
      {/* Theme switcher row — spans both columns */}
      <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px', background: '#111', borderBottom: '1px solid #333' }}>
        <span style={{ fontSize: '11px', color: '#888', marginRight: 4 }}>Theme:</span>
        {THEMES.map((t, i) => (
          <button
            key={t.key}
            type="button"
            style={tabStyle(i === themeIdx)}
            onClick={() => setThemeIdx(i)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Column headers */}
      <div style={headerStyle}>
        {theme.label} Demo (reference)
      </div>
      <div style={headerStyle}>
        Production Game Session ({theme.key})
      </div>

      {/* Iframes */}
      <iframe
        key={`demo-${theme.key}`}
        src={theme.demoPath}
        style={{ width: '100%', height: '100%', border: 'none' }}
        title={`${theme.label} Demo reference`}
      />
      <iframe
        key={`prod-${theme.key}`}
        src={`/dev/game-session?theme=${theme.key}`}
        style={{ width: '100%', height: '100%', border: 'none' }}
        title={`Production Game Session (${theme.key})`}
      />
    </div>
  );
}
