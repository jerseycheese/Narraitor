'use client';

import { useState, useEffect, useCallback } from 'react';
import './design-system-3.css';
import * as Icons from './icons';
import SessionDemo from './SessionDemo';
import { ComponentShowcase } from '../design-system/_ui/ComponentShowcase';
import { OverlayShowcase } from '../design-system/_ui/OverlayShowcase';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { useActiveSection } from '@/hooks/useActiveSection';

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
  const revealRef = useScrollReveal({ revealClass: 'ds3-reveal', visibleClass: 'ds3-visible', threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  const active = useActiveSection(NAV.map(s => s.id), { threshold: 0.15, rootMargin: '-10% 0px -60% 0px' });

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
          <details className="ds3-stage ds3-reveal">
            <summary className="ds3-stage-label" style={{ cursor: 'pointer', userSelect: 'none' }}>Brand Guidelines</summary>
            <pre style={{ fontFamily: 'var(--font-system)', fontSize: 13, lineHeight: 1.7, color: 'var(--color-text-secondary)', margin: '12px 0 0', whiteSpace: 'pre-wrap' }}>
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
          </details>
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
              { name: 'Default', width: '1200px (shell max-width)', purpose: 'General app pages and navigation' },
              { name: 'Dashboard', width: '1200px (3-col landing grid)', purpose: 'Library landing — full-width Continue + stat strip banners over a 3-col Recent / Getting Started row' },
            ].map(a => (
              <div key={a.name} className="ds3-stage ds3-reveal" style={{ padding: 20 }}>
                <div className="ds3-stage-label">{a.name}</div>
                <p style={{ fontFamily: 'var(--font-system)', fontSize: 12, color: 'var(--color-text-muted)', margin: '0 0 8px 0' }}>{a.width}</p>
                <p style={{ fontFamily: 'var(--font-narrative)', fontSize: 14, lineHeight: 1.65, color: 'var(--color-text-secondary)', margin: 0 }}>{a.purpose}</p>
              </div>
            ))}
          </div>

          {/* Canonical primitives introduced by the Dashboard archetype */}
          <h3 className="ds3-reveal" style={{ fontFamily: 'var(--font-narrative)', fontSize: 22, fontWeight: 500, margin: '8px 0 12px', color: 'var(--color-text-primary)' }}>Dashboard primitives</h3>
          <p className="ds3-reveal" style={{ fontFamily: 'var(--font-narrative)', fontSize: 14, lineHeight: 1.65, color: 'var(--color-text-secondary)', margin: '0 0 16px' }}>
            Three reusable patterns the Dashboard archetype contributes to the DS3 vocabulary. Compose them on any surface that wants the &ldquo;aged paper + drafting ink&rdquo; voice.
          </p>
          <div className="ds3-reveal" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 16 }}>

            {/* 1. Dot-grid tiled surface */}
            <div className="ds3-stage" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{
                position: 'relative',
                minHeight: 140,
                backgroundColor: 'var(--color-canvas)',
                backgroundImage: 'radial-gradient(circle, color-mix(in srgb, var(--color-text-primary) 18%, transparent) 1px, transparent 1px)',
                backgroundSize: '24px 24px',
                backgroundRepeat: 'repeat',
              }}>
                <div style={{
                  position: 'absolute',
                  inset: '20px',
                  background: 'var(--color-surface)',
                  borderRadius: 'var(--radius-md)',
                  padding: 12,
                  fontFamily: 'var(--font-system)',
                  fontSize: 11,
                  color: 'var(--color-text-muted)',
                  textAlign: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  Surface on dot-grid canvas
                </div>
              </div>
              <div style={{ padding: '14px 20px 18px' }}>
                <div className="ds3-stage-label">Dot-grid tiled surface</div>
                <p style={{ fontFamily: 'var(--font-narrative)', fontSize: 13, lineHeight: 1.6, color: 'var(--color-text-secondary)', margin: '6px 0 8px' }}>
                  Tile the canonical 2px-dot-every-24px pattern as a container background (sister to the fullscreen <code>.ds3-dot-grid</code> overlay).
                </p>
                <code className="font-system" style={{ fontFamily: 'var(--font-system)', fontSize: 11, color: 'var(--color-text-muted)', display: 'block', lineHeight: 1.5 }}>
                  background-image: radial-gradient(...);<br />background-size: 24px 24px;
                </code>
              </div>
            </div>

            {/* 2. Corner-bracket frame */}
            <div className="ds3-stage" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ position: 'relative', minHeight: 140, padding: 20, background: 'var(--color-canvas)' }}>
                <div style={{ position: 'relative', minHeight: 100, background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', padding: 14 }}>
                  <span style={{ position: 'absolute', top: 0, left: 0, width: 10, height: 10, borderTop: '1px solid var(--color-accent)', borderLeft: '1px solid var(--color-accent)' }} />
                  <span style={{ position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderBottom: '1px solid var(--color-accent)', borderRight: '1px solid var(--color-accent)' }} />
                  <div style={{ fontFamily: 'var(--font-system)', fontSize: 11, color: 'var(--color-text-muted)', textAlign: 'center', marginTop: 30 }}>
                    Framed panel
                  </div>
                </div>
              </div>
              <div style={{ padding: '14px 20px 18px' }}>
                <div className="ds3-stage-label">Corner-bracket frame</div>
                <p style={{ fontFamily: 'var(--font-narrative)', fontSize: 13, lineHeight: 1.6, color: 'var(--color-text-secondary)', margin: '6px 0 8px' }}>
                  Top-left and bottom-right 10px L-marks in <code>--color-accent</code> via <code>::before</code> / <code>::after</code>. A drafting-ink mark in place of a full border.
                </p>
                <code className="font-system" style={{ fontFamily: 'var(--font-system)', fontSize: 11, color: 'var(--color-text-muted)', display: 'block', lineHeight: 1.5 }}>
                  border-top: 1px solid var(--color-accent);<br />border-left: 1px solid var(--color-accent);
                </code>
              </div>
            </div>

            {/* 3. Compact stat strip */}
            <div className="ds3-stage" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ minHeight: 140, padding: 20, background: 'var(--color-canvas)', display: 'flex', alignItems: 'center' }}>
                <div style={{ width: '100%', display: 'flex', flexWrap: 'wrap', gap: '12px 32px', padding: '14px 18px', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)' }}>
                  {[['12', 'WORLDS'], ['8', 'CHARS'], ['3', 'PLAYS']].map(([n, l]) => (
                    <div key={l} style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                      <span style={{ fontFamily: 'var(--font-narrative)', fontSize: 28, lineHeight: 1, color: 'var(--color-text-primary)' }}>{n}</span>
                      <span style={{ fontFamily: 'var(--font-system)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>{l}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ padding: '14px 20px 18px' }}>
                <div className="ds3-stage-label">Compact stat strip</div>
                <p style={{ fontFamily: 'var(--font-narrative)', fontSize: 13, lineHeight: 1.6, color: 'var(--color-text-secondary)', margin: '6px 0 8px' }}>
                  Inline <em>[number] LABEL</em> triples in a single horizontal flex row, no tile chrome. The readout pattern for any summary panel.
                </p>
                <code className="font-system" style={{ fontFamily: 'var(--font-system)', fontSize: 11, color: 'var(--color-text-muted)', display: 'block', lineHeight: 1.5 }}>
                  display: flex; flex-wrap: wrap;<br />gap: var(--space-3) var(--space-6);
                </code>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ═══ TOKENS REFERENCE ═══ */}
      <section id="ds3-tokens" className="ds3-section">
        <div className="ds3-section-inner">
          <div className="ds3-section-number ds3-reveal">10 — Design Tokens</div>
          <h2 className="ds3-section-title ds3-reveal">Token Reference</h2>
          <p className="ds3-section-subtitle ds3-reveal">Every token with its resolved value.</p>
          <details className="ds3-reveal" style={{ overflowX: 'auto' }}>
            <summary style={{ fontFamily: 'var(--font-system)', fontSize: 12, color: 'var(--color-text-muted)', cursor: 'pointer', userSelect: 'none', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Show token reference table</summary>
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
          </details>
        </div>
      </section>

      {/* ═══ OVERLAY SYSTEM ═══ */}
      <section id="ds3-overlay" className="ds3-section">
        <div className="ds3-section-inner">
          <div className="ds3-section-number ds3-reveal">11 — Overlay</div>
          <h2 className="ds3-section-title ds3-reveal">Manuscript Overlay System</h2>
          <p className="ds3-section-subtitle ds3-reveal">
            The real <code>SimpleModal</code> and <code>PreviewModal</code> the app ships, themed by the Mechanical tokens.
          </p>
          <div className="ds3-reveal" style={{ marginBottom: 24 }}>
            <OverlayShowcase theme="ds3" />
          </div>
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
          <div className="ds3-reveal">
            <SessionDemo />
          </div>
        </div>
      </section>

      {/* ═══ COMPONENTS ═══ */}
      <section id="ds3-components" className="ds3-section">
        <div className="ds3-section-inner">
          <div className="ds3-section-number ds3-reveal">13 — Components</div>
          <h2 className="ds3-section-title ds3-reveal">Interactive States</h2>
          <p className="ds3-section-subtitle ds3-reveal">
            The real production primitives, themed by The Mechanical Manuscript tokens.
          </p>
          <ComponentShowcase theme="ds3" />
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

