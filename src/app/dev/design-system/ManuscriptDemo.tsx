'use client';

import { useState } from 'react';

// ---------------------------------------------------------------------------
// Manuscript Demo Component (extracted from page.tsx)
// ---------------------------------------------------------------------------
export default function ManuscriptDemo() {
  const [showCharacter, setShowCharacter] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [activeDrawer, setActiveDrawer] = useState<string | null>(null);
  const [sessionState, setSessionState] = useState<string>('active');
  const [inputValue, setInputValue] = useState('');

  const drawerContent: Record<string, { title: string; subtitle: string; body: React.ReactNode }> = {
    story: {
      title: 'Story So Far',
      subtitle: 'Current Session',
      body: (
        <>
          <p className="text-narrative" style={{ fontSize: 13, lineHeight: 1.65, marginBottom: 12 }}>You took the case from a worried manager at the Alibi Room. Clara Duvall, their star singer, vanished after her last set three nights ago.</p>
          <p className="text-narrative" style={{ fontSize: 13, lineHeight: 1.65 }}>Sergeant Reyes warned you to stay out of it. The club owner, Deluca, is connected. But the trail is getting cold.</p>
        </>
      ),
    },
    history: {
      title: 'Choice History',
      subtitle: '6 choices made',
      body: (
        <ol style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {['Took Clara Duvall\'s missing person case despite Reyes\' warning.', 'Searched the dressing room before the club closed.', 'Pressed the bartender about who Clara left with.'].map((c, i) => (
            <li key={i} className="font-system" style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{c}</li>
          ))}
        </ol>
      ),
    },
    journal: {
      title: 'Journal',
      subtitle: '3 entries',
      body: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { title: 'The Alibi Room', excerpt: 'Clara\'s dressing room was untouched. Perfume on the vanity, a half-finished cigarette. She hadn\'t planned to leave.' },
            { title: 'Reyes\u2019 Warning', excerpt: 'The sergeant told me to drop it. That kind of advice usually means I\'m on the right track.' },
          ].map((e) => (
            <div key={e.title} style={{ padding: 10, border: '1px solid var(--color-border)', borderRadius: 2, background: 'var(--color-surface-hover)' }}>
              <div className="font-system" style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 4 }}>{e.title}</div>
              <p className="text-narrative" style={{ fontSize: 12, lineHeight: 1.6, color: 'var(--color-text-secondary)', margin: 0 }}>{e.excerpt}</p>
            </div>
          ))}
        </div>
      ),
    },
    inventory: {
      title: 'Inventory',
      subtitle: '4 items',
      body: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {[
            { name: 'Revolver', desc: 'Standard issue, well-oiled.' },
            { name: 'Case File', desc: 'Clara Duvall — notes and photos.' },
            { name: 'Matchbook', desc: 'From the Alibi Room. Address on the back.' },
            { name: 'Lockpick Set', desc: 'Worn but reliable. 3 picks remain.' },
          ].map((item) => (
            <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
              <img src={`https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(item.name)}`} alt={item.name} style={{ width: 32, height: 32, borderRadius: 2, background: 'var(--color-surface-hover)', objectFit: 'cover', flexShrink: 0 }} />
              <div>
                <div className="font-system" style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-primary)' }}>{item.name}</div>
                <div className="font-system" style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      ),
    },
  };

  return (
    <div>
      {/* State Switcher */}
      <div className="font-system" style={{ display: 'flex', gap: 4, marginBottom: 10, flexWrap: 'wrap' }}>
        {['active', 'streaming', 'loading', 'error', 'paused'].map((s) => (
          <button
            key={s}
            onClick={() => setSessionState(s)}
            style={{
              padding: '4px 10px', fontSize: 10, fontWeight: sessionState === s ? 600 : 400,
              letterSpacing: '0.06em', textTransform: 'uppercase',
              background: sessionState === s ? 'var(--color-accent)' : 'var(--color-surface)',
              color: sessionState === s ? 'white' : 'var(--color-text-secondary)',
              border: '1px solid var(--color-border)', borderRadius: 2, cursor: 'pointer',
            }}
          >{s}</button>
        ))}
      </div>
      <div className="manuscript-demo" style={{ border: '1px solid var(--color-border)', borderRadius: 4, overflow: 'hidden', minHeight: 560, position: 'relative' }}>
        <div style={{ background: 'linear-gradient(180deg, var(--color-manuscript-gradient-start), var(--color-manuscript-gradient-end))', padding: 12, minHeight: 560, display: 'grid', gridTemplateRows: 'auto 1fr auto', gap: 10 }}>

          {/* HUD */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 12px', background: 'var(--color-overlay-surface)', border: '1px solid var(--color-border)', borderRadius: 2, backdropFilter: 'blur(12px)' }}>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={() => { setShowCharacter(!showCharacter); setShowTools(false); }}
                className="font-system"
                aria-expanded={showCharacter}
                style={{ padding: '4px 10px', background: showCharacter ? 'var(--color-accent)' : 'var(--color-surface)', color: showCharacter ? 'white' : 'var(--color-text-primary)', border: '1px solid var(--color-border)', borderRadius: 2, fontSize: 10, letterSpacing: '0.05em', textTransform: 'uppercase', cursor: 'pointer', fontWeight: 500 }}
              >
                Character
              </button>
              <button
                onClick={() => { setShowTools(!showTools); setShowCharacter(false); }}
                className="font-system"
                aria-expanded={showTools}
                style={{ padding: '4px 10px', background: showTools ? 'var(--color-accent)' : 'var(--color-surface)', color: showTools ? 'white' : 'var(--color-text-primary)', border: '1px solid var(--color-border)', borderRadius: 2, fontSize: 10, letterSpacing: '0.05em', textTransform: 'uppercase', cursor: 'pointer', fontWeight: 500 }}
              >
                Tools
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className="font-system" style={{ fontSize: 10, color: 'var(--color-text-muted)', fontWeight: 500 }}>SAVED</span>
              <button className="font-system" style={{ fontSize: 10, color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Reset</button>
              <button className="font-system" style={{ fontSize: 10, color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Close</button>
            </div>
          </div>
          {/* Character snapshot panel */}
          {showCharacter && (
            <div style={{ position: 'absolute', top: 56, left: 12, width: 220, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 2, padding: 14, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', zIndex: 10 }}>
              <div className="font-system" style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 10, fontWeight: 600 }}>Character Snapshot</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--color-surface-hover)', border: '1px solid var(--color-border)', flexShrink: 0 }} />
                <div>
                  <div className="font-system" style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>Marlowe Vance</div>
                  <div className="font-system" style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Level 4</div>
                </div>
              </div>
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 8, marginBottom: 8 }}>
                {[['Instinct', '14'], ['Composure', '11'], ['Street Smarts', '16']].map(([attr, val]) => (
                  <div key={attr} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span className="font-system" style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{attr}</span>
                    <span className="font-system" style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-primary)' }}>{val}</span>
                  </div>
                ))}
              </div>
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 8 }}>
                {[['Interrogation', '4'], ['Shadowing', '2']].map(([skill, lvl]) => (
                  <div key={skill} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span className="font-system" style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{skill}</span>
                    <span className="font-system" style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-accent)' }}>{lvl}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tools menu panel */}
          {showTools && (
            <div style={{ position: 'absolute', top: 56, left: 84, width: 200, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 2, padding: 14, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', zIndex: 10 }}>
              <div className="font-system" style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 10, fontWeight: 600 }}>Tools</div>
              <button style={{ width: '100%', padding: '7px 10px', background: 'transparent', border: '1px solid var(--color-border)', borderRadius: 2, fontSize: 12, textAlign: 'left', cursor: 'pointer', marginBottom: 4, color: 'var(--color-text-primary)' }}>Character Sheet</button>
              <button onClick={() => { setActiveDrawer(activeDrawer === 'inventory' ? null : 'inventory'); setShowTools(false); }} aria-expanded={activeDrawer === 'inventory'} style={{ width: '100%', padding: '7px 10px', background: activeDrawer === 'inventory' ? 'var(--color-surface-hover)' : 'transparent', border: '1px solid var(--color-border)', borderRadius: 2, fontSize: 12, textAlign: 'left', cursor: 'pointer', marginBottom: 4, color: 'var(--color-text-primary)' }}>Inventory</button>
              <div style={{ borderTop: '1px solid var(--color-border)', margin: '8px 0' }} />
              {[['Story So Far', 'story'], ['Choice History', 'history'], ['Journal', 'journal']].map(([label, key]) => (
                <button key={key} onClick={() => { setActiveDrawer(activeDrawer === key ? null : key); setShowTools(false); }} aria-expanded={activeDrawer === key} style={{ width: '100%', padding: '7px 10px', background: activeDrawer === key ? 'var(--color-surface-hover)' : 'transparent', border: '1px solid var(--color-border)', borderRadius: 2, fontSize: 12, textAlign: 'left', cursor: 'pointer', marginBottom: 4, color: 'var(--color-text-primary)' }}>{label}</button>
              ))}
            </div>
          )}

          {/* 3-column body */}
          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr 140px', gap: 10, minHeight: 0 }}>

            {/* Left characters rail */}
            <div style={{ padding: '12px 10px' }}>
              <div className="font-system" style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 10, fontWeight: 600 }}>Characters Present</div>
              {['Marlowe Vance', 'Sergeant Reyes'].map((name) => (
                <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'var(--color-surface-hover)', border: '1px solid var(--color-border)', flexShrink: 0 }} />
                  <span className="font-system" style={{ fontSize: 11, color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
                </div>
              ))}
            </div>

            {/* Narrative center */}
            <div style={{ padding: '12px 0', minHeight: 200 }}>
              <div className="text-narrative" role="log" aria-live="polite" aria-atomic="false">

                {sessionState === 'loading' ? (
                  /* Loading: Skeleton shimmer lines */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {[85, 100, 70, 95, 60].map((w, i) => (
                      <div key={i} style={{
                        height: 14, width: `${w}%`, borderRadius: 2,
                        background: 'linear-gradient(90deg, var(--color-border) 25%, var(--color-surface-hover) 50%, var(--color-border) 75%)',
                        backgroundSize: '200% 100%',
                        animation: 'ds1-shimmer 1.5s ease-in-out infinite',
                      }} />
                    ))}
                  </div>
                ) : (
                  /* Active / Streaming / Error / Paused: Show narrative */
                  <>
                    <p>Rain hammered the sidewalk outside the Alibi Room. Through the smudged window, neon signs bled pink and blue across the wet asphalt. The club was closing, and the bartender was already stacking chairs.</p>

                    {/* Outcome — technical record annotation */}
                    <div style={{ margin: '16px 0', padding: '0 0 0 20px', position: 'relative' }}>
                      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 1, background: 'var(--color-border)' }} />
                      <div className="font-system" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 2 }}>
                        <span style={{ background: 'var(--color-accent)', color: 'white', padding: '1px 5px', borderRadius: 1, fontWeight: 600, fontSize: 8 }}>REC</span>
                        Decision Logged
                      </div>
                      <p style={{ fontSize: 13, lineHeight: 1.55, fontStyle: 'italic', color: 'var(--color-text-secondary)', margin: 0, fontFamily: 'var(--font-narrative)' }}>
                        You chose to press the bartender for information instead of searching the back office.
                      </p>
                    </div>

                    <p>The bartender wiped down the counter without looking up. His hands were steady, but something in his jaw was tight. He knew more than he was letting on.</p>

                    {/* Outcome — critical success as a stamped annotation */}
                    <div style={{ margin: '16px 0', padding: '14px 16px', paddingTop: 36, background: 'var(--color-surface-hover)', border: '1px dashed var(--color-border)', borderRadius: 2, position: 'relative' }}>
                      <div style={{ position: 'absolute', top: -8, right: 12, background: '#065f46', color: 'white', padding: '1px 8px', borderRadius: 1 }}>
                        <span className="font-system" style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Critical Success</span>
                      </div>
                      <p className="font-system" style={{ fontSize: 11, lineHeight: 1.55, color: 'var(--color-text-secondary)', margin: 0 }}>
                        Interrogation check passed (18 vs DC 12). The bartender&rsquo;s composure cracked &mdash; he slid a matchbook across the counter. &ldquo;She got in a car. Black sedan. That&rsquo;s all I know.&rdquo;
                      </p>
                    </div>

                    <p>
                      &ldquo;You&rsquo;re poking around where you shouldn&rsquo;t,&rdquo; Sergeant Reyes said, leaning against the bar. &ldquo;But I can&rsquo;t stop a man from asking questions.&rdquo;
                      {sessionState === 'streaming' && <span style={{ display: 'inline-block', width: 2, height: '1.1em', background: 'var(--color-text-muted)', verticalAlign: 'text-bottom', animation: 'ds1-blink 1s step-end infinite', marginLeft: 2 }} />}
                    </p>

                    {sessionState === 'error' && (
                      <div style={{ margin: '16px 0', padding: '12px 14px', background: 'rgba(159,18,57,0.06)', border: '1px solid rgba(159,18,57,0.3)', borderRadius: 2 }}>
                        <div className="font-system" style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9f1239', marginBottom: 6 }}>Error</div>
                        <p style={{ fontSize: 13, lineHeight: 1.55, color: '#9f1239', margin: '0 0 10px', fontFamily: 'var(--font-narrative)' }}>Something went wrong generating the next part of the story.</p>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="font-system" style={{ padding: '4px 10px', fontSize: 10, fontWeight: 500, background: '#9f1239', color: 'white', border: 'none', borderRadius: 2, cursor: 'pointer', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Retry</button>
                          <button className="font-system" style={{ padding: '4px 10px', fontSize: 10, fontWeight: 500, background: 'transparent', color: '#9f1239', border: '1px solid rgba(159,18,57,0.3)', borderRadius: 2, cursor: 'pointer', letterSpacing: '0.05em', textTransform: 'uppercase' }}>End Session</button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
            {/* Right spacer (mirrors left rail width) */}
            <div />
          </div>

          {/* Drawer */}
          {activeDrawer && drawerContent[activeDrawer] && (
            <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 280, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '2px 0 0 2px', padding: 16, boxShadow: '0 16px 48px rgba(0,0,0,0.15)', overflow: 'auto', zIndex: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0, color: 'var(--color-text-primary)' }}>{drawerContent[activeDrawer].title}</h3>
                  <div className="font-system" style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 2 }}>{drawerContent[activeDrawer].subtitle}</div>
                </div>
                <button onClick={() => setActiveDrawer(null)} className="font-system" style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>Close</button>
              </div>
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 12, marginTop: 8 }}>
                {drawerContent[activeDrawer].body}
              </div>
            </div>
          )}

          {/* Action Rail */}
          <div style={{ background: 'var(--color-overlay-surface-strong)', border: '1px solid var(--color-border)', borderRadius: 2, backdropFilter: 'blur(20px)', overflow: 'hidden', opacity: sessionState === 'paused' ? 0.4 : 1, pointerEvents: sessionState === 'paused' ? 'none' : undefined }}>
            {/* Choice button grid — only in active state */}
            {sessionState === 'active' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, padding: '10px 10px 6px' }}>
                {[
                  { label: 'Search the back office while Reyes distracts', badge: null },
                  { label: 'Follow the black sedan lead', badge: 'Lawful' },
                  { label: 'Confront Deluca directly at his club', badge: 'Chaotic' },
                ].map(({ label, badge }) => (
                  <button
                    key={label}
                    className="font-system"
                    onClick={() => setInputValue(label)}
                    style={{
                      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                      width: '100%', height: 66, padding: '10px 14px',
                      background: badge === 'Lawful' ? 'rgba(7,89,133,0.04)' : badge === 'Chaotic' ? 'rgba(146,64,14,0.04)' : 'var(--color-surface)',
                      border: `1px solid ${badge === 'Lawful' ? 'rgba(7,89,133,0.3)' : badge === 'Chaotic' ? 'rgba(146,64,14,0.3)' : 'var(--color-border)'}`,
                      borderRadius: 2, fontSize: 12, cursor: 'pointer', textAlign: 'left', color: 'var(--color-text-primary)', lineHeight: 1.4,
                    }}
                  >
                    <span style={{ fontWeight: 500 }}>{label}</span>
                    {badge && (
                      <span style={{ alignSelf: 'flex-start', fontSize: 10, padding: '1px 6px', borderRadius: 2, background: badge === 'Lawful' ? 'rgba(7,89,133,0.1)' : 'rgba(146,64,14,0.1)', color: badge === 'Lawful' ? '#075985' : '#92400e', fontWeight: 600 }}>{badge}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
            {/* Streaming indicator */}
            {sessionState === 'streaming' && (
              <div style={{ padding: '10px 10px 6px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--color-text-muted)', animation: 'ds1-pulse 1.2s ease-in-out infinite' }} />
                <span className="font-system" style={{ fontSize: 10, color: 'var(--color-text-muted)', letterSpacing: '0.04em' }}>Generating response...</span>
              </div>
            )}
            {/* Input row */}
            <div style={{ padding: '0 10px 8px', display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="text"
                placeholder={sessionState === 'active' ? 'Or write your own action...' : 'Waiting for story...'}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                readOnly={sessionState !== 'active'}
                style={{ flex: 1, height: 38, padding: '0 10px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 2, fontSize: 13, opacity: sessionState !== 'active' ? 0.5 : 1 }}
              />
              <button aria-label="Send action" disabled={sessionState !== 'active'} style={{ height: 38, padding: '0 14px', background: 'var(--color-accent)', color: 'white', border: 'none', borderRadius: 2, fontSize: 12, fontWeight: 500, cursor: sessionState === 'active' ? 'pointer' : 'default', whiteSpace: 'nowrap', opacity: sessionState !== 'active' ? 0.5 : 1 }}>Send</button>
              <button className="font-system" style={{ height: 38, padding: '0 10px', background: 'rgba(146,64,14,0.08)', border: '1px solid rgba(146,64,14,0.25)', borderRadius: 2, color: '#92400e', cursor: 'pointer', fontSize: 10, letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 500, whiteSpace: 'nowrap' }}>End Story</button>
            </div>
          </div>
        </div>
      </div>
      {/* Paused overlay */}
      {sessionState === 'paused' && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(250,250,249,0.85)', backdropFilter: 'blur(12px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, zIndex: 40, borderRadius: 4 }}>
          <h3 style={{ fontFamily: 'var(--font-interface)', fontSize: 18, fontWeight: 500, color: 'var(--color-text-primary)', margin: 0 }}>Session Paused</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setSessionState('active')} style={{ padding: '8px 20px', background: 'var(--color-accent)', color: 'white', border: 'none', borderRadius: 2, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-interface)' }}>Resume</button>
            <button style={{ padding: '8px 20px', background: 'var(--color-surface)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)', borderRadius: 2, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-interface)' }}>End Session</button>
          </div>
        </div>
      )}
    </div>
  );
}
