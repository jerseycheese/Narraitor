'use client';

export default function GameSessionComparePage() {
  return (
    <div
      className="game-session-compare"
      style={{
        position: 'fixed',
        inset: 0,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gridTemplateRows: 'auto 1fr',
        zIndex: 50,
      }}
    >
      <div style={{ padding: '4px 8px', background: '#1a1a1a', color: '#ccc', fontSize: '12px' }}>
        DS1 Demo (reference)
      </div>
      <div style={{ padding: '4px 8px', background: '#1a1a1a', color: '#ccc', fontSize: '12px' }}>
        Production Game Session
      </div>
      <iframe
        src="/dev/design-system/session"
        style={{ width: '100%', height: '100%', border: 'none' }}
        title="DS1 Demo reference"
      />
      <iframe
        src="/dev/game-session"
        style={{ width: '100%', height: '100%', border: 'none' }}
        title="Production Game Session"
      />
    </div>
  );
}
