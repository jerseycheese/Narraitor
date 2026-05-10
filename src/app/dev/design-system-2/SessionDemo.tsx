'use client';

import { useState } from 'react';

// ─────────────────────────────────────────────────────────────────
// Session Demo Component (extracted from page.tsx)
// ─────────────────────────────────────────────────────────────────
export default function SessionDemo() {
  const [showCharacter, setShowCharacter] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [activeDrawer, setActiveDrawer] = useState<string | null>(null);
  const [sessionState, setSessionState] = useState<string>('active');
  const [inputValue, setInputValue] = useState('');

  return (
    <>
      {/* State Switcher */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 12, flexWrap: 'wrap' }}>
        {['active', 'streaming', 'loading', 'error', 'paused'].map((s) => (
          <button
            key={s}
            type="button"
            className="ds2-session-ambient-btn"
            onClick={() => setSessionState(s)}
            style={{
              padding: '5px 12px',
              background: sessionState === s ? 'var(--color-accent)' : 'var(--color-surface)',
              color: sessionState === s ? 'white' : undefined,
              border: '1px solid var(--color-border)',
              borderRadius: 8,
            }}
          >{s}</button>
        ))}
      </div>
      <div className="ds2-session-shell ds2-reveal">

        {/* Running head — pure typography, no chrome bar */}
        <div className="ds2-session-running-head">
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '14px' }}>
            <button
              type="button"
              className="ds2-session-char-link"
              onClick={() => { setShowCharacter(!showCharacter); setShowTools(false); }}
              style={{ color: showCharacter ? 'var(--color-accent)' : undefined }}
              aria-expanded={showCharacter}
            >
              Marlowe Vance
            </button>
            <button
              type="button"
              className="ds2-session-ambient-btn"
              onClick={() => { setShowTools(!showTools); setShowCharacter(false); }}
              style={{ color: showTools ? 'var(--color-accent)' : undefined }}
              aria-expanded={showTools}
            >
              Tools
            </button>
          </div>
          <div className="ds2-session-running-center">Current Session</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
            <span className="ds2-session-saving-dot" title="Auto-saving" />
            <button type="button" className="ds2-session-ambient-btn">Reset</button>
            <button type="button" className="ds2-session-ambient-btn">Close</button>
          </div>
        </div>

        {/* Character panel — paper note */}
        {showCharacter && (
          <div className="ds2-session-floating-panel" style={{ left: '28px' }}>
            <div className="ds2-session-panel-label">Character</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--color-accent-soft)', border: '1.5px solid var(--color-accent)', flexShrink: 0 }} />
              <div>
                <div style={{ fontFamily: 'var(--font-narrative)', fontSize: '1rem', fontWeight: 500, color: 'var(--color-text-primary)' }}>Marlowe Vance</div>
                <div style={{ fontFamily: 'var(--font-system)', fontSize: '10px', color: 'var(--color-text-muted)', letterSpacing: '0.06em' }}>Level 4</div>
              </div>
            </div>
            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '10px', marginBottom: '10px' }}>
              {[['Instinct', '14'], ['Composure', '11'], ['Street Smarts', '16']].map(([a, v]) => (
                <div key={a} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontFamily: 'var(--font-system)', fontSize: '10px', color: 'var(--color-text-secondary)' }}>{a}</span>
                  <span style={{ fontFamily: 'var(--font-system)', fontSize: '10px', fontWeight: 600, color: 'var(--color-text-primary)' }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '10px' }}>
              {[['Interrogation', '4'], ['Shadowing', '2']].map(([s, m]) => (
                <div key={s} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontFamily: 'var(--font-system)', fontSize: '10px', color: 'var(--color-text-secondary)' }}>{s}</span>
                  <span style={{ fontFamily: 'var(--font-system)', fontSize: '10px', fontWeight: 600, color: 'var(--color-accent)' }}>{m}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tools panel */}
        {showTools && (
          <div className="ds2-session-floating-panel" style={{ left: '110px' }}>
            <div className="ds2-session-panel-label">Tools</div>
            <button type="button" className="ds2-session-tool-btn">Character Sheet</button>
            <button type="button" className="ds2-session-tool-btn" onClick={() => { setActiveDrawer(activeDrawer === 'inventory' ? null : 'inventory'); setShowTools(false); }} style={{ color: activeDrawer === 'inventory' ? 'var(--color-accent)' : undefined }} aria-expanded={activeDrawer === 'inventory'}>Inventory</button>
            <div style={{ borderTop: '1px solid var(--color-border)', margin: '8px 0' }} />
            {[['Story So Far', 'story'], ['Choice History', 'history'], ['Journal', 'journal']].map(([label, key]) => (
              <button
                key={key}
                type="button"
                className="ds2-session-tool-btn"
                onClick={() => { setActiveDrawer(activeDrawer === key ? null : key); setShowTools(false); }}
                style={{ color: activeDrawer === key ? 'var(--color-accent)' : undefined }}
                aria-expanded={activeDrawer === key}
              >{label}</button>
            ))}
          </div>
        )}

        {/* Journal page — single reading column */}
        <div className="ds2-session-journal-page">

          {/* Characters present — ambient annotation */}
          <div className="ds2-session-present">
            Marlowe Vance · Sergeant Reyes present
          </div>

          {/* Narrative — dominates */}
          <div className="ds2-session-narrative" role="log" aria-live="polite" aria-atomic="false" style={{ minHeight: 200 }}>

            {sessionState === 'loading' ? (
              /* Loading: warm skeleton shimmer */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[90, 100, 65, 85, 50].map((w, i) => (
                  <div key={i} style={{
                    height: 16, width: `${w}%`, borderRadius: 6,
                    background: 'linear-gradient(90deg, var(--color-border) 25%, var(--color-surface-hover) 50%, var(--color-border) 75%)',
                    backgroundSize: '200% 100%',
                    animation: 'ds2-shimmer 1.5s ease-in-out infinite',
                  }} />
                ))}
              </div>
            ) : (
              <>
                <p>Rain hammered the sidewalk outside the Alibi Room. Through the smudged window, neon signs bled pink and blue across the wet asphalt. The club was closing, and the bartender was already stacking chairs.</p>

                {/* Outcome — editorial sidenote style */}
                <div style={{ display: 'flex', gap: 12, margin: '20px 0', alignItems: 'flex-start' }}>
                  <div style={{ flexShrink: 0, width: 18, height: 18, borderRadius: '50%', border: '1.5px solid var(--color-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2 }}>
                    <span style={{ fontFamily: 'var(--font-system)', fontSize: 9, fontWeight: 700, color: 'var(--color-text-muted)' }}>1</span>
                  </div>
                  <div style={{ flex: 1, borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)', padding: '10px 0' }}>
                    <p style={{ fontFamily: 'var(--font-narrative)', fontSize: 14, lineHeight: 1.6, fontStyle: 'italic', color: 'var(--color-text-secondary)', margin: 0 }}>
                      You chose to press the bartender for information instead of searching the back office.
                    </p>
                  </div>
                </div>

                <p>The bartender wiped down the counter without looking up. His hands were steady, but something in his jaw was tight. He knew more than he was letting on.</p>

                {/* Outcome — centered callout, like a chapter epigraph */}
                <div style={{ textAlign: 'center', margin: '24px 0', padding: '0 24px' }}>
                  <div style={{ width: 40, height: 1, background: 'var(--color-border)', margin: '0 auto 10px' }} />
                  <div style={{ fontFamily: 'var(--font-system)', fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#065f46', marginBottom: 6, fontWeight: 600 }}>
                    Critical Success
                  </div>
                  <p style={{ fontFamily: 'var(--font-narrative)', fontSize: 15, lineHeight: 1.65, fontStyle: 'italic', color: 'var(--color-text-secondary)', margin: 0, maxWidth: 400, marginLeft: 'auto', marginRight: 'auto' }}>
                    Interrogation check passed (18 vs DC 12). The bartender&rsquo;s composure cracked &mdash; he slid a matchbook across the counter. &ldquo;She got in a car. Black sedan.&rdquo;
                  </p>
                  <div style={{ width: 40, height: 1, background: 'var(--color-border)', margin: '10px auto 0' }} />
                </div>

                <p>&ldquo;You&rsquo;re poking around where you shouldn&rsquo;t,&rdquo; Sergeant Reyes said, leaning against the bar. &ldquo;But I can&rsquo;t stop a man from asking questions.&rdquo;{sessionState === 'streaming' && <span style={{ display: 'inline-block', width: 2, height: '1.1em', background: 'var(--color-text-muted)', verticalAlign: 'text-bottom', animation: 'ds2-blink 1s step-end infinite', marginLeft: 2 }} />}</p>

                {sessionState === 'error' && (
                  <div style={{ margin: '16px 0', padding: '14px 16px', background: 'rgba(159,18,57,0.06)', border: '1px solid rgba(159,18,57,0.3)', borderRadius: 8 }}>
                    <div style={{ fontFamily: 'var(--font-system)', fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9f1239', marginBottom: 6 }}>Error</div>
                    <p style={{ fontFamily: 'var(--font-narrative)', fontSize: '0.9375rem', lineHeight: 1.65, color: '#9f1239', margin: '0 0 10px' }}>Something went wrong generating the next part of the story.</p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="button" style={{ padding: '6px 14px', fontSize: 12, fontWeight: 600, background: '#9f1239', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontFamily: 'var(--font-interface)' }}>Retry</button>
                      <button type="button" style={{ padding: '6px 14px', fontSize: 12, fontWeight: 600, background: 'transparent', color: '#9f1239', border: '1px solid rgba(159,18,57,0.3)', borderRadius: 6, cursor: 'pointer', fontFamily: 'var(--font-interface)' }}>End Session</button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Thin rule — narrative ends, choices begin */}
          <div className="ds2-session-footnote-rule" />

          {/* Choices — footnote style, only in active state */}
          {sessionState === 'active' && (
            <div className="ds2-session-choices">
              {[
                { n: '1', label: 'Search the back office while Reyes distracts', color: null },
                { n: '2', label: 'Follow the black sedan lead', color: 'rgba(7,89,133,0.4)' },
                { n: '3', label: 'Confront Deluca directly at his club', color: 'rgba(146,64,14,0.4)' },
              ].map(({ n, label, color }) => (
                <button
                  key={n}
                  type="button"
                  className="ds2-session-choice"
                  style={{ borderLeftColor: color ?? undefined }}
                  onClick={() => setInputValue(label)}
                >
                  <span className="ds2-session-choice-n">{n}</span>
                  <span className="ds2-session-choice-label">{label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Streaming indicator */}
          {sessionState === 'streaming' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--color-accent)', animation: 'ds2-pulse 1.2s ease-in-out infinite' }} />
              <span style={{ fontFamily: 'var(--font-system)', fontSize: 10, color: 'var(--color-text-muted)', letterSpacing: '0.06em' }}>Generating response...</span>
            </div>
          )}

          {/* Compose — minimal, dashed underline style */}
          <div className="ds2-session-action" style={{ opacity: sessionState === 'paused' ? 0.4 : 1, pointerEvents: sessionState === 'paused' ? 'none' : undefined }}>
            <span className="ds2-session-action-label">or write your own</span>
            <input
              type="text"
              className="ds2-session-action-input"
              placeholder={sessionState === 'active' ? 'What do you do?' : 'Waiting for story...'}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              readOnly={sessionState !== 'active'}
              tabIndex={sessionState !== 'active' ? -1 : undefined}
              style={{ opacity: sessionState !== 'active' ? 0.5 : 1 }}
            />
            <button type="button" className="ds2-session-action-send" aria-label="Send action">Send</button>
            <button type="button" className="ds2-session-action-end">End Story</button>
          </div>

        </div>

        {/* Supplementary content — floating panel, right-anchored */}
        {activeDrawer && (
          <div className="ds2-session-floating-panel ds2-session-content-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '10px' }}>
              <div>
                <div className="ds2-session-panel-label" style={{ marginBottom: '2px' }}>
                  {activeDrawer === 'story' ? 'Story So Far' : activeDrawer === 'history' ? 'Choice History' : activeDrawer === 'inventory' ? 'Inventory' : 'Journal'}
                </div>
                <div style={{ fontFamily: 'var(--font-system)', fontSize: '9px', color: 'var(--color-text-muted)', letterSpacing: '0.06em' }}>
                  {activeDrawer === 'story' ? 'Current Session' : activeDrawer === 'history' ? '6 choices made' : activeDrawer === 'inventory' ? '4 items' : '3 entries'}
                </div>
              </div>
              <button type="button" onClick={() => setActiveDrawer(null)} className="ds2-session-ambient-btn">close</button>
            </div>
            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '10px' }}>
              {activeDrawer === 'story' && (
                <div style={{ fontFamily: 'var(--font-narrative)', fontSize: '0.9375rem', lineHeight: 1.65, color: 'var(--color-text-secondary)' }}>
                  <p style={{ marginBottom: '8px' }}>You took the case from a worried manager at the Alibi Room. Clara Duvall, their star singer, vanished after her last set three nights ago.</p>
                  <p style={{ margin: 0 }}>Sergeant Reyes warned you to stay out of it. The club owner, Deluca, is connected. But the trail is getting cold.</p>
                </div>
              )}
              {activeDrawer === 'history' && (
                <ol style={{ margin: 0, paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {['Took Clara Duvall\'s missing person case.', 'Searched the dressing room before the club closed.', 'Pressed the bartender about who Clara left with.'].map((c, i) => (
                    <li key={i} style={{ fontFamily: 'var(--font-system)', fontSize: '11px', lineHeight: 1.5, color: 'var(--color-text-secondary)' }}>{c}</li>
                  ))}
                </ol>
              )}
              {activeDrawer === 'journal' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { title: 'The Alibi Room', excerpt: 'Clara\'s dressing room was untouched. Perfume on the vanity, a half-finished cigarette.' },
                    { title: 'Reyes\u2019 Warning', excerpt: 'The sergeant told me to drop it. That kind of advice usually means I\'m on the right track.' },
                  ].map((e) => (
                    <div key={e.title} style={{ paddingBottom: '8px', borderBottom: '1px solid var(--color-border)' }}>
                      <div style={{ fontFamily: 'var(--font-interface)', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '3px' }}>{e.title}</div>
                      <p style={{ margin: 0, fontFamily: 'var(--font-narrative)', fontSize: '0.875rem', lineHeight: 1.55, color: 'var(--color-text-secondary)' }}>{e.excerpt}</p>
                    </div>
                  ))}
                </div>
              )}
              {activeDrawer === 'inventory' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {[
                    { name: 'Revolver', desc: 'Standard issue, well-oiled.' },
                    { name: 'Case File', desc: 'Clara Duvall — notes and photos.' },
                    { name: 'Matchbook', desc: 'From the Alibi Room. Address on the back.' },
                    { name: 'Lockpick Set', desc: 'Worn but reliable. 3 picks remain.' },
                  ].map((item) => (
                    <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
                      <img src={`https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(item.name)}`} alt={item.name} style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--color-surface-hover)', objectFit: 'cover', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontFamily: 'var(--font-interface)', fontSize: '12px', fontWeight: 500, color: 'var(--color-text-primary)' }}>{item.name}</div>
                        <div style={{ fontFamily: 'var(--font-interface)', fontSize: '11px', color: 'var(--color-text-secondary)' }}>{item.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}



        {/* Paused overlay */}
        {sessionState === 'paused' && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(250,248,243,0.88)', backdropFilter: 'blur(12px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, zIndex: 40, borderRadius: 'var(--border-radius-lg)' }}>
            <h3 style={{ fontFamily: 'var(--font-interface)', fontSize: 18, fontWeight: 500, color: 'var(--color-text-primary)', margin: 0 }}>Session Paused</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => setSessionState('active')} style={{ padding: '8px 20px', background: 'var(--color-accent)', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-interface)' }}>Resume</button>
              <button type="button" style={{ padding: '8px 20px', background: 'var(--color-surface)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-interface)' }}>End Session</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
