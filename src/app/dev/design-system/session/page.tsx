'use client';

import ManuscriptDemo from '../ManuscriptDemo';

export default function DesignSystemSessionPage() {
  return (
    <div
      className="design-system-session-fullscreen"
      data-theme="ds1"
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <style>{`
        .design-system-session-fullscreen > div {
          display: flex;
          flex-direction: column;
          flex: 1;
          min-height: 0;
        }
        .design-system-session-fullscreen .manuscript-demo {
          flex: 1;
        }
        .design-system-session-fullscreen .manuscript-demo > div {
          height: 100%;
        }
      `}</style>
      <ManuscriptDemo />
    </div>
  );
}
