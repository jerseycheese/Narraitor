'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import './design-system-3.css';
import * as Icons from './icons';

// ── Hooks ──────────────────────────────────────────────────────
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.querySelectorAll('.ds3-reveal').forEach(c => c.classList.add('ds3-visible'));
      return;
    }
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('ds3-visible'); });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    el.querySelectorAll('.ds3-reveal').forEach(c => obs.observe(c));
    return () => obs.disconnect();
  }, []);
  return ref;
}

function useActiveSection(ids: string[]) {
  const [active, setActive] = useState(ids[0]);
  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      const vis = entries.filter(e => e.isIntersecting);
      if (vis.length) {
        vis.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        setActive(vis[0].target.id);
      }
    }, { threshold: 0.15, rootMargin: '-10% 0px -60% 0px' });
    ids.forEach(id => { const el = document.getElementById(id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, [ids]);
  return active;
}

// ── Data ───────────────────────────────────────────────────────
const NAV = [
  { id: 'ds3-hero', label: 'Manuscript' },
  { id: 'ds3-brand', label: 'Brand' },
  { id: 'ds3-color', label: 'Colors' },
  { id: 'ds3-typography', label: 'Typography' },
  { id: 'ds3-spacing', label: 'Spacing' },
  { id: 'ds3-radius', label: 'Radius' },
  { id: 'ds3-elevation', label: 'Elevation' },
  { id: 'ds3-icons', label: 'Icons' },
  { id: 'ds3-grid', label: 'Grid' },
  { id: 'ds3-layout', label: 'Layout' },
  { id: 'ds3-tokens', label: 'Tokens' },
  { id: 'ds3-overlay', label: 'Overlay' },
  { id: 'ds3-session', label: 'Session' },
  { id: 'ds3-components', label: 'Components' },
];

const PALETTE = [
  { name: 'Canvas', hex: '#F7F3ED', role: 'canvas', dark: false },
  { name: 'Surface', hex: 'rgba(255,252,246,0.80)', role: 'surface', dark: false },
  { name: 'Surface Recessed', hex: '#EFE9E0', role: 'surface', dark: false },
  { name: 'Text Primary', hex: '#2A231C', role: 'text', dark: true },
  { name: 'Text Secondary', hex: '#736658', role: 'text', dark: true },
  { name: 'Text Muted', hex: '#A99D8F', role: 'text', dark: false },
  { name: 'Border', hex: '#E2D9CE', role: 'border', dark: false },
  { name: 'Accent', hex: '#5B7A8C', role: 'accent', dark: true },
  { name: 'Accent Hover', hex: '#4A6978', role: 'accent', dark: true },
  { name: 'Success', hex: '#4A7C59', role: 'semantic', dark: true },
  { name: 'Warning', hex: '#8C6D3F', role: 'semantic', dark: true },
  { name: 'Error', hex: '#9C4040', role: 'semantic', dark: true },
  { name: 'Info', hex: '#5B7A8C', role: 'semantic', dark: true },
];

const CONTRAST = [
  { bg: '#F7F3ED', fg: '#2A231C', label: 'Primary on Canvas', ratio: '11.2:1', pass: true },
  { bg: '#F7F3ED', fg: '#736658', label: 'Secondary on Canvas', ratio: '4.8:1', pass: true },
  { bg: '#F7F3ED', fg: '#A99D8F', label: 'Muted on Canvas', ratio: '2.8:1', pass: false },
  { bg: '#F7F3ED', fg: '#5B7A8C', label: 'Accent on Canvas', ratio: '4.1:1', pass: false },
  { bg: '#5B7A8C', fg: '#FFFFFF', label: 'White on Accent', ratio: '4.6:1', pass: true },
];

const SPACING = [8, 16, 24, 32, 48, 64];

const TYPE_ROWS = [
  { tag: 'Narrative body', family: 'var(--font-narrative)', size: '18px', lh: '1.75', weight: 400, sample: 'Rain hammered the sidewalk as the neon signs bled pink across the wet asphalt.' },
  { tag: 'Dialogue', family: 'var(--font-narrative)', size: '18px', lh: '1.75', weight: 400, sample: '\u201CYou shouldn\u2019t be asking about her,\u201D the bartender said quietly.', italic: true },
  { tag: 'Choice text', family: 'var(--font-interface)', size: '15px', lh: '1.5', weight: 500, sample: 'Search the dressing room for evidence' },
  { tag: 'System data', family: 'var(--font-system)', size: '13px', lh: '1.5', weight: 400, sample: 'INSTINCT 14 \u00B7 COMPOSURE 11 \u00B7 STREET SMARTS 16' },
  { tag: 'Interface', family: 'var(--font-interface)', size: '14px', lh: '1.5', weight: 500, sample: 'Select your next action' },
  { tag: 'Timestamps', family: 'var(--font-system)', size: '11px', lh: '1.4', weight: 400, sample: '3 MINUTES AGO', mono: true },
];

const ICON_LIST: [string, React.FC<{ size?: number; className?: string }>][] = [
  ['Pause', Icons.Pause], ['Play', Icons.Play], ['BookOpen', Icons.BookOpen],
  ['Backpack', Icons.Backpack], ['Settings', Icons.Settings], ['LogOut', Icons.LogOut],
  ['ArrowUp', Icons.ArrowUp], ['ChevronDown', Icons.ChevronDown], ['X', Icons.X],
];

// ── Page ───────────────────────────────────────────────────────
export default function DesignSystem3Page() {
  const [isDark, setIsDark] = useState(false);
  const [hudOpen, setHudOpen] = useState(false);
  const [drawer, setDrawer] = useState<string | null>(null);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [sessionState, setSessionState] = useState<string>('active');
  const revealRef = useScrollReveal();
  const active = useActiveSection(NAV.map(s => s.id));

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggleTheme = useCallback(() => {
    const html = document.documentElement;
    if (isDark) html.classList.remove('dark'); else html.classList.add('dark');
    setIsDark(!isDark);
  }, [isDark]);

  return (
    <div className="ds3 design-system-3-page" ref={revealRef}>
      {/* Skip link */}
      <a href="#ds3-main-content" className="ds3-skip-link">Skip to content</a>
      <div className="ds3-dot-grid" />

      {/* Nav */}
      <nav className="ds3-nav" aria-label="Design system sections">
        {NAV.map(s => (
          <a key={s.id} href={`#${s.id}`} className={`ds3-nav-item ${active === s.id ? 'ds3-nav-active' : ''}`}>
            <span className="ds3-nav-dot" /><span className="ds3-nav-label">{s.label}</span>
          </a>
        ))}
      </nav>

      <button className="ds3-theme-toggle" onClick={toggleTheme}>{isDark ? 'Light' : 'Dark'}</button>

      {/* ═══ HERO ═══ */}
      <section id="ds3-hero" className="ds3-hero">
        <div className="ds3-reveal"><p className="ds3-hero-meta">Narraitor Design System · The Mechanical Manuscript · 2026</p></div>
        <h1 className="ds3-hero-title ds3-reveal">The Mechanical Manuscript</h1>
        <div className="ds3-reveal">
          <p className="ds3-hero-meta" style={{ maxWidth: '44ch', textAlign: 'center', lineHeight: 1.7 }}>
            Where long-form digital journalism meets architectural drafting. The app is the drafting table. The story is the manuscript.
          </p>
        </div>
        <div className="ds3-hero-divider ds3-reveal" />
        <div className="ds3-hero-scroll ds3-reveal">Explore</div>
      </section>

      {/* ═══ DESIGN PHILOSOPHY ═══ */}
      <section className="ds3-section" style={{ paddingTop: 48, paddingBottom: 32 }}>
        <div className="ds3-section-inner">
          <div className="ds3-section-number ds3-reveal">00 — Design Philosophy</div>
          <h2 className="ds3-section-title ds3-reveal">Blueprint Precision, Manuscript Warmth</h2>
          <p className="ds3-section-subtitle ds3-reveal">
            The Mechanical Manuscript merges architectural drafting with literary publishing. Every element is placed on an 8px grid with blueprint precision, while the narrative reads with the warmth of aged parchment.
          </p>
          <div className="ds3-reveal" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            {[
              { title: 'DRAFTING TABLE', text: 'Dot grids, dashed borders, and monospace labels evoke technical drawings. The surface is the table; the story is the document.' },
              { title: 'GENRE-NEUTRAL', text: 'Aged parchment and ink tones frame any world — noir detective, deep-space station, or ancient kingdom — without imposing a genre.' },
              { title: 'MARGINALIA', text: 'Outcomes and technical data sit in the margins like editorial annotations, keeping the narrative column clean and immersive.' },
            ].map(c => (
              <div key={c.title} className="ds3-stage ds3-reveal" style={{ padding: 20 }}>
                <div className="ds3-stage-label">{c.title}</div>
                <p style={{ fontFamily: 'var(--font-narrative)', fontSize: 15, lineHeight: 1.65, color: 'var(--color-text-secondary)', margin: 0 }}>{c.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ BRAND IDENTITY ═══ */}
      <section id="ds3-brand" className="ds3-section">
        <div className="ds3-section-inner">
          <div className="ds3-section-number ds3-reveal">01 — Brand</div>
          <h2 className="ds3-section-title ds3-reveal">Narraitor</h2>
          <p className="ds3-section-subtitle ds3-reveal">
            Typography-driven brand identity. The logo lives in the type system, not as a locked graphic. Adaptable across the drafting-table aesthetic.
          </p>

          {/* Primary Wordmark */}
          <div className="ds3-stage ds3-reveal">
            <div className="ds3-stage-label">Primary Wordmark</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
              <h1 style={{ fontFamily: 'var(--font-narrative)', fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 400, letterSpacing: '-0.01em', color: 'var(--color-text-primary)', margin: 0 }}>
                Narr<span style={{ color: 'var(--color-accent)', fontWeight: 500 }}>ai</span>tor
              </h1>
            </div>
          </div>

          {/* Logo Variations */}
          <div className="ds3-stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 24 }}>
            <div className="ds3-stage ds3-reveal" style={{ textAlign: 'center', padding: 32 }}>
              <div className="ds3-stage-label" style={{ textAlign: 'left' }}>All Caps</div>
              <div style={{ fontFamily: 'var(--font-interface)', fontSize: '2rem', fontWeight: 700, letterSpacing: '0.02em', textTransform: 'uppercase', color: 'var(--color-text-primary)' }}>
                NARR<span style={{ color: 'var(--color-accent)' }}>AI</span>TOR
              </div>
            </div>
            <div className="ds3-stage ds3-reveal" style={{ textAlign: 'center', padding: 32 }}>
              <div className="ds3-stage-label" style={{ textAlign: 'left' }}>Monospace</div>
              <div style={{ fontFamily: 'var(--font-system)', fontSize: '1.5rem', fontWeight: 600, letterSpacing: '0.05em', color: 'var(--color-text-primary)' }}>
                NARR<span style={{ color: 'var(--color-accent)' }}>AI</span>TOR
              </div>
            </div>
            <div className="ds3-stage ds3-reveal" style={{ textAlign: 'center', padding: 32 }}>
              <div className="ds3-stage-label" style={{ textAlign: 'left' }}>Condensed</div>
              <div style={{ fontFamily: 'var(--font-narrative)', fontSize: '2.25rem', fontWeight: 500, letterSpacing: '-0.03em', color: 'var(--color-text-primary)' }}>
                Narr<span style={{ color: 'var(--color-accent)', fontWeight: 600 }}>ai</span>tor
              </div>
            </div>
          </div>

          {/* Usage Guidelines */}
          <div className="ds3-stage ds3-reveal">
            <div className="ds3-stage-label">Brand Guidelines</div>
            <pre style={{ fontFamily: 'var(--font-system)', fontSize: 13, lineHeight: 1.7, color: 'var(--color-text-secondary)', margin: 0, whiteSpace: 'pre-wrap' }}>
              {`/* Primary wordmark: Newsreader serif */
.narraitor-wordmark {
  font-family: 'Newsreader', serif;
  font-weight: 400;
  letter-spacing: -0.01em;
}

/* Accent the "ai" */
.narraitor-accent {
  color: var(--color-accent);
  font-weight: 500;
}

/* Minimum size: 24px for legibility */
/* Clear space: equal to cap height on all sides */`}
            </pre>
          </div>
        </div>
      </section>

      {/* ═══ COLOR PALETTE ═══ */}
      <section id="ds3-color" className="ds3-section">
        <div className="ds3-section-inner">
          <div className="ds3-section-number ds3-reveal">02 — Palette</div>
          <h2 className="ds3-section-title ds3-reveal">Aged Paper &amp; Drafting Ink</h2>
          <p className="ds3-section-subtitle ds3-reveal">
            Warm parchment canvas with rich ink tones. A single muted blueprint accent for interactivity. No Tailwind scales — every value is handpicked.
          </p>

          <div className="ds3-reveal" style={{ marginBottom: 48 }}>
            <div className="ds3-stage-label">Color Swatches</div>
            <div className="ds3-swatch-grid">
              {PALETTE.map(c => (
                <div key={c.name} className="ds3-swatch">
                  <div className="ds3-swatch-color" style={{ background: c.hex, color: c.dark ? '#F7F3ED' : '#2A231C' }}>
                    <span style={{ fontFamily: 'var(--font-system)', fontSize: 10, opacity: 0.8 }}>{c.role}</span>
                  </div>
                  <div className="ds3-swatch-info">
                    <div className="ds3-swatch-name">{c.name}</div>
                    <div className="ds3-swatch-hex">{c.hex}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="ds3-reveal">
            <div className="ds3-stage-label">Contrast Ratios (WCAG AA)</div>
            <div className="ds3-contrast-grid">
              {CONTRAST.map(c => (
                <div key={c.label} className="ds3-contrast-card" style={{ background: c.bg, color: c.fg }}>
                  <div className="ds3-contrast-sample">Readable text</div>
                  <div className={`ds3-contrast-meta ${c.pass ? 'ds3-contrast-pass' : 'ds3-contrast-fail'}`}>
                    {c.label}<br />{c.ratio} — {c.pass ? 'AA Pass ✓' : 'AA Fail ✗ (decorative only)'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ TYPOGRAPHY ═══ */}
      <section id="ds3-typography" className="ds3-section">
        <div className="ds3-section-inner">
          <div className="ds3-section-number ds3-reveal">03 — Typography</div>
          <h2 className="ds3-section-title ds3-reveal">Three Voices in Harmony</h2>
          <p className="ds3-section-subtitle ds3-reveal">
            Newsreader for literary warmth. Fira Code for technical precision. DM Sans for invisible interface chrome.
          </p>

          <div className="ds3-reveal" style={{ marginBottom: 48 }}>
            <div className="ds3-stage-label">Type Scale</div>
            {TYPE_ROWS.map(r => (
              <div key={r.tag} className="ds3-type-row">
                <span className="ds3-type-tag">{r.tag}</span>
                <span className="ds3-type-sample" style={{
                  fontFamily: r.family, fontSize: r.size, lineHeight: r.lh, fontWeight: r.weight,
                  fontStyle: r.italic ? 'italic' : 'normal',
                  letterSpacing: r.mono ? '0.05em' : undefined,
                  textTransform: r.mono ? 'uppercase' as const : undefined,
                }}>{r.sample}</span>
                <span className="ds3-type-meta">{r.size} / w{r.weight}</span>
              </div>
            ))}
          </div>

          <div className="ds3-stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            {[
              { label: 'Newsreader (Serif)', family: 'var(--font-narrative)', text: 'The jazz club exhaled smoke and regret into the damp night air.', sz: '18px', w: 400 },
              { label: 'Fira Code (Mono)', family: 'var(--font-system)', text: 'CASE 03 · STATUS: Active', sz: '13px', w: 400 },
              { label: 'DM Sans (Sans)', family: 'var(--font-interface)', text: 'Continue to Character Sheet', sz: '15px', w: 500 },
            ].map(f => (
              <div key={f.label} className="ds3-stage ds3-reveal">
                <div className="ds3-stage-label">{f.label}</div>
                <p style={{ fontFamily: f.family, fontSize: f.sz, fontWeight: f.w, lineHeight: 1.65, margin: 0 }}>{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ SPACING ═══ */}
      <section id="ds3-spacing" className="ds3-section">
        <div className="ds3-section-inner">
          <div className="ds3-section-number ds3-reveal">04 — Spacing</div>
          <h2 className="ds3-section-title ds3-reveal">8px Base Unit</h2>
          <p className="ds3-section-subtitle ds3-reveal">
            Every measurement derives from an 8px grid. Consistent, predictable spacing throughout.
          </p>

          <div className="ds3-reveal">
            <div className="ds3-stage-label">Spacing Scale</div>
            <div className="ds3-stage" style={{ padding: 24 }}>
              {SPACING.map(px => (
                <div key={px} className="ds3-spacing-row">
                  <span className="ds3-spacing-label">{px}px</span>
                  <div className="ds3-spacing-bar" style={{ width: px * 3 }} />
                  <span className="ds3-spacing-value">{px / 16}rem</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ RADIUS ═══ */}
      <section id="ds3-radius" className="ds3-section">
        <div className="ds3-section-inner">
          <div className="ds3-section-number ds3-reveal">05 — Border Radius</div>
          <h2 className="ds3-section-title ds3-reveal">Three Sizes</h2>
          <p className="ds3-section-subtitle ds3-reveal">4px for badges, 6px for buttons, 8px for cards and panels.</p>
          <div className="ds3-reveal">
            <div className="ds3-radius-grid">
              {[
                { name: 'Small — 4px', value: '4px', note: 'Badges, keyboard shortcuts' },
                { name: 'Medium — 6px', value: '6px', note: 'Buttons, inputs' },
                { name: 'Large — 8px', value: '8px', note: 'Cards, panels, drawers' },
              ].map(r => (
                <div key={r.name} className="ds3-stage ds3-radius-demo">
                  <div className="ds3-stage-label">{r.name}</div>
                  <div className="ds3-radius-shape" style={{ borderRadius: r.value }} />
                  <p style={{ fontFamily: 'var(--font-system)', fontSize: 11, color: 'var(--color-text-muted)', margin: 0 }}>{r.note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ ELEVATION ═══ */}
      <section id="ds3-elevation" className="ds3-section">
        <div className="ds3-section-inner">
          <div className="ds3-section-number ds3-reveal">06 — Elevation</div>
          <h2 className="ds3-section-title ds3-reveal">Shadow &amp; Blur</h2>
          <p className="ds3-section-subtitle ds3-reveal">Minimal elevation. Only floating HUD elements get shadows. Surface panels use backdrop blur.</p>
          <div className="ds3-reveal">
            <div className="ds3-elevation-grid">
              <div className="ds3-elevation-card" style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface-solid)' }}>
                <div className="ds3-elevation-label">Flat (cards, inline)</div>
              </div>
              <div className="ds3-elevation-card" style={{ boxShadow: 'var(--shadow-float)', background: 'var(--color-surface-solid)', border: '1px solid var(--color-border)' }}>
                <div className="ds3-elevation-label">Float (HUD)</div>
              </div>
              <div className="ds3-elevation-card" style={{ position: 'relative', overflow: 'hidden' }}>
                <div style={{
                  position: 'absolute', inset: 0,
                  backgroundImage: 'radial-gradient(circle, var(--grid-dot-color) 1px, transparent 1px)',
                  backgroundSize: '24px 24px', opacity: 0.3
                }} />
                <div style={{
                  position: 'relative', inset: 0, width: '100%', height: '100%',
                  background: 'var(--color-surface)', backdropFilter: 'blur(12px)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)',
                }}>
                  <div className="ds3-elevation-label">Blur (panels)</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ ICONS ═══ */}
      <section id="ds3-icons" className="ds3-section">
        <div className="ds3-section-inner">
          <div className="ds3-section-number ds3-reveal">07 — Icons</div>
          <h2 className="ds3-section-title ds3-reveal">Lucide · 18px · 1.5px Stroke</h2>
          <p className="ds3-section-subtitle ds3-reveal">Consistent, lightweight icons. Blueprint-weight strokes that match the drafting aesthetic.</p>
          <div className="ds3-reveal">
            <div className="ds3-icon-grid">
              {ICON_LIST.map(([name, Icon]) => (
                <div key={name} className="ds3-icon-card">
                  <Icon size={18} />
                  <span className="ds3-icon-card-name">{name}</span>
                </div>
              ))}
              <div className="ds3-icon-card ds3-icon-card-disabled">
                <Icons.Settings size={18} />
                <span className="ds3-icon-card-name">Disabled</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ GRID ═══ */}
      <section id="ds3-grid" className="ds3-section">
        <div className="ds3-section-inner">
          <div className="ds3-section-number ds3-reveal">08 — Grid</div>
          <h2 className="ds3-section-title ds3-reveal">Grid &amp; Breakpoints</h2>
          <p className="ds3-section-subtitle ds3-reveal">
            The 24px dot grid provides texture without competing. Standard responsive breakpoints with container widths optimized for reading.
          </p>

          <div className="ds3-reveal" style={{ marginBottom: 48 }}>
            <div className="ds3-stage-label">Dot Grid Pattern (24px intervals)</div>
            <div style={{ height: 160, borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', position: 'relative', overflow: 'hidden' }}>
              <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: 'radial-gradient(circle, var(--grid-dot-color) 1px, transparent 1px)',
                backgroundSize: '24px 24px', opacity: 0.3,
              }} />
              <div style={{ position: 'relative', zIndex: 1, padding: 32, maxWidth: 480 }}>
                <p style={{ fontFamily: 'var(--font-narrative)', fontSize: 17, lineHeight: 1.75, margin: 0 }}>
                  Content scrolls over the fixed dot grid. The grid provides subtle texture — a drafting table surface beneath the manuscript.
                </p>
              </div>
            </div>
          </div>

          <div className="ds3-reveal">
            <div className="ds3-stage-label">Breakpoints</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'sm', width: '640px', desc: 'Small devices' },
                { label: 'md', width: '768px', desc: 'Tablets' },
                { label: 'lg', width: '1024px', desc: 'Laptops' },
                { label: 'xl', width: '1280px', desc: 'Desktops — navigation appears' },
                { label: '2xl', width: '1536px', desc: 'Large screens' },
              ].map(({ label, width, desc }) => (
                <div key={label} className="ds3-stage" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px' }}>
                  <span style={{ fontFamily: 'var(--font-system)', fontSize: 13, fontWeight: 600, color: 'var(--color-accent)', width: '3rem' }}>{label}</span>
                  <span style={{ fontFamily: 'var(--font-system)', fontSize: 13, color: 'var(--color-text-primary)', width: '5rem', fontWeight: 600 }}>{width}</span>
                  <span style={{ fontFamily: 'var(--font-system)', fontSize: 12, color: 'var(--color-text-muted)' }}>{desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ LAYOUT PATTERNS ═══ */}
      <section id="ds3-layout" className="ds3-section">
        <div className="ds3-section-inner">
          <div className="ds3-section-number ds3-reveal">09 — Layout</div>
          <h2 className="ds3-section-title ds3-reveal">Layout Archetypes</h2>
          <p className="ds3-section-subtitle ds3-reveal">
            Three foundational layout archetypes drive the application. Each archetype defines a distinct content density and navigation model.
          </p>
          <div className="ds3-reveal" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 24 }}>
            {[
              { name: 'Manuscript', width: '680px (narrative region)', purpose: 'Immersive game play — single-column reading with marginalia annotations' },
              { name: 'Workshop', width: '1200px (full-width grid)', purpose: 'World and character management, settings, and configuration' },
              { name: 'Default', width: '1200px (shell max-width)', purpose: 'General app pages, dashboard, and navigation' },
            ].map(a => (
              <div key={a.name} className="ds3-stage ds3-reveal" style={{ padding: 20 }}>
                <div className="ds3-stage-label">{a.name}</div>
                <p style={{ fontFamily: 'var(--font-system)', fontSize: 12, color: 'var(--color-text-muted)', margin: '0 0 8px 0' }}>{a.width}</p>
                <p style={{ fontFamily: 'var(--font-narrative)', fontSize: 14, lineHeight: 1.65, color: 'var(--color-text-secondary)', margin: 0 }}>{a.purpose}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TOKENS REFERENCE ═══ */}
      <section id="ds3-tokens" className="ds3-section">
        <div className="ds3-section-inner">
          <div className="ds3-section-number ds3-reveal">10 — Design Tokens</div>
          <h2 className="ds3-section-title ds3-reveal">Token Reference</h2>
          <p className="ds3-section-subtitle ds3-reveal">Every token with its resolved value.</p>
          <div className="ds3-reveal" style={{ overflowX: 'auto' }}>
            <table className="ds3-token-table">
              <thead><tr><th>Token</th><th>Value</th><th>Sample</th></tr></thead>
              <tbody>
                {[
                  ['--canvas-light', '#F7F3ED', '#F7F3ED'],
                  ['--canvas-dark', '#171310', '#171310'],
                  ['--surface-light', 'rgba(255,252,246,0.80)', '#FFFCF6'],
                  ['--surface-dark', 'rgba(30,26,22,0.80)', '#1E1A16'],
                  ['--text-primary', '#2A231C / #EDE8E0', '#2A231C'],
                  ['--text-secondary', '#736658 / #A89C8E', '#736658'],
                  ['--text-muted', '#A99D8F / #6B6057', '#A99D8F'],
                  ['--border', '#E2D9CE / #302923', '#E2D9CE'],
                  ['--accent', '#5B7A8C / #7BA0B4', '#5B7A8C'],
                  ['--accent-hover', '#4A6978 / #8DB1C3', '#4A6978'],
                  ['--radius-sm', '4px', null],
                  ['--radius-md', '6px', null],
                  ['--radius-lg', '8px', null],
                  ['--blur', '12px', null],
                  ['--shadow-float', '0 1px 3px rgba(0,0,0,0.08)', null],
                  ['--font-narrative', 'Newsreader, serif', null],
                  ['--font-system', 'Fira Code, monospace', null],
                  ['--font-interface', 'DM Sans, sans-serif', null],
                  ['--grid-dot-size', '2px', null],
                  ['--grid-dot-spacing', '24px', null],
                  ['--grid-dot-opacity', '0.3', null],
                ].map(([token, value, swatch]) => (
                  <tr key={token as string}>
                    <td style={{ fontWeight: 500 }}>{token}</td>
                    <td>{value}</td>
                    <td>{swatch ? <span className="ds3-token-swatch" style={{ background: swatch as string }} /> : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ═══ OVERLAY SYSTEM ═══ */}
      <section id="ds3-overlay" className="ds3-section">
        <div className="ds3-section-inner">
          <div className="ds3-section-number ds3-reveal">11 — Overlay</div>
          <h2 className="ds3-section-title ds3-reveal">Manuscript Overlay System</h2>
          <p className="ds3-section-subtitle ds3-reveal">
            Floating panels and overlays use backdrop blur and surface tints to maintain context while presenting supplementary information.
          </p>
          <div className="ds3-reveal" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16, marginBottom: 24 }}>
            {[
              { name: 'Character Sheet', desc: 'Floating panel that slides in from the side. Semi-transparent backdrop with blur, anchored to the manuscript edge.', blur: '16px', bg: 'rgba(255,252,246,0.90)' },
              { name: 'Tools Panel', desc: 'Utility overlay for quick actions — dice rolling, journal notes, map reference. Positioned opposite the character sheet.', blur: '20px', bg: 'rgba(255,252,246,0.95)' },
              { name: 'Scrim', desc: 'Full-page darkening layer for modal dialogs and confirmation prompts. Dims content without hiding it.', blur: '0', bg: 'rgba(42,35,28,0.35)' },
            ].map(o => (
              <div key={o.name} className="ds3-stage ds3-reveal" style={{ padding: 20 }}>
                <div className="ds3-stage-label">{o.name}</div>
                <p style={{ fontFamily: 'var(--font-narrative)', fontSize: 14, lineHeight: 1.65, color: 'var(--color-text-secondary)', margin: '0 0 12px 0' }}>{o.desc}</p>
                <div style={{ display: 'flex', gap: 16 }}>
                  <span style={{ fontFamily: 'var(--font-system)', fontSize: 11, color: 'var(--color-text-muted)' }}>blur: {o.blur}</span>
                  <span style={{ fontFamily: 'var(--font-system)', fontSize: 11, color: 'var(--color-text-muted)' }}>bg: {o.bg}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ GAME SESSION DEMO ═══ */}
      <section id="ds3-session" className="ds3-section">
        <div id="ds3-main-content" className="ds3-section-inner" style={{ maxWidth: 1100 }}>
          <div className="ds3-section-number ds3-reveal">12 — Game Session</div>
          <h2 className="ds3-section-title ds3-reveal">Composition Demo</h2>
          <p className="ds3-section-subtitle ds3-reveal">
            All components composed into the actual gameplay interface. A real scene with narrative, choices, HUD, and drawers.
          </p>

          {/* State switcher */}
          <div className="ds3-reveal" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
            {['active', 'streaming', 'loading', 'error', 'paused'].map(s => (
              <button key={s} type="button" className={`ds3-btn ${sessionState === s ? 'ds3-btn-primary' : 'ds3-btn-secondary'} ds3-btn-sm`}
                onClick={() => { setSessionState(s); setDrawer(null); setHudOpen(false); setSelectedChoice(null); }}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>

          {/* Session Shell */}
          <div className="ds3-session ds3-reveal" style={{ minHeight: 680 }}>
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
        </div>
      </section>

      {/* ═══ COMPONENTS ═══ */}
      <section id="ds3-components" className="ds3-section">
        <div className="ds3-section-inner">
          <div className="ds3-section-number ds3-reveal">13 — Components</div>
          <h2 className="ds3-section-title ds3-reveal">Interactive States</h2>
          <p className="ds3-section-subtitle ds3-reveal">Every component shown with all its states. Realistic RPG labels, not placeholder text.</p>

          {/* Buttons */}
          <div className="ds3-stage ds3-reveal" style={{ marginBottom: 24 }}>
            <div className="ds3-stage-label">Buttons</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginBottom: 16 }}>
              <button type="button" className="ds3-btn ds3-btn-primary ds3-btn-md">Send Action</button>
              <button type="button" className="ds3-btn ds3-btn-secondary ds3-btn-md">View Journal</button>
              <button type="button" className="ds3-btn ds3-btn-ghost ds3-btn-md">Cancel</button>
              <button type="button" className="ds3-btn ds3-btn-icon" aria-label="Settings"><Icons.Settings size={18} /></button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginBottom: 16 }}>
              <button type="button" className="ds3-btn ds3-btn-primary ds3-btn-sm">Small</button>
              <button type="button" className="ds3-btn ds3-btn-primary ds3-btn-md">Medium</button>
              <button type="button" className="ds3-btn ds3-btn-primary ds3-btn-lg">Large</button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
              <button type="button" className="ds3-btn ds3-btn-primary ds3-btn-md" disabled>Disabled</button>
              <button type="button" className="ds3-btn ds3-btn-primary ds3-btn-md ds3-btn-loading">Loading</button>
            </div>
          </div>

          {/* Inputs */}
          <div className="ds3-stage ds3-reveal" style={{ marginBottom: 24 }}>
            <div className="ds3-stage-label">Inputs</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
              <div className="ds3-input-wrap">
                <label className="ds3-input-label">Character Name</label>
                <input className="ds3-input" type="text" defaultValue="Marlowe Vance" />
              </div>
              <div className="ds3-input-wrap">
                <label className="ds3-input-label">Custom Action</label>
                <input className="ds3-input" type="text" placeholder="Describe your action..." />
                <div className="ds3-input-counter">0 / 250</div>
              </div>
              <div className="ds3-input-wrap">
                <label className="ds3-input-label">Background</label>
                <input className="ds3-input ds3-input-error" type="text" defaultValue="" />
                <div className="ds3-input-error-msg">Character background is required</div>
              </div>
              <div className="ds3-input-wrap">
                <label className="ds3-input-label">Class (Disabled)</label>
                <input className="ds3-input" type="text" disabled defaultValue="Locked during session" />
              </div>
            </div>
          </div>

          {/* Badges */}
          <div className="ds3-stage ds3-reveal" style={{ marginBottom: 24 }}>
            <div className="ds3-stage-label">Badges</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {[
                { label: 'Discovery', bg: 'var(--color-info-bg)', color: 'var(--color-info)' },
                { label: 'Combat', bg: 'var(--color-error-bg)', color: 'var(--color-error)' },
                { label: 'Dialogue', bg: 'var(--color-accent-soft)', color: 'var(--color-accent)' },
                { label: 'Quest', bg: 'var(--color-warning-bg)', color: 'var(--color-warning)' },
                { label: 'Healthy', bg: 'var(--color-success-bg)', color: 'var(--color-success)' },
              ].map(b => (
                <span key={b.label} className="ds3-badge" style={{ background: b.bg, color: b.color }}>{b.label}</span>
              ))}
            </div>
          </div>

          {/* Alerts */}
          <div className="ds3-stage ds3-reveal" style={{ marginBottom: 24 }}>
            <div className="ds3-stage-label">Alerts</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="ds3-alert ds3-alert-error"><Icons.AlertCircle size={18} /><span>Connection lost. Your progress may not be saved.</span></div>
              <div className="ds3-alert ds3-alert-info"><Icons.Info size={18} /><span>Your perception check revealed hidden tracks leading east.</span></div>
              <div className="ds3-alert ds3-alert-success"><Icons.CheckCircle size={18} /><span>Session saved successfully.</span></div>
              <div className="ds3-alert ds3-alert-warning"><Icons.AlertTriangle size={18} /><span>Low health may reduce combat effectiveness.</span></div>
            </div>
          </div>

          {/* Choice Cards */}
          <div className="ds3-stage ds3-reveal" style={{ marginBottom: 24 }}>
            <div className="ds3-stage-label">Choice Cards</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 560 }}>
              <button type="button" className="ds3-choice" style={{ '--accent-bar': '#7A8B6F' } as React.CSSProperties} onClick={() => { }}>
                <div className="ds3-choice-kbd">1</div>
                <div className="ds3-choice-text">Search the dressing room for evidence</div>
                <div className="ds3-choice-hint">Requires: Investigation 3+</div>
              </button>
              <button type="button" className="ds3-choice ds3-choice-selected" style={{ '--accent-bar': '#8C7B5B' } as React.CSSProperties}>
                <div className="ds3-choice-kbd">2</div>
                <div className="ds3-choice-text">Press the bartender about Clara&rsquo;s last night</div>
                <div className="ds3-choice-hint">Uses: Interrogation</div>
              </button>
              <button type="button" className="ds3-choice" disabled>
                <div className="ds3-choice-kbd">3</div>
                <div className="ds3-choice-text">Pick the lock on Deluca&rsquo;s office door</div>
                <div className="ds3-choice-hint">Requires: Lockpicking 5+ (locked)</div>
              </button>
            </div>
          </div>

          {/* Drawer Demos */}
          <div className="ds3-stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 24 }}>
            <div className="ds3-reveal">
              <div className="ds3-stage-label">Drawer — Desktop (Right Slide)</div>
              <div className="ds3-drawer ds3-drawer-inline">
                <div className="ds3-drawer-header">
                  <span className="ds3-drawer-title">Journal</span>
                  <button type="button" className="ds3-drawer-close" aria-label="Close drawer"><Icons.X size={16} /></button>
                </div>
                <div className="ds3-drawer-body">
                  {[
                    { time: '5 min ago', badge: 'Discovery', badgeColor: 'var(--color-info)', badgeBg: 'var(--color-info-bg)', text: 'Found Clara\'s dressing room untouched. Perfume on the vanity, a half-finished cigarette.' },
                    { time: '12 min ago', badge: 'Dialogue', badgeColor: 'var(--color-accent)', badgeBg: 'var(--color-accent-soft)', text: 'Sergeant Reyes warned me to drop the case. The club owner is connected.' },
                    { time: '20 min ago', badge: 'Decision', badgeColor: 'var(--color-error)', badgeBg: 'var(--color-error-bg)', text: 'Took the missing person case from Clara\'s manager despite the warning.' },
                  ].map((e, i) => (
                    <div key={i} className="ds3-journal-entry">
                      <div className="ds3-journal-time">
                        {e.time}
                        <span className="ds3-badge" style={{ background: e.badgeBg, color: e.badgeColor, marginLeft: 8 }}>{e.badge}</span>
                      </div>
                      <div className="ds3-journal-text">{e.text}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="ds3-reveal">
              <div className="ds3-stage-label">Drawer — Mobile (Bottom Sheet)</div>
              <div className="ds3-bottom-sheet">
                <div className="ds3-drawer-header">
                  <span className="ds3-drawer-title">Inventory</span>
                  <button type="button" className="ds3-drawer-close" aria-label="Close drawer"><Icons.X size={16} /></button>
                </div>
                <div className="ds3-drawer-body">
                  {[
                    { name: 'Iron Shortsword', desc: 'A reliable blade.' },
                    { name: 'Leather Shield', desc: 'Basic protection.' },
                    { name: 'Old Map', desc: 'Shows the northern region.' },
                  ].map((item, i) => (
                    <div key={i} className="ds3-inv-item">
                      <img className="ds3-inv-img" src={`https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(item.name)}`} alt={item.name} />
                      <div><div className="ds3-inv-name">{item.name}</div><div className="ds3-inv-desc">{item.desc}</div></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* HUD Panels */}
        <div className="ds3-stage ds3-reveal">
          <div className="ds3-stage-label">HUD Panels</div>
          <div className="ds3-hud-demo">
            <div>
              <div style={{ marginBottom: 12, fontFamily: 'var(--font-system)', fontSize: 10, color: 'var(--color-text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Collapsed (pill)</div>
              <div className="ds3-hud-pill" style={{ cursor: 'default' }}>
                Marlowe
              </div>
            </div>
            <div>
              <div style={{ marginBottom: 12, fontFamily: 'var(--font-system)', fontSize: 10, color: 'var(--color-text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Expanded (panel)</div>
              <div className="ds3-hud-panel" style={{ position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--color-accent-soft)', border: '1.5px solid var(--color-accent)' }} />
                  <div>
                    <div className="ds3-hud-name">Marlowe Vance</div>
                    <div className="ds3-hud-level">Level 4</div>
                  </div>
                </div>
                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 8, marginBottom: 8 }}>
                  {[['Instinct', '14'], ['Composure', '11'], ['Street Smarts', '16'], ['Cunning', '10']].map(([k, v]) => (
                    <div key={k} className="ds3-hud-stat-row">
                      <span className="ds3-hud-stat-label">{k}</span>
                      <span className="ds3-hud-stat-value">{v}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <span className="ds3-badge" style={{ background: 'var(--color-success-bg)', color: 'var(--color-success)' }}>Focused</span>
                  <span className="ds3-badge" style={{ background: 'var(--color-warning-bg)', color: 'var(--color-warning)' }}>Fatigued</span>
                </div>
                <div className="ds3-hud-location" style={{ marginTop: 8 }}>The Alibi Room — Back Bar</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <div className="ds3-reveal" style={{ marginTop: 96, padding: '48px 0', textAlign: 'center', borderTop: '1px solid var(--color-border)', position: 'relative', zIndex: 1 }}>
        <div className="ds3-hero-divider" />
        <p style={{ fontFamily: 'var(--font-system)', fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 500 }}>
          Narraitor Design System — The Mechanical Manuscript — End of Document
        </p>
      </div>
    </div>
  );
}

