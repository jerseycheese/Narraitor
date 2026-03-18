'use client';

import { useState } from 'react';
import * as Icons from './icons';

export default function SessionDemo() {
  const [hudOpen, setHudOpen] = useState(false);
  const [drawer, setDrawer] = useState<string | null>(null);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [sessionState, setSessionState] = useState<string>('active');

  return (
    <>
      {/* State switcher */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
        {['active', 'streaming', 'loading', 'error', 'paused'].map(s => (
          <button key={s} type="button" className={`ds3-btn ${sessionState === s ? 'ds3-btn-primary' : 'ds3-btn-secondary'} ds3-btn-sm`}
            onClick={() => { setSessionState(s); setDrawer(null); setHudOpen(false); setSelectedChoice(null); }}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Session Shell */}
      <div className="ds3-session" style={{ minHeight: 680 }}>
        <div className="ds3-session-grid" />

        {/* Character HUD */}
        <div className="ds3-hud-char">
          {!hudOpen ? (
            <button type="button" className="ds3-hud-pill" onClick={() => setHudOpen(true)} aria-expanded={hudOpen} aria-label="Character stats">
              Marlowe
            </button>
          ) : (
            <div className="ds3-hud-panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--color-accent-soft)', border: '1.5px solid var(--color-accent)' }} />
                  <div><div className="ds3-hud-name">Marlowe Vance</div><div className="ds3-hud-level">Level 4</div></div>
                </div>
                <button type="button" className="ds3-drawer-close" onClick={() => setHudOpen(false)} aria-label="Collapse character panel"><Icons.ChevronDown size={14} /></button>
              </div>
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 8, marginTop: 10 }}>
                {[['Instinct', '14'], ['Composure', '11'], ['Street Smarts', '16'], ['Cunning', '10']].map(([k, v]) => (
                  <div key={k} className="ds3-hud-stat-row"><span className="ds3-hud-stat-label">{k}</span><span className="ds3-hud-stat-value">{v}</span></div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                <span className="ds3-badge" style={{ background: 'var(--color-success-bg)', color: 'var(--color-success)' }}>Focused</span>
              </div>
              <div className="ds3-hud-location" style={{ marginTop: 8 }}>The Alibi Room</div>
            </div>
          )}
        </div>

        {/* Session Controls HUD */}
        <div className="ds3-hud-controls">
          <button type="button" className="ds3-hud-ctrl-btn" title="Pause" aria-label="Pause session"><Icons.Pause size={18} /></button>
          <button type="button" className="ds3-hud-ctrl-btn" title="Journal" aria-label="Journal" aria-expanded={drawer === 'journal'} onClick={() => setDrawer(drawer === 'journal' ? null : 'journal')}><Icons.BookOpen size={18} /></button>
          <button type="button" className="ds3-hud-ctrl-btn" title="Inventory" aria-label="Inventory" aria-expanded={drawer === 'inventory'} onClick={() => setDrawer(drawer === 'inventory' ? null : 'inventory')}><Icons.Backpack size={18} /></button>
          <button type="button" className="ds3-hud-ctrl-btn" title="Settings" aria-label="Settings"><Icons.Settings size={18} /></button>
          <button type="button" className="ds3-hud-ctrl-btn" title="End Session" aria-label="End session"><Icons.LogOut size={18} /></button>
        </div>

        {/* Narrative Column */}
        <div className="ds3-narrative-col" role="log" aria-live="polite" aria-atomic="false">
          {sessionState === 'loading' ? (
            <div style={{ textAlign: 'center', paddingTop: 160 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 400, margin: '0 auto' }}>
                <div className="ds3-skeleton" style={{ width: '90%', margin: '0 auto' }} />
                <div className="ds3-skeleton" style={{ width: '100%', margin: '0 auto' }} />
                <div className="ds3-skeleton" style={{ width: '75%', margin: '0 auto' }} />
                <div className="ds3-skeleton" style={{ width: '85%', margin: '0 auto' }} />
              </div>
              <p style={{ fontFamily: 'var(--font-system)', fontSize: 13, color: 'var(--color-text-muted)', marginTop: 32 }}>
                Preparing your story...
              </p>
            </div>
          ) : (
            <>
              <div className="ds3-narrative-timestamp">Beginning of session</div>

              <div className="ds3-narrative-segment">
                <p>Rain hammered the sidewalk outside the Alibi Room. Through the smudged window, neon signs bled pink and blue across the wet asphalt. The club was closing, and the bartender was already stacking chairs.</p>
                <p>A cigarette still smoldered in the ashtray by the stage door. Clara Duvall&apos;s dressing room was three steps down a narrow hallway, past velvet curtains that smelled of perfume and old smoke.</p>
              </div>

              {/* Outcome — revision mark (decision) */}
              <div className="ds3-outcome">
                <div className="ds3-outcome-header">
                  <span className="ds3-outcome-label">Decision</span>
                </div>
                <p className="ds3-outcome-text">You chose to press the bartender for information instead of searching the back office.</p>
              </div>

              <div className="ds3-narrative-divider" />
              <div className="ds3-narrative-timestamp">3 minutes ago</div>

              <div className="ds3-narrative-segment">
                <p>The bartender wiped down the counter without looking up. His hands were steady, but something in his jaw was tight. He knew more than he was letting on.</p>
                <p className="ds3-narrative-dialogue">&ldquo;You&rsquo;re poking around where you shouldn&rsquo;t,&rdquo; Sergeant Reyes said, leaning against the bar. &ldquo;But I can&rsquo;t stop a man from asking questions.&rdquo;</p>
              </div>

              {/* Outcome — revision mark (critical success) */}
              <div className="ds3-outcome ds3-outcome-success">
                <div className="ds3-outcome-header">
                  <span className="ds3-outcome-label">Critical Success</span>
                </div>
                <p className="ds3-outcome-text">The bartender&rsquo;s composure cracked &mdash; he slid a matchbook across the counter. &ldquo;She got in a car. Black sedan. That&rsquo;s all I know.&rdquo;</p>
                <div className="ds3-outcome-roll">Interrogation 18 vs DC 14</div>
              </div>

              <div className="ds3-narrative-divider" />
              <div className="ds3-narrative-timestamp">Just now</div>

              <div className="ds3-narrative-segment">
                <p>Then Reyes leaned in, voice low. &ldquo;There&rsquo;s a matchbook in your hand, and I&rsquo;m pretending I didn&rsquo;t see it. The address on the back &mdash; that&rsquo;s Deluca&rsquo;s warehouse. Be careful.&rdquo;{sessionState === 'streaming' && <span className="ds3-cursor" />}</p>
              </div>

              {/* Choice Cards */}
              {sessionState === 'active' && (
                <div className="ds3-choices">
                  {[
                    { text: 'Search Deluca\u2019s warehouse using the matchbook address', hint: 'Requires: Investigation 3+', bar: '#5B7A8C' },
                    { text: 'Tail the black sedan through the warehouse district', hint: 'Uses: Shadowing', bar: '#7A8B6F' },
                    { text: 'Confront Deluca directly at his club', hint: 'Uses: Interrogation', bar: '#8C7B5B' },
                    { text: 'Stake out the Alibi Room until closing', hint: 'Time will pass · New leads may appear', bar: '#8C6B6B' },
                  ].map((c, i) => (
                    <button key={i} type="button"
                      className={`ds3-choice ${selectedChoice === i ? 'ds3-choice-selected' : ''}`}
                      onClick={() => setSelectedChoice(selectedChoice === i ? null : i)}
                      style={{ borderLeftColor: 'transparent' }}>
                      <span style={{ position: 'absolute', left: 0, top: 8, bottom: 8, width: 3, borderRadius: '0 2px 2px 0', background: c.bar }} />
                      <div className="ds3-choice-kbd">{i + 1}</div>
                      <div className="ds3-choice-text">{c.text}</div>
                      <div className="ds3-choice-hint">{c.hint}</div>
                    </button>
                  ))}
                </div>
              )}

              {/* Error State */}
              {sessionState === 'error' && (
                <div style={{ marginTop: 32 }}>
                  <div className="ds3-alert ds3-alert-error" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Icons.AlertCircle size={18} />
                      <span style={{ fontWeight: 500 }}>Something went wrong generating the narrative.</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="button" className="ds3-btn ds3-btn-primary ds3-btn-sm">Retry</button>
                      <button type="button" className="ds3-btn ds3-btn-ghost ds3-btn-sm">End Session</button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Input Bar */}
        <div className={`ds3-input-bar ${sessionState === 'streaming' || sessionState === 'loading' ? 'ds3-input-bar-disabled' : ''}`}>
          {sessionState === 'streaming' || sessionState === 'loading' ? (
            <div className="ds3-generating-label"><span className="ds3-generating-dot" />Generating...</div>
          ) : null}
          <input type="text" className="ds3-input-bar-field"
            placeholder={sessionState === 'active' ? 'Describe your action...' : 'Waiting for story...'}
            readOnly={sessionState !== 'active'} />
          <button type="button" className="ds3-input-bar-send" disabled={sessionState !== 'active'} aria-label="Send action">
            <Icons.ArrowUp size={18} />
          </button>
          {sessionState === 'active' && <span className="ds3-input-bar-counter">0 / 250</span>}
        </div>

        {/* Paused Overlay */}
        {sessionState === 'paused' && (
          <div className="ds3-overlay-frosted">
            <h3>Session Paused</h3>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="ds3-btn ds3-btn-primary ds3-btn-md" onClick={() => setSessionState('active')}>Resume</button>
              <button type="button" className="ds3-btn ds3-btn-ghost ds3-btn-md">End Session</button>
            </div>
          </div>
        )}

        {/* Journal Drawer */}
        {drawer === 'journal' && (
          <>
            <div className="ds3-drawer-overlay" onClick={() => setDrawer(null)} />
            <div className="ds3-drawer">
              <div className="ds3-drawer-header">
                <span className="ds3-drawer-title">Journal</span>
                <button type="button" className="ds3-drawer-close" onClick={() => setDrawer(null)} aria-label="Close journal"><Icons.X size={16} /></button>
              </div>
              <div className="ds3-drawer-body">
                {[
                  { time: '5 min ago', badge: 'Discovery', bc: 'var(--color-info)', bg: 'var(--color-info-bg)', text: 'Found Clara\'s dressing room untouched. Perfume on the vanity, a half-finished cigarette.' },
                  { time: '12 min ago', badge: 'Dialogue', bc: 'var(--color-accent)', bg: 'var(--color-accent-soft)', text: 'Sergeant Reyes warned me to drop the case. The club owner is connected.' },
                  { time: '20 min ago', badge: 'Decision', bc: 'var(--color-error)', bg: 'var(--color-error-bg)', text: 'Took the missing person case from Clara\'s manager despite the warning.' },
                  { time: 'Session start', badge: 'Quest', bc: 'var(--color-warning)', bg: 'var(--color-warning-bg)', text: 'Arrived at the Alibi Room to investigate Clara Duvall\'s disappearance.' },
                ].map((e, i) => (
                  <div key={i} className="ds3-journal-entry">
                    <div className="ds3-journal-time">{e.time} <span className="ds3-badge" style={{ background: e.bg, color: e.bc, marginLeft: 6 }}>{e.badge}</span></div>
                    <div className="ds3-journal-text">{e.text}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Inventory Drawer */}
        {drawer === 'inventory' && (
          <>
            <div className="ds3-drawer-overlay" onClick={() => setDrawer(null)} />
            <div className="ds3-drawer">
              <div className="ds3-drawer-header">
                <span className="ds3-drawer-title">Inventory</span>
                <button type="button" className="ds3-drawer-close" onClick={() => setDrawer(null)} aria-label="Close inventory"><Icons.X size={16} /></button>
              </div>
              <div className="ds3-drawer-body">
                {[
                  { name: 'Revolver', desc: 'Standard issue, well-oiled.' },
                  { name: 'Case File', desc: 'Clara Duvall — notes and photos.' },
                  { name: 'Matchbook', desc: 'From the Alibi Room. Address on the back.' },
                  { name: 'Lockpick Set', desc: 'Worn but reliable. 3 picks remain.' },
                ].map((item, i) => (
                  <div key={i} className="ds3-inv-item">
                    <img className="ds3-inv-img" src={`https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(item.name)}`} alt={item.name} />
                    <div><div className="ds3-inv-name">{item.name}</div><div className="ds3-inv-desc">{item.desc}</div></div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
