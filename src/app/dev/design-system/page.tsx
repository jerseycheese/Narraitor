'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Globe, Users, Play, Sparkles } from 'lucide-react';
import { primitiveColors } from '@/lib/design-tokens';
import ManuscriptDemo from './ManuscriptDemo';
import './design-system.css';

// ---------------------------------------------------------------------------
// Scroll Reveal Hook
// ---------------------------------------------------------------------------
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      el.querySelectorAll('.ds1-reveal').forEach(c => c.classList.add('ds1-visible'));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('ds1-visible'); }),
      { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
    );
    el.querySelectorAll('.ds1-reveal').forEach(c => observer.observe(c));
    return () => observer.disconnect();
  }, []);
  return ref;
}

// ---------------------------------------------------------------------------
// Active Section Tracking Hook
// ---------------------------------------------------------------------------
function useActiveSection(ids: string[]) {
  const [active, setActive] = useState(ids[0]);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) setActive(visible[0].target.id);
      },
      { rootMargin: '-20% 0px -60% 0px' }
    );
    ids.forEach(id => { const el = document.getElementById(id); if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, [ids]);
  return active;
}
// ---------------------------------------------------------------------------
// Helper: Color Swatch
// ---------------------------------------------------------------------------
function Swatch({ color, name, hex, note }: { color: string; name: string; hex: string; note?: string }) {
  const needsBorder = ['#fafafa', '#ffffff', '#f4f4f5'].includes(color.toLowerCase());
  return (
    <div className="design-system-swatch">
      <div
        style={{
          height: 60,
          borderRadius: 4,
          background: color,
          border: needsBorder ? '1px solid var(--color-border)' : 'none',
        }}
      />
      <div style={{ marginTop: 8 }}>
        <div className="font-system" style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-primary)' }}>{name}</div>
        <div className="font-system" style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{hex}</div>
        {note && <div style={{ fontSize: 12, marginTop: 4, color: 'var(--color-text-muted)' }}>{note}</div>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helper: Small swatch card for the full zinc grid
// ---------------------------------------------------------------------------
function ZincCard({ stop, hex }: { stop: string; hex: string }) {
  return (
    <div style={{ padding: 8, borderRadius: 2, background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
      <div style={{ height: 32, borderRadius: 2, background: hex, border: hex === '#fafafa' ? '1px solid var(--color-border)' : 'none' }} />
      <div className="font-system" style={{ fontSize: 12, marginTop: 8, color: 'var(--color-text-primary)' }}>zinc-{stop}</div>
      <div className="font-system" style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{hex}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section wrapper
// ---------------------------------------------------------------------------
function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} style={{ borderBottom: '1px solid var(--color-border)', padding: '48px 0' }}>
      <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 24, color: 'var(--color-text-primary)', fontFamily: 'var(--font-interface)' }}>{title}</h2>
      {children}
    </section>
  );
}

function SubSection({ title, description, children }: { title?: string; description?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 32 }}>
      {title && <h3 style={{ fontSize: 18, fontWeight: 500, marginBottom: 8, color: 'var(--color-text-primary)', fontFamily: 'var(--font-interface)' }}>{title}</h3>}
      {description && <p style={{ fontSize: 14, marginBottom: 16, color: 'var(--color-text-secondary)' }}>{description}</p>}
      {children}
    </div>
  );
}

const PHILOSOPHY_CARDS: Array<{ title: string; description: string }> = [
  {
    title: 'THE CONCEPT',
    description: 'The Drafting Table. A fusion of long-form digital journalism and architectural drafting. The app is the drafting table; the story is the manuscript. Genre-neutral by design.',
  },
  {
    title: 'THE GOAL',
    description: 'A "blank canvas" that feels premium and intentional. It does not compete with the AI\'s genre; it frames it.',
  },
  {
    title: 'NEUTRALITY',
    description: 'Use a "Paper & Ink" palette with a single functional accent color for interactions.',
  },
];

const RADIUS_SCALE: Array<{ name: string; value: string; note: string }> = [
  { name: 'none', value: '0px', note: 'Dot grid, technical elements' },
  { name: 'rounded-sm', value: '2px', note: 'Default for most UI' },
  { name: 'rounded', value: '4px', note: 'Buttons, inputs' },
  { name: 'rounded-lg', value: '8px', note: 'Cards, modals' },
];

const ELEVATION_SCALE: Array<{ name: string; value: string; note: string; shadow: string }> = [
  { name: 'shadow-sm', value: '0 1px 2px rgba(0,0,0,0.05)', note: 'Subtle depth for cards', shadow: '0 1px 2px rgba(0,0,0,0.05)' },
  { name: 'shadow-md', value: '0 4px 6px rgba(0,0,0,0.1)', note: 'Dropdowns, tooltips', shadow: '0 4px 6px -1px rgba(0,0,0,0.1)' },
  { name: 'shadow-lg', value: '0 10px 15px rgba(0,0,0,0.1)', note: 'Modals, floating panels', shadow: '0 10px 15px -3px rgba(0,0,0,0.1)' },
];

const ICON_SIZE_SCALE: Array<{ size: number; label: string; note: string; icon: LucideIcon }> = [
  { size: 16, label: '16px', note: 'Inline text', icon: Sparkles },
  { size: 20, label: '20px', note: 'Standard', icon: Globe },
  { size: 24, label: '24px', note: 'Buttons', icon: Play },
  { size: 32, label: '32px', note: 'Hero/empty states', icon: Users },
];

const BREAKPOINTS: Array<{ label: string; width: string; note: string }> = [
  { label: 'sm', width: '640px', note: 'Small devices' },
  { label: 'md', width: '768px', note: 'Tablets' },
  { label: 'lg', width: '1024px', note: 'Laptops' },
  { label: 'xl', width: '1280px', note: 'Desktops' },
  { label: '2xl', width: '1536px', note: 'Large screens' },
];

const CONTAINER_WIDTHS: Array<{ title: string; rows: Array<{ label: string; value: string }> }> = [
  {
    title: 'MANUSCRIPT (Narrative)',
    rows: [
      { label: 'Optimal reading width', value: '768px (max-w-3xl)' },
      { label: 'Characters per line', value: '45-90' },
    ],
  },
  {
    title: 'WORKSHOP (Utility)',
    rows: [
      { label: 'Content width', value: '1024px (max-w-5xl)' },
      { label: 'Full width', value: '1280px (max-w-7xl)' },
    ],
  },
  {
    title: 'DEFAULT (Home & Content)',
    rows: [
      { label: 'Content width', value: '1200px (shell max-width)' },
      { label: 'Purpose', value: 'General app pages and dashboard' },
    ],
  },
];

const TYPE_ROWS = [
  { tag: 'Narrative body', family: 'var(--font-narrative)', size: '18px', lh: '1.75', weight: 400, sample: 'The manuscript breathed as you opened it, each line settling into place like ink finding paper.' },
  { tag: 'Dialogue', family: 'var(--font-narrative)', size: '18px', lh: '1.75', weight: 400, sample: '\u201CEvery story deserves a sanctuary,\u201D the archivist whispered.', italic: true },
  { tag: 'Choice text', family: 'var(--font-interface)', size: '15px', lh: '1.5', weight: 500, sample: 'Examine the faded blueprint on the drafting table' },
  { tag: 'System data', family: 'var(--font-system)', size: '13px', lh: '1.5', weight: 400, sample: 'PRECISION 15 \u00B7 FOCUS 12 \u00B7 CRAFT 18' },
  { tag: 'Interface', family: 'var(--font-interface)', size: '14px', lh: '1.5', weight: 500, sample: 'Continue to Character Sheet' },
  { tag: 'HUD values', family: 'var(--font-system)', size: '16px', lh: '1.4', weight: 600, sample: 'HP 38/45' },
  { tag: 'Timestamps', family: 'var(--font-system)', size: '11px', lh: '1.4', weight: 400, sample: '2 MINUTES AGO', mono: true },
];

const CONTRAST = [
  { bg: '#FAFAFA', fg: '#18181B', label: 'Primary on Canvas', ratio: '18.3:1', pass: true },
  { bg: '#FAFAFA', fg: '#52525B', label: 'Secondary on Canvas', ratio: '10.1:1', pass: true },
  { bg: '#FAFAFA', fg: '#A1A1AA', label: 'Muted on Canvas', ratio: '4.7:1', pass: true },
  { bg: '#18181B', fg: '#FFFFFF', label: 'White on Accent', ratio: '11.4:1', pass: true },
  { bg: '#FAFAFA', fg: '#065F46', label: 'Success on Canvas', ratio: '7.4:1', pass: true },
  { bg: '#FAFAFA', fg: '#9F1239', label: 'Error on Canvas', ratio: '7.8:1', pass: true },
];

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------
const NAV_SECTIONS = [
  { id: 'ds1-hero', label: 'The Drafting Table' },
  { id: 'ds1-brand', label: 'Brand' },
  { id: 'ds1-colors', label: 'Colors' },
  { id: 'ds1-typography', label: 'Typography' },
  { id: 'ds1-spacing', label: 'Spacing' },
  { id: 'ds1-radius', label: 'Radius' },
  { id: 'ds1-elevation', label: 'Elevation' },
  { id: 'ds1-icons', label: 'Icons' },
  { id: 'ds1-grid', label: 'Grid' },
  { id: 'ds1-layout', label: 'Layout' },
  { id: 'ds1-variables', label: 'Variables' },
  { id: 'ds1-overlay', label: 'Overlay' },
  { id: 'ds1-session', label: 'Session' },
  { id: 'ds1-components', label: 'Components' },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function DesignSystemPage() {
  const [isDark, setIsDark] = useState(false);
  const revealRef = useScrollReveal();
  const activeSection = useActiveSection(NAV_SECTIONS.map(s => s.id));

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggleTheme = useCallback(() => {
    const html = document.documentElement;
    if (isDark) html.classList.remove('dark'); else html.classList.add('dark');
    setIsDark(!isDark);
  }, [isDark]);

  return (
    <div className="design-system-page" style={{ position: 'relative', overflow: 'hidden' }} ref={revealRef}>
      {/* Skip link */}
      <a href="#ds1-main-content" className="ds1-skip-link">Skip to content</a>

      {/* Floating Navigation */}
      <nav className="ds1-nav" aria-label="Design system sections">
        {NAV_SECTIONS.map(section => (
          <a key={section.id} href={`#${section.id}`} className={`ds1-nav-item ${activeSection === section.id ? 'ds1-nav-active' : ''}`}>
            <span className="ds1-nav-dot" />
            <span className="ds1-nav-label">{section.label}</span>
          </a>
        ))}
      </nav>

      {/* Theme Toggle */}
      <button className="ds1-theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
        {isDark ? 'Light' : 'Dark'}
      </button>

      {/* ═══ HERO ═══ */}
      <section id="ds1-hero" className="ds1-hero">
        <div className="ds1-reveal"><p className="ds1-hero-meta">Narraitor Design System · The Drafting Table · 2026</p></div>
        <h1 className="ds1-hero-title ds1-reveal">The Drafting Table</h1>
        <div className="ds1-reveal">
          <p className="ds1-hero-meta" style={{ maxWidth: '44ch', textAlign: 'center', lineHeight: 1.7 }}>
            A fusion of long-form digital journalism and architectural drafting. The app is the drafting table. The story is the manuscript.
          </p>
        </div>
        <div className="ds1-hero-divider ds1-reveal" />
        <div className="ds1-hero-scroll ds1-reveal">Explore        </div>
      </section>

      {/* ═══ DESIGN PHILOSOPHY ═══ */}
      <section className="ds1-section" style={{ paddingTop: 48, paddingBottom: 32 }}>
        <div className="ds1-section-inner">
          <div className="ds1-section-number ds1-reveal">00 — Design Philosophy</div>
          <h2 className="ds1-section-title ds1-reveal">Paper & Ink Neutrality</h2>
          <p className="ds1-section-subtitle ds1-reveal">
            The Drafting Table is a blank canvas that feels premium and intentional. It does not compete with the AI&rsquo;s genre; it frames it. Sharp lines, crisp technical typography, and a Paper &amp; Ink palette with a single functional accent.
          </p>
          <div className="ds1-stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            {PHILOSOPHY_CARDS.map(card => (
              <div key={card.title} className="ds1-stage ds1-reveal" style={{ padding: 20 }}>
                <div className="ds1-stage-label">{card.title}</div>
                <p style={{ fontFamily: 'var(--font-interface)', fontSize: 14, lineHeight: 1.65, color: 'var(--color-text-secondary)', margin: 0 }}>{card.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ BRAND IDENTITY ═══ */}
      <section id="ds1-brand" className="ds1-section">
        <div className="ds1-section-inner">
          <div className="ds1-section-number ds1-reveal">01 — Brand</div>
          <h2 className="ds1-section-title ds1-reveal">Brand Identity</h2>
          <p className="ds1-section-subtitle ds1-reveal">Typography-driven brand identity that adapts to different contexts while maintaining recognition.</p>
          <div style={{ padding: '64px 32px', background: 'linear-gradient(135deg, #fdfbf7 0%, #fafafa 100%)', borderRadius: 4, marginBottom: 24, textAlign: 'center' }}>
            <h1 style={{ fontFamily: 'var(--font-narrative)', fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 400, letterSpacing: '-0.01em', color: 'var(--color-text-primary)', margin: 0 }}>
              Narr<span style={{ color: 'var(--color-accent)', fontWeight: 500 }}>ai</span>tor
            </h1>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 24 }}>
            <div style={{ padding: 32, borderRadius: 2, border: '1px solid var(--color-border)', background: 'var(--color-surface)', textAlign: 'center' }}>
              <div className="font-system" style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 16 }}>All Caps</div>
              <div style={{ fontFamily: 'var(--font-interface)', fontSize: '2rem', fontWeight: 700, letterSpacing: '0.02em', textTransform: 'uppercase', color: 'var(--color-text-primary)' }}>
                NARR<span style={{ color: 'var(--color-accent)' }}>AI</span>TOR
              </div>
            </div>
            <div style={{ padding: 32, borderRadius: 2, border: '1px solid var(--color-border)', background: 'var(--color-surface)', textAlign: 'center' }}>
              <div className="font-system" style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 16 }}>Monospace</div>
              <div style={{ fontFamily: 'var(--font-system)', fontSize: '1.5rem', fontWeight: 600, letterSpacing: '0.05em', color: 'var(--color-text-primary)' }}>
                NARR<span style={{ color: 'var(--color-accent)' }}>AI</span>TOR
              </div>
            </div>
            <div style={{ padding: 32, borderRadius: 2, border: '1px solid var(--color-border)', background: 'var(--color-surface)', textAlign: 'center' }}>
              <div className="font-system" style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 16 }}>Condensed</div>
              <div style={{ fontFamily: 'var(--font-narrative)', fontSize: '2.25rem', fontWeight: 500, letterSpacing: '-0.03em', color: 'var(--color-text-primary)' }}>
                Narr<span style={{ color: 'var(--color-accent)', fontWeight: 600 }}>ai</span>tor
              </div>
            </div>
          </div>

          <div style={{ padding: 24, borderRadius: 2, border: '1px solid var(--color-border)', background: 'var(--color-surface-hover)' }}>
            <div className="font-system" style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 12 }}>Brand Guidelines</div>
            <pre className="font-system" style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--color-text-secondary)', margin: 0, whiteSpace: 'pre-wrap' }}>
              {`/* Primary wordmark: Lora serif */
.narraitor-wordmark {
  font-family: 'Lora', serif;
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

      {/* ================================================================= */}
      {/* COLORS                                                            */}
      {/* ================================================================= */}
      <section id="ds1-colors" className="ds1-section">
        <div className="ds1-section-inner">
          <div className="ds1-section-number ds1-reveal">02 — Colors</div>
          <h2 className="ds1-section-title ds1-reveal">Color Palette</h2>
          <div style={{ marginBottom: 32 }}>
            <h3 className="font-interface" style={{ fontSize: 18, fontWeight: 500, marginBottom: 8, color: 'var(--color-text-primary)' }}>Base Colors</h3>
            <p style={{ fontSize: 14, marginBottom: 16, color: 'var(--color-text-secondary)' }}>Core surface and border colors used across the app.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 16 }}>
              <Swatch color="#fafafa" name="zinc-50" hex="#fafafa" note="Canvas (light)" />
              <Swatch color="#ffffff" name="white" hex="#ffffff" note="Surfaces" />
              <Swatch color="#f4f4f5" name="zinc-100" hex="#f4f4f5" note="Hover states" />
              <Swatch color="#e4e4e7" name="zinc-200" hex="#e4e4e7" note="Borders" />
              <Swatch color="#d4d4d8" name="zinc-300" hex="#d4d4d8" note="Input borders" />
            </div>
          </div>
          <div style={{ marginBottom: 32 }}>
            <h3 className="font-interface" style={{ fontSize: 18, fontWeight: 500, marginBottom: 8, color: 'var(--color-text-primary)' }}>Full Zinc Neutral Scale</h3>
            <p style={{ fontSize: 14, marginBottom: 16, color: 'var(--color-text-secondary)' }}>Complete neutral ramp used for surfaces, typography, borders, and dark mode tokens.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 12 }}>
              {Object.entries(primitiveColors.zinc).map(([stop, hex]) => (
                <ZincCard key={stop} stop={stop} hex={hex} />
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 32 }}>
            <h3 className="font-interface" style={{ fontSize: 18, fontWeight: 500, marginBottom: 8, color: 'var(--color-text-primary)' }}>Text Colors</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 16 }}>
              <Swatch color="#111111" name="Charcoal" hex="#111111" note="Primary text" />
              <Swatch color={primitiveColors.zinc[700]} name="zinc-700" hex={primitiveColors.zinc[700]} note="Secondary text" />
              <Swatch color={primitiveColors.zinc[500]} name="zinc-500" hex={primitiveColors.zinc[500]} note="Muted text" />
            </div>
          </div>
          <div style={{ marginBottom: 32 }}>
            <h3 className="font-interface" style={{ fontSize: 18, fontWeight: 500, marginBottom: 8, color: 'var(--color-text-primary)' }}>Accent Color (Archival Ink)</h3>
            <p style={{ fontSize: 14, marginBottom: 16, color: 'var(--color-text-secondary)' }}>Single functional accent for interactions. Uses CSS variable so it adapts to theme.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 16 }}>
              <div className="design-system-swatch">
                <div
                  style={{
                    height: 60,
                    borderRadius: 4,
                    background: 'var(--color-accent)',
                  }}
                />
                <div style={{ marginTop: 8 }}>
                  <div className="font-system" style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-primary)' }}>Accent</div>
                  <div className="font-system" style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Light: #312e81 / Dark: #818cf8</div>
                  <div style={{ fontSize: 12, marginTop: 4, color: 'var(--color-text-muted)' }}>Primary actions</div>
                </div>
              </div>
              <div className="design-system-swatch">
                <div
                  style={{
                    height: 60,
                    borderRadius: 4,
                    background: 'var(--color-accent-hover)',
                  }}
                />
                <div style={{ marginTop: 8 }}>
                  <div className="font-system" style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-primary)' }}>Accent Hover</div>
                  <div className="font-system" style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Light: #1e1b4b / Dark: #a5b4fc</div>
                  <div style={{ fontSize: 12, marginTop: 4, color: 'var(--color-text-muted)' }}>Hover/active states</div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 32 }}>
            <h3 className="font-interface" style={{ fontSize: 18, fontWeight: 500, marginBottom: 8, color: 'var(--color-text-primary)' }}>Link Styling</h3>
            <p style={{ fontSize: 14, marginBottom: 16, color: 'var(--color-text-secondary)' }}>Global anchor styling using the accent token. Underline with offset for readability.</p>
            <div style={{ padding: 24, borderRadius: 2, border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <div className="font-system" style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 8 }}>DEFAULT</div>
                <p style={{ fontSize: 16, color: 'var(--color-text-primary)' }}>
                  Visit the <a href="#colors">color palette</a> or check the <a href="#typography">typography scale</a> for reference.
                </p>
              </div>
              <div>
                <div className="font-system" style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 8 }}>IN NARRATIVE CONTEXT</div>
                <p className="text-narrative" style={{ maxWidth: 768 }}>
                  The archivist pointed to the <a href="#components">Registry of Lost Names</a>, its binding cracked but legible.
                </p>
              </div>
              <div>
                <div className="font-system" style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 8 }}>CSS RULE</div>
                <pre
                  className="font-system"
                  style={{
                    fontSize: 12,
                    lineHeight: 1.6,
                    color: 'var(--color-text-secondary)',
                    background: 'var(--color-surface-hover)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 4,
                    padding: 16,
                  }}
                >
                  {`a {
  color: var(--color-accent);
  text-decoration: underline;
  text-underline-offset: 2px;
  transition: color 0.15s;
}

a:hover {
  color: var(--color-accent-hover);
}`}
                </pre>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 32 }}>
            <h3 className="font-interface" style={{ fontSize: 18, fontWeight: 500, marginBottom: 8, color: 'var(--color-text-primary)' }}>Semantic Colors</h3>
            <p style={{ fontSize: 14, marginBottom: 16, color: 'var(--color-text-secondary)' }}>Status and feedback colors.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 16 }}>
              <Swatch color="#065f46" name="emerald-800" hex="#065f46" note="Success" />
              <Swatch color="#9f1239" name="rose-800" hex="#9f1239" note="Error" />
              <Swatch color="#92400e" name="amber-800" hex="#92400e" note="Warning" />
              <Swatch color="#075985" name="sky-800" hex="#075985" note="Info" />
            </div>
          </div>
          <div style={{ marginBottom: 32 }}>
            <h3 className="font-interface" style={{ fontSize: 18, fontWeight: 500, marginBottom: 8, color: 'var(--color-text-primary)' }}>Contrast Ratios (WCAG AA)</h3>
            <p style={{ fontSize: 14, marginBottom: 16, color: 'var(--color-text-secondary)' }}>Live bg/fg color samples with measured ratios. Re-check exact pairs in WebAIM before production.</p>
            <div className="ds1-contrast-grid">
              {CONTRAST.map(c => (
                <div key={c.label} className="ds1-contrast-card" style={{ background: c.bg, color: c.fg }}>
                  <div className="ds1-contrast-sample">Readable text</div>
                  <div className={`ds1-contrast-meta ${c.pass ? 'ds1-contrast-pass' : 'ds1-contrast-fail'}`}>
                    {c.label}<br />{c.ratio} — {c.pass ? 'AA Pass' : 'AA Fail (decorative only)'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* TYPOGRAPHY                                                        */}
      {/* ================================================================= */}
      <section id="ds1-typography" className="ds1-section">
        <div className="ds1-section-inner">
          <div className="ds1-section-number ds1-reveal">03 — Typography</div>
          <h2 className="ds1-section-title ds1-reveal">Typography</h2>

          <div className="ds1-reveal" style={{ marginBottom: 48 }}>
            <div className="ds1-stage-label">Type Scale</div>
            {TYPE_ROWS.map(r => (
              <div key={r.tag} className="ds1-type-row">
                <span className="ds1-type-tag">{r.tag}</span>
                <span className="ds1-type-sample" style={{
                  fontFamily: r.family, fontSize: r.size, lineHeight: r.lh, fontWeight: r.weight,
                  fontStyle: r.italic ? 'italic' : 'normal',
                  letterSpacing: r.mono ? '0.05em' : undefined,
                  textTransform: r.mono ? 'uppercase' as const : undefined,
                }}>{r.sample}</span>
                <span className="ds1-type-meta">{r.size} / w{r.weight}</span>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: 32 }}>
            <h3 className="font-interface" style={{ fontSize: 18, fontWeight: 500, marginBottom: 8, color: 'var(--color-text-primary)' }}>Font Families</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
              {/* Narrative */}
              <div style={{ padding: 16, borderRadius: 2, border: '1px solid var(--color-border)' }}>
                <div className="font-system" style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Narrative</div>
                <div className="font-narrative" style={{ fontSize: 24, color: 'var(--color-text-primary)', marginBottom: 4 }}>The old library stretched before you</div>
                <div className="font-narrative" style={{ fontSize: 18, lineHeight: 1.75, color: 'var(--color-text-secondary)', marginBottom: 8 }}>Used for all AI-generated narration</div>
                <code style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>font-family: &apos;Lora&apos;, serif</code>
              </div>

              {/* System */}
              <div style={{ padding: 16, borderRadius: 2, border: '1px solid var(--color-border)' }}>
                <div className="font-system" style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>System</div>
                <div className="font-system" style={{ fontSize: 24, color: 'var(--color-text-primary)', marginBottom: 4 }}>HP: 42/50 -- TURN 14</div>
                <div className="font-system" style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 8 }}>Stats, labels, metadata, and technical text</div>
                <code style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>font-family: &apos;IBM Plex Mono&apos;, monospace</code>
              </div>

              {/* Interface */}
              <div style={{ padding: 16, borderRadius: 2, border: '1px solid var(--color-border)' }}>
                <div className="font-system" style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Interface</div>
                <div className="font-interface" style={{ fontSize: 24, color: 'var(--color-text-primary)', marginBottom: 4 }}>Continue to Character Attributes</div>
                <div className="font-interface" style={{ fontSize: 16, color: 'var(--color-text-secondary)', marginBottom: 8 }}>Buttons, navigation, forms, and UI chrome</div>
                <code style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>font-family: &apos;IBM Plex Sans&apos;, sans-serif</code>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 32 }}>
            <h3 className="font-interface" style={{ fontSize: 18, fontWeight: 500, marginBottom: 8, color: 'var(--color-text-primary)' }}>Typography Roles</h3>
            <p style={{ fontSize: 14, marginBottom: 16, color: 'var(--color-text-secondary)' }}>Role-based typography utilities map semantic intent to font and rhythm.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ padding: 16, borderRadius: 2, border: '1px solid var(--color-border)' }}>
                <div className="font-system" style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 8 }}>text-narrative</div>
                <p className="text-narrative" style={{ maxWidth: 768 }}>The manuscript breathed as you opened it, each line settling into place like ink finding paper.</p>
              </div>
              <div style={{ padding: 16, borderRadius: 2, border: '1px solid var(--color-border)' }}>
                <div className="font-system" style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 8 }}>text-technical</div>
                <p className="text-technical">Turn: 14 -- Hp: 42/50 -- Save Slot: Auto-3</p>
              </div>
              <div style={{ padding: 16, borderRadius: 2, border: '1px solid var(--color-border)' }}>
                <div className="font-system" style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 8 }}>text-ui</div>
                <p className="text-ui">Continue to Character Attributes</p>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 32 }}>
            <h3 className="font-interface" style={{ fontSize: 18, fontWeight: 500, marginBottom: 8, color: 'var(--color-text-primary)' }}>Heading Scale</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 16, borderRadius: 2, border: '1px solid var(--color-border)' }}>
              {[
                { tag: 'h1', size: '2.25rem / 36px', weight: 600, lineHeight: 1.1 },
                { tag: 'h2', size: '1.875rem / 30px', weight: 600, lineHeight: 1.1 },
                { tag: 'h3', size: '1.5rem / 24px', weight: 600, lineHeight: 1.2 },
                { tag: 'h4', size: '1.25rem / 20px', weight: 600, lineHeight: 1.2 },
                { tag: 'h5', size: '1.125rem / 18px', weight: 500, lineHeight: 1.2 },
                { tag: 'h6', size: '1rem / 16px', weight: 500, lineHeight: 1.2 },
              ].map(({ tag, size, weight, lineHeight }) => (
                <div key={tag} style={{ display: 'flex', alignItems: 'baseline', gap: 16, borderBottom: '1px solid var(--color-border)', paddingBottom: 12 }}>
                  <div className="font-system" style={{ fontSize: 12, color: 'var(--color-text-muted)', width: 32, flexShrink: 0 }}>{tag}</div>
                  <div className="font-interface" style={{ fontSize: size.split(' / ')[0], fontWeight: weight, lineHeight, color: 'var(--color-text-primary)' }}>
                    Heading Level {tag.slice(1)}
                  </div>
                  <div className="font-system" style={{ fontSize: 11, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                    {size} -- weight {weight} -- lh {lineHeight}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 32 }}>
            <h3 className="font-interface" style={{ fontSize: 18, fontWeight: 500, marginBottom: 8, color: 'var(--color-text-primary)' }}>Body Text</h3>
            <p style={{ fontSize: 14, marginBottom: 16, color: 'var(--color-text-secondary)' }}>Narrative paragraph at reading width.</p>
            <div style={{ maxWidth: 768, padding: 24, borderRadius: 2, border: '1px solid var(--color-border)' }}>
              <p className="text-narrative" style={{ marginBottom: 16 }}>
                The brass lock clicked once, then twice, and the archive doors gave way just enough for candlelight to leak through the seam.
              </p>
              <p className="text-narrative" style={{ marginBottom: 16 }}>
                You stepped into the chamber and felt the temperature drop. Shelves climbed three stories high, each packed with ledgers stitched in faded cloth. Above, suspended rails traced the ceiling like constellations of iron, and every few seconds a distant mechanism clattered, then fell quiet again.
              </p>
              <p className="text-narrative">
                A metal desk stood in the center under a cone of light. Its surface was scarred with compass marks and ink circles, and a copper plaque on the edge read: &quot;Records of Irrecoverable Histories.&quot;
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* SPACING                                                           */}
      {/* ================================================================= */}
      <section id="ds1-spacing" className="ds1-section">
        <div className="ds1-section-inner">
          <div className="ds1-section-number ds1-reveal">04 — Spacing</div>
          <h2 className="ds1-section-title ds1-reveal">Spacing Scale</h2>
          <div style={{ marginBottom: 32 }}>
            <p style={{ fontSize: 14, marginBottom: 16, color: "var(--color-text-secondary)" }}>Base unit: 24px. Scale derived from 4px grid.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[4, 8, 16, 24, 32, 48, 64, 96].map((px) => (
                <div key={px} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div className="font-system" style={{ fontSize: 12, color: 'var(--color-text-muted)', width: 48, textAlign: 'right', flexShrink: 0 }}>{px}px</div>
                  <div style={{ width: px, height: 16, background: 'var(--color-text-muted)', borderRadius: 2, flexShrink: 0 }} />
                  <div className="font-system" style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{px / 16}rem</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* BORDER RADIUS                                                     */}
      {/* ================================================================= */}
      <section id="ds1-radius" className="ds1-section">
        <div className="ds1-section-inner">
          <div className="ds1-section-number ds1-reveal">05 — Radius</div>
          <h2 className="ds1-section-title ds1-reveal">Border Radius</h2>
          <div style={{ marginBottom: 32 }}>
            <p style={{ fontSize: 14, marginBottom: 16, color: "var(--color-text-secondary)" }}>Minimal rounding to maintain crisp, technical aesthetic.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
              {RADIUS_SCALE.map((item) => (
                <div key={item.name} style={{ textAlign: 'center' }}>
                  <div style={{ width: 80, height: 80, margin: '0 auto', background: 'var(--color-accent)', borderRadius: item.value }} />
                  <div style={{ marginTop: 12 }}>
                    <div className="font-system" style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-primary)' }}>{item.name}</div>
                    <code style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{item.value}</code>
                    <div style={{ fontSize: 12, marginTop: 4, color: 'var(--color-text-muted)' }}>{item.note}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 32 }}>
            <div style={{ padding: 16, borderRadius: 2, background: 'var(--color-surface-hover)', border: '1px solid var(--color-border)' }}>
              <h4 className="font-system" style={{ fontSize: 12, marginBottom: 8, color: 'var(--color-text-muted)' }}>DEFAULT</h4>
              <p style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>
                Use <code>rounded-sm (2px)</code> as the default throughout the system. This maintains a technical, precise aesthetic while avoiding harsh 90 degree corners.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* ELEVATION                                                         */}
      {/* ================================================================= */}
      <section id="ds1-elevation" className="ds1-section">
        <div className="ds1-section-inner">
          <div className="ds1-section-number ds1-reveal">06 — Elevation</div>
          <h2 className="ds1-section-title ds1-reveal">Elevation & Shadows</h2>
          <div style={{ marginBottom: 32 }}>
            <p style={{ fontSize: 14, marginBottom: 16, color: "var(--color-text-secondary)" }}>Minimal shadow system for creating depth hierarchy. Use sparingly to maintain the drafting-table aesthetic.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24 }}>
              {ELEVATION_SCALE.map((item) => (
                <div key={item.name}>
                  <div style={{ padding: 32, borderRadius: 2, background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: item.shadow }} />
                  <div style={{ marginTop: 12 }}>
                    <div className="font-system" style={{ fontSize: 12, fontWeight: 500, marginBottom: 4, color: 'var(--color-text-primary)' }}>{item.name}</div>
                    <code style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{item.value}</code>
                    <div style={{ fontSize: 12, marginTop: 4, color: 'var(--color-text-muted)' }}>{item.note}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 32 }}>
            <div style={{ padding: 16, borderRadius: 2, background: 'var(--color-surface-hover)', border: '1px solid var(--color-border)' }}>
              <h4 className="font-system" style={{ fontSize: 12, marginBottom: 8, color: 'var(--color-text-muted)' }}>USAGE NOTE</h4>
              <p style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>
                Prefer <code>backdrop-blur</code> and borders over shadows for HUD panels. Use shadows only for floating elements that need clear separation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* ICONOGRAPHY                                                       */}
      {/* ================================================================= */}
      <section id="ds1-icons" className="ds1-section">
        <div className="ds1-section-inner">
          <div className="ds1-section-number ds1-reveal">07 — Icons</div>
          <h2 className="ds1-section-title ds1-reveal">Iconography</h2>
          <div style={{ marginBottom: 32 }}>
            <p style={{ fontSize: 14, marginBottom: 16, color: "var(--color-text-secondary)" }}>Using Lucide icons with consistent sizing and stroke weight.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
              {ICON_SIZE_SCALE.map(({ size, label, note, icon: Icon }) => (
                <div key={label} style={{ padding: 16, borderRadius: 2, textAlign: 'center', background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                  <Icon size={size} strokeWidth={1.5} aria-hidden="true" style={{ margin: '0 auto 8px', color: 'var(--color-text-primary)' }} />
                  <div className="font-system" style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{label}</div>
                  <div style={{ fontSize: 12, marginTop: 4, color: 'var(--color-text-muted)' }}>{note}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 32 }}>
            <div style={{ padding: 16, borderRadius: 2, background: 'var(--color-surface-hover)', border: '1px solid var(--color-border)' }}>
              <h4 className="font-system" style={{ fontSize: 12, marginBottom: 12, color: 'var(--color-text-muted)' }}>GUIDELINES</h4>
              <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14, color: 'var(--color-text-secondary)' }}>
                <li>Stroke weight: <code>1.5px</code> (Lucide standard)</li>
                <li>Use icons to support text, not replace it.</li>
                <li>Always include <code>aria-label</code> for icon-only buttons.</li>
                <li>Icons inherit text color by default.</li>
                <li>Use <code>aria-hidden=&quot;true&quot;</code> for decorative icons.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* GRID & BREAKPOINTS                                                */}
      {/* ================================================================= */}
      <section id="ds1-grid" className="ds1-section">
        <div className="ds1-section-inner">
          <div className="ds1-section-number ds1-reveal">08 — Grid</div>
          <h2 className="ds1-section-title ds1-reveal">Grid & Breakpoints</h2>
          <div style={{ marginBottom: 32 }}>
            <p style={{ fontSize: 14, marginBottom: 16, color: "var(--color-text-secondary)" }}>Responsive layout structure based on a 12-column grid with standardized breakpoints.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {BREAKPOINTS.map((item) => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 2, background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                  <div>
                    <div className="font-system" style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>{item.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{item.note}</div>
                  </div>
                  <code className="font-system" style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{item.width}</code>
                </div>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 32 }}>
            <h3 className="font-interface" style={{ fontSize: 18, fontWeight: 500, marginBottom: 8, color: 'var(--color-text-primary)' }}>Container Widths</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              {CONTAINER_WIDTHS.map((container) => (
                <div key={container.title} style={{ padding: 16, borderRadius: 2, background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                  <div className="font-system" style={{ fontSize: 12, marginBottom: 12, color: 'var(--color-text-muted)' }}>{container.title}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {container.rows.map((row) => (
                      <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, fontSize: 13, color: 'var(--color-text-secondary)' }}>
                        <span>{row.label}</span>
                        <code>{row.value}</code>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* LAYOUT PATTERNS                                                   */}
      {/* ================================================================= */}
      <section id="ds1-layout" className="ds1-section">
        <div className="ds1-section-inner">
          <div className="ds1-section-number ds1-reveal">09 — Layout</div>
          <h2 className="ds1-section-title ds1-reveal">Layout Patterns</h2>
          <div style={{ marginBottom: 32 }}>
            <p style={{ fontSize: 14, marginBottom: 16, color: "var(--color-text-secondary)" }}>The app uses three foundational layout archetypes: Default for general app pages, Manuscript for immersive play, and Workshop for utility-heavy world/character management.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
              <div style={{ border: '1px solid var(--color-border)', borderRadius: 4, overflow: 'hidden', background: 'var(--color-surface)' }}>
                <div style={{ padding: 12, borderBottom: '1px solid var(--color-border)' }}>
                  <h3 style={{ margin: 0, fontSize: 16, color: 'var(--color-text-primary)' }}>Manuscript (Game Session)</h3>
                  <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--color-text-secondary)' }}>
                    Single-column narrative with floating HUD and docked action rail.
                  </p>
                </div>
                <div style={{ padding: 12, background: 'var(--color-surface-hover)' }}>
                  <div style={{ border: '1px solid var(--color-border)', borderRadius: 2, padding: 12, minHeight: 180, background: 'var(--color-surface)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 11, color: 'var(--color-text-muted)' }}>
                      <span>HUD (floating)</span>
                      <span>Tools</span>
                    </div>
                    <div style={{ margin: '0 auto 12px', width: 'min(100%, 420px)', border: '1px solid var(--color-border)', borderRadius: 2, padding: 8, fontSize: 12, color: 'var(--color-text-secondary)' }}>
                      Narrative column (max-w-3xl)
                    </div>
                    <div style={{ border: '1px solid var(--color-border)', borderRadius: 2, padding: 8, fontSize: 11, color: 'var(--color-text-muted)' }}>
                      Docked action/input rail
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ border: '1px solid var(--color-border)', borderRadius: 4, overflow: 'hidden', background: 'var(--color-surface)' }}>
                <div style={{ padding: 12, borderBottom: '1px solid var(--color-border)' }}>
                  <h3 style={{ margin: 0, fontSize: 16, color: 'var(--color-text-primary)' }}>Workshop (Library & Wizards)</h3>
                  <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--color-text-secondary)' }}>
                    Sidebar navigation plus workspace content area for forms and management.
                  </p>
                </div>
                <div style={{ padding: 12, background: 'var(--color-surface-hover)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', minHeight: 180, border: '1px solid var(--color-border)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ padding: 10, borderRight: '1px solid var(--color-border)', background: 'var(--color-surface-hover)', fontSize: 11, color: 'var(--color-text-muted)' }}>
                      Sidebar rail
                      <div style={{ marginTop: 8, display: 'grid', gap: 6 }}>
                        <div style={{ border: '1px solid var(--color-border)', borderRadius: 2, padding: '4px 6px', background: 'var(--color-surface)' }}>Worlds</div>
                        <div style={{ border: '1px solid var(--color-border)', borderRadius: 2, padding: '4px 6px', background: 'var(--color-surface)' }}>Characters</div>
                        <div style={{ border: '1px solid var(--color-border)', borderRadius: 2, padding: '4px 6px', background: 'var(--color-surface)' }}>Settings</div>
                      </div>
                    </div>
                    <div style={{ padding: 12, background: 'var(--color-surface)' }}>
                      <div style={{ border: '1px solid var(--color-border)', borderRadius: 2, padding: 8, fontSize: 12, color: 'var(--color-text-secondary)' }}>
                        Workspace content (max-w-5xl / 1024px)
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ border: '1px solid var(--color-border)', borderRadius: 4, overflow: 'hidden', background: 'var(--color-surface)' }}>
                <div style={{ padding: 12, borderBottom: '1px solid var(--color-border)' }}>
                  <h3 style={{ margin: 0, fontSize: 16, color: 'var(--color-text-primary)' }}>Default (Home & Content Pages)</h3>
                  <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--color-text-secondary)' }}>
                    Header navigation with a centered content workspace for broad app pages.
                  </p>
                </div>
                <div style={{ padding: 12, background: 'var(--color-surface-hover)' }}>
                  <div style={{ border: '1px solid var(--color-border)', borderRadius: 2, minHeight: 180, overflow: 'hidden', background: 'var(--color-surface)' }}>
                    <div style={{ borderBottom: '1px solid var(--color-border)', padding: '8px 10px', fontSize: 11, color: 'var(--color-text-muted)' }}>
                      Header navigation
                    </div>
                    <div style={{ padding: 12 }}>
                      <div style={{ margin: '0 auto', width: '100%', maxWidth: 240, border: '1px solid var(--color-border)', borderRadius: 2, padding: '4px 8px', fontSize: 11, color: 'var(--color-text-muted)', textAlign: 'center' }}>
                        max-width: 1200px shell
                      </div>
                      <div style={{ marginTop: 8, border: '1px solid var(--color-border)', borderRadius: 2, minHeight: 96, padding: 10, fontSize: 12, color: 'var(--color-text-secondary)' }}>
                        Dashboard and general content modules
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 32 }}>
            <h3 className="font-interface" style={{ fontSize: 18, fontWeight: 500, marginBottom: 8, color: 'var(--color-text-primary)' }}>Responsive Adaptation</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
              <div style={{ padding: 12, border: '1px solid var(--color-border)', borderRadius: 4, background: 'var(--color-surface)' }}>
                <h4 className="font-system" style={{ margin: 0, fontSize: 12, color: 'var(--color-text-muted)' }}>MOBILE (&lt;768px)</h4>
                <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--color-text-secondary)' }}>
                  Sidebar collapses to a menu trigger; workspace runs full-width.
                </p>
              </div>
              <div style={{ padding: 12, border: '1px solid var(--color-border)', borderRadius: 4, background: 'var(--color-surface)' }}>
                <h4 className="font-system" style={{ margin: 0, fontSize: 12, color: 'var(--color-text-muted)' }}>DESKTOP (&ge;768px)</h4>
                <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--color-text-secondary)' }}>
                  Sidebar remains visible and scrollable; workspace constrained to 1024px.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* CSS VARIABLES                                                     */}
      {/* ================================================================= */}
      <section id="ds1-variables" className="ds1-section">
        <div className="ds1-section-inner">
          <div className="ds1-section-number ds1-reveal">10 — Variables</div>
          <h2 className="ds1-section-title ds1-reveal">CSS Variables</h2>
          <div style={{ marginBottom: 32 }}>
            <p style={{ fontSize: 14, marginBottom: 16, color: "var(--color-text-secondary)" }}>Current custom property definitions from globals.css. These drive both the shadcn layer and the design system layer.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24 }}>
              <div>
                <h4 className="font-system" style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>:root (Light)</h4>
                <pre
                  className="font-system"
                  tabIndex={0}
                  role="region"
                  aria-label="Light theme CSS variable definitions"
                  style={{
                    fontSize: 12,
                    lineHeight: 1.6,
                    color: 'var(--color-text-secondary)',
                    background: 'var(--color-surface-hover)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 4,
                    padding: 16,
                    overflow: 'auto',
                    maxHeight: 480,
                  }}
                >
                  {`:root {/* Typography tokens */
  --font-narrative: 'Lora', serif;
  --font-system: 'IBM Plex Mono', monospace;
  --font-interface: 'IBM Plex Sans', sans-serif;

  /* Color tokens (zinc-based) */
  --color-canvas: #fdfbf7;
  --color-surface: #ffffff;
  --color-surface-hover: #f4f4f5;
  --color-border: #e4e4e7;
  --color-border-strong: #d4d4d8;
  --color-text-primary: #111111;
  --color-text-secondary: #3f3f46;
  --color-text-muted: #71717a;

  /* Accent (Archival Ink) */
  --color-accent: #312e81;
  --color-accent-hover: #1e1b4b;

  /* shadcn tokens (HSL) */
  --background: 0 0% 100%;
  --foreground: 240 5.9% 10%;
  --primary: 221.2 83.2% 44.3%;
  --secondary: 240 3.8% 26.1%;
  --muted: 240 4.8% 95.9%;
  --border: 240 5.2% 90%;
}`}
                </pre>
              </div>
              <div>
                <h4 className="font-system" style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>.dark</h4>
                <pre
                  className="font-system"
                  tabIndex={0}
                  role="region"
                  aria-label="Dark theme CSS variable definitions"
                  style={{
                    fontSize: 12,
                    lineHeight: 1.6,
                    color: 'var(--color-text-secondary)',
                    background: 'var(--color-surface-hover)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 4,
                    padding: 16,
                    overflow: 'auto',
                    maxHeight: 480,
                  }}
                >
                  {`.dark {
  --color-canvas: #09090b;
  --color-surface: #18181b;
  --color-surface-hover: #27272a;
  --color-border: #3f3f46;
  --color-border-strong: #52525b;
  --color-text-primary: #fafafa;
  --color-text-secondary: #d4d4d8;
  --color-text-muted: #71717a;

  /* Accent (Archival Ink) */
  --color-accent: #818cf8;
  --color-accent-hover: #a5b4fc;

  /* shadcn tokens (HSL) */
  --background: 240 10% 3.9%;
  --foreground: 0 0% 98%;
  --primary: 221.2 83.2% 44.3%;
  --secondary: 240 5.0% 26.1%;
  --muted: 240 3.7% 15.9%;
  --border: 240 3.7% 15.9%;
}`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* OVERLAY                                                           */}
      {/* ================================================================= */}
      <section id="ds1-overlay" className="ds1-section">
        <div className="ds1-section-inner">
          <div className="ds1-section-number ds1-reveal">11 — Overlay</div>
          <h2 className="ds1-section-title ds1-reveal">Manuscript Overlay System</h2>
          <div style={{ marginBottom: 32 }}>
            <h3 className="font-interface" style={{ fontSize: 18, fontWeight: 500, marginBottom: 8, color: 'var(--color-text-primary)' }}>Overlay Tokens</h3>
            <p style={{ fontSize: 14, marginBottom: 16, color: 'var(--color-text-secondary)' }}>Translucent surface and gradient tokens for game-session overlays.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
              <Swatch color="var(--color-overlay-surface)" name="Overlay Surface" hex="rgba(255,255,255,0.9)" note="HUD & Rail backgrounds" />
              <Swatch color="var(--color-overlay-surface-strong)" name="Overlay Strong" hex="rgba(255,255,255,0.95)" note="Modal & Drawer panels" />
              <Swatch color="var(--color-scrim)" name="Scrim" hex="rgba(17,17,17,0.45)" note="Backdrop dimming" />
            </div>
            <div style={{ marginTop: 24, padding: 16, borderRadius: 4, background: 'linear-gradient(180deg, var(--color-manuscript-gradient-start), var(--color-manuscript-gradient-end))', border: '1px solid var(--color-border)' }}>
              <div className="font-system" style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 8 }}>VIEWPORT GRADIENT</div>
              <p className="text-narrative">Linear gradient applied to the manuscript viewport shell.</p>
            </div>
          </div>
          <div style={{ marginBottom: 32 }}>
            <h3 className="font-interface" style={{ fontSize: 18, fontWeight: 500, marginBottom: 8, color: 'var(--color-text-primary)' }}>Class System</h3>
            <p style={{ fontSize: 14, marginBottom: 16, color: 'var(--color-text-secondary)' }}>Semantic manuscript-* classes for structural layout and state.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
              <div style={{ padding: 16, borderRadius: 2, background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                <div className="font-system" style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 12 }}>SCAFFOLD</div>
                <ul className="font-system" style={{ fontSize: 13, color: 'var(--color-text-primary)', listStyle: 'none', padding: 0 }}>
                  <li>.manuscript-viewport-layer</li>
                  <li>.manuscript-viewport-shell</li>
                  <li>.manuscript-viewport-inner</li>
                  <li>.manuscript-overlay-backdrop</li>
                </ul>
              </div>
              <div style={{ padding: 16, borderRadius: 2, background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                <div className="font-system" style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 12 }}>REGIONS</div>
                <ul className="font-system" style={{ fontSize: 13, color: 'var(--color-text-primary)', listStyle: 'none', padding: 0 }}>
                  <li>.manuscript-overlay-header</li>
                  <li>.manuscript-overlay-main</li>
                  <li>.manuscript-main-stage</li>
                  <li>.manuscript-characters-rail</li>
                </ul>
              </div>
              <div style={{ padding: 16, borderRadius: 2, background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                <div className="font-system" style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 12 }}>INTERACTIONS</div>
                <ul className="font-system" style={{ fontSize: 13, color: 'var(--color-text-primary)', listStyle: 'none', padding: 0 }}>
                  <li>.manuscript-action-rail-streaming</li>
                  <li>.manuscript-suggested-action</li>
                  <li>.manuscript-overlay-open</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* MANUSCRIPT DEMO                                                   */}
      {/* ================================================================= */}
      <section id="ds1-session" className="ds1-section">
        <div className="ds1-section-inner">
          <div className="ds1-section-number ds1-reveal">12 — Session</div>
          <h2 className="ds1-section-title ds1-reveal">Manuscript Demo</h2>
          <div id="ds1-main-content" />
          <div style={{ marginBottom: 32 }}>
            <h3 className="font-interface" style={{ fontSize: 18, fontWeight: 500, marginBottom: 8, color: 'var(--color-text-primary)' }}>Interactive Layout</h3>
            <p style={{ fontSize: 14, marginBottom: 16, color: 'var(--color-text-secondary)' }}>Click buttons to toggle panels and drawers. Demonstrates progressive disclosure in the game session layout.</p>
            <ManuscriptDemo />
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* COMPONENTS                                                        */}
      {/* ================================================================= */}
      <section id="ds1-components" className="ds1-section">
        <div className="ds1-section-inner">
          <div className="ds1-section-number ds1-reveal">13 — Components</div>
          <h2 className="ds1-section-title ds1-reveal">Components</h2>

          {/* Buttons */}
          <div style={{ marginBottom: 32 }}>
            <h3 className="font-interface" style={{ fontSize: 18, fontWeight: 500, marginBottom: 8, color: 'var(--color-text-primary)' }}>Buttons (State Matrix)</h3>
            <p style={{ fontSize: 14, marginBottom: 16, color: 'var(--color-text-secondary)' }}>Primary and secondary variants shown together for default, hover, active, disabled, and loading states.</p>
            <div style={{ borderRadius: 2, overflow: 'hidden', border: '1px solid var(--color-border)' }}>
              {[
                { state: 'DEFAULT', primary: {}, secondary: {} },
                { state: 'HOVER', primary: { background: '#1e1b4b' }, secondary: { background: 'var(--color-surface-hover)', borderColor: 'var(--color-border-strong)' } },
                { state: 'ACTIVE', primary: { background: '#1e1b4b', transform: 'scale(0.98)' }, secondary: { borderWidth: 2, borderColor: 'var(--color-border-strong)', transform: 'scale(0.98)' } },
                { state: 'DISABLED', primary: { background: 'var(--color-border-strong)', color: 'var(--color-text-muted)', cursor: 'not-allowed' }, secondary: { background: 'var(--color-surface-hover)', color: 'var(--color-text-muted)', cursor: 'not-allowed' } },
              ].map(({ state, primary, secondary }) => (
                <div key={state} style={{ display: 'grid', gridTemplateColumns: '140px 1fr', borderBottom: '1px solid var(--color-border)' }}>
                  <div className="font-system" style={{ padding: 16, fontSize: 12, color: 'var(--color-text-muted)' }}>{state}</div>
                  <div style={{ padding: 16, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                    <button
                      type="button"
                      disabled={state === 'DISABLED'}
                      className="font-interface"
                      style={{
                        padding: '8px 16px',
                        borderRadius: 2,
                        fontSize: 14,
                        fontWeight: 500,
                        background: '#312e81',
                        color: 'white',
                        border: 'none',
                        cursor: state === 'DISABLED' ? 'not-allowed' : 'pointer',
                        ...primary,
                      }}
                    >
                      Primary Action
                    </button>
                    <button
                      type="button"
                      disabled={state === 'DISABLED'}
                      className="font-interface"
                      style={{
                        padding: '8px 16px',
                        borderRadius: 2,
                        fontSize: 14,
                        fontWeight: 500,
                        background: 'var(--color-surface)',
                        color: 'var(--color-text-primary)',
                        border: '1px solid var(--color-border)',
                        cursor: state === 'DISABLED' ? 'not-allowed' : 'pointer',
                        ...secondary,
                      }}
                    >
                      Secondary Action
                    </button>
                  </div>
                </div>
              ))}
              {/* Loading state */}
              <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr' }}>
                <div className="font-system" style={{ padding: 16, fontSize: 12, color: 'var(--color-text-muted)' }}>LOADING</div>
                <div style={{ padding: 16, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                  <button type="button" className="font-interface" style={{ padding: '8px 16px', borderRadius: 2, fontSize: 14, fontWeight: 500, background: '#312e81', color: 'white', border: 'none', opacity: 0.8, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ display: 'inline-block', width: 12, height: 12, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    Loading...
                  </button>
                  <button type="button" className="font-interface" style={{ padding: '8px 16px', borderRadius: 2, fontSize: 14, fontWeight: 500, background: 'var(--color-surface-hover)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border-strong)', opacity: 0.8, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ display: 'inline-block', width: 12, height: 12, border: '2px solid var(--color-border)', borderTop: '2px solid var(--color-text-muted)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    Saving...
                  </button>
                </div>
              </div>
            </div>
          </div>
          {/* Inputs */}
          <div style={{ marginBottom: 32 }}>
            <h3 className="font-interface" style={{ fontSize: 18, fontWeight: 500, marginBottom: 8, color: 'var(--color-text-primary)' }}>Form Inputs (Validation States)</h3>
            <p style={{ fontSize: 14, marginBottom: 16, color: 'var(--color-text-secondary)' }}>Validation states pair visual styling with explicit helper text labels so status is never color-only.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 420 }}>
              {/* Default */}
              <div>
                <label htmlFor="design-system-input-default" className="font-system" style={{ display: 'block', fontSize: 12, marginBottom: 8, color: 'var(--color-text-muted)' }}>Default</label>
                <input id="design-system-input-default" type="text" placeholder="Character name" className="font-interface" style={{ width: '100%', padding: '12px 16px', borderRadius: 2, fontSize: 14, background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', boxSizing: 'border-box' }} />
              </div>
              {/* Focus */}
              <div>
                <label htmlFor="design-system-input-focus" className="font-system" style={{ display: 'block', fontSize: 12, marginBottom: 8, color: 'var(--color-text-muted)' }}>Focus</label>
                <input id="design-system-input-focus" type="text" defaultValue="Focused narrative prompt" className="font-interface" style={{ width: '100%', padding: '12px 16px', borderRadius: 2, fontSize: 14, background: 'var(--color-surface)', border: '1px solid #312e81', outline: '2px solid #312e81', color: 'var(--color-text-primary)', boxSizing: 'border-box' }} />
              </div>
              {/* Error */}
              <div>
                <label htmlFor="design-system-input-error" className="font-system" style={{ display: 'block', fontSize: 12, marginBottom: 8, color: 'var(--color-text-muted)' }}>Error</label>
                <input id="design-system-input-error" type="text" defaultValue="Scene title already used" className="font-interface" style={{ width: '100%', padding: '12px 16px', borderRadius: 2, fontSize: 14, background: 'var(--color-surface)', border: '1px solid #9f1239', color: 'var(--color-text-primary)', boxSizing: 'border-box' }} />
                <p style={{ fontSize: 12, marginTop: 4, color: '#9f1239' }}>Error: choose a unique title to continue.</p>
              </div>
              {/* Success */}
              <div>
                <label htmlFor="design-system-input-success" className="font-system" style={{ display: 'block', fontSize: 12, marginBottom: 8, color: 'var(--color-text-muted)' }}>Success</label>
                <input id="design-system-input-success" type="text" defaultValue="Ravenhold Ledger" className="font-interface" style={{ width: '100%', padding: '12px 16px', borderRadius: 2, fontSize: 14, background: 'var(--color-surface)', border: '1px solid #065f46', color: 'var(--color-text-primary)', boxSizing: 'border-box' }} />
                <p style={{ fontSize: 12, marginTop: 4, color: '#065f46' }}>Success: title accepted and ready to save.</p>
              </div>
              {/* Disabled */}
              <div>
                <label htmlFor="design-system-input-disabled" className="font-system" style={{ display: 'block', fontSize: 12, marginBottom: 8, color: 'var(--color-text-muted)' }}>Disabled</label>
                <input id="design-system-input-disabled" type="text" defaultValue="Locked while streaming" disabled className="font-interface" style={{ width: '100%', padding: '12px 16px', borderRadius: 2, fontSize: 14, background: 'var(--color-surface-hover)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', cursor: 'not-allowed', boxSizing: 'border-box' }} />
              </div>
            </div>
          </div>

          {/* Badges, Alerts, Cards */}
          <div style={{ marginBottom: 32 }}>
            <h3 className="font-interface" style={{ fontSize: 18, fontWeight: 500, marginBottom: 8, color: 'var(--color-text-primary)' }}>Badges, Alerts, Cards</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
              {/* Badges */}
              <div style={{ padding: 16, borderRadius: 2, background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                <div className="font-system" style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 12 }}>BADGES</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', borderRadius: 9999, padding: '2px 8px', fontSize: 12, fontWeight: 600, background: 'rgba(49, 46, 129, 0.15)', color: '#312e81' }}>Fantasy</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', borderRadius: 9999, padding: '2px 8px', fontSize: 12, fontWeight: 600, background: 'var(--color-surface-hover)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}>Session 04</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', borderRadius: 9999, padding: '2px 8px', fontSize: 12, fontWeight: 600, background: 'rgba(6, 95, 70, 0.12)', color: '#065f46' }}>Stable</span>
                </div>
              </div>
              {/* Alerts */}
              <div style={{ padding: 16, borderRadius: 2, background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                <div className="font-system" style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 12 }}>ALERTS</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14 }}>
                  <div style={{ borderRadius: 2, padding: '8px 12px', background: 'rgba(6, 95, 70, 0.08)', border: '1px solid rgba(6, 95, 70, 0.35)', color: '#065f46' }}>Success: choices updated.</div>
                  <div style={{ borderRadius: 2, padding: '8px 12px', background: 'rgba(146, 64, 14, 0.08)', border: '1px solid rgba(146, 64, 14, 0.35)', color: '#92400e' }}>Warning: low torchlight may affect stealth.</div>
                  <div style={{ borderRadius: 2, padding: '8px 12px', background: 'rgba(159, 18, 57, 0.08)', border: '1px solid rgba(159, 18, 57, 0.35)', color: '#9f1239' }}>Error: outcome save failed.</div>
                </div>
              </div>

              {/* Cards */}
              <div style={{ padding: 16, borderRadius: 2, background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                <div className="font-system" style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 12 }}>CARDS</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ padding: 16, borderRadius: 2, background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                    <div className="font-system" style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 8 }}>STANDARD CARD</div>
                    <p style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>Basic manuscript metadata card.</p>
                  </div>
                  <div style={{ padding: 16, borderRadius: 2, background: 'rgba(255, 255, 255, 0.9)', border: '1px solid var(--color-border)', backdropFilter: 'blur(12px)' }}>
                    <div className="font-system" style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 8 }}>HUD CARD</div>
                    <p style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>Floating overlay-compatible card panel.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Drawers */}
          <div style={{ marginBottom: 32 }}>
            <h3 className="font-interface" style={{ fontSize: 18, fontWeight: 500, marginBottom: 8, color: 'var(--color-text-primary)' }}>Drawers</h3>
            <p style={{ fontSize: 14, marginBottom: 16, color: 'var(--color-text-secondary)' }}>Side-panel drawers for supplementary content. Slide over the manuscript on demand.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              {/* Journal drawer */}
              <div className="ds1-reveal" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 2, overflow: 'hidden' }}>
                <div className="ds1-stage-label" style={{ padding: '12px 16px 0' }}>Drawer — Journal</div>
                <div style={{ padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <h4 style={{ fontSize: 14, fontWeight: 600, margin: 0, color: 'var(--color-text-primary)' }}>Journal</h4>
                      <div className="font-system" style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 2 }}>3 entries</div>
                    </div>
                    <span className="font-system" style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Close</span>
                  </div>
                  <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 12 }}>
                    {[
                      { title: 'The Alibi Room', excerpt: 'Clara\'s dressing room was untouched. Perfume on the vanity, a half-finished cigarette.' },
                      { title: 'Reyes\u2019 Warning', excerpt: 'The sergeant told me to drop it. That kind of advice usually means I\'m on the right track.' },
                    ].map((e) => (
                      <div key={e.title} style={{ padding: 10, border: '1px solid var(--color-border)', borderRadius: 2, background: 'var(--color-surface-hover)', marginBottom: 8 }}>
                        <div className="font-system" style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 4 }}>{e.title}</div>
                        <p className="text-narrative" style={{ fontSize: 12, lineHeight: 1.6, color: 'var(--color-text-secondary)', margin: 0 }}>{e.excerpt}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {/* Inventory drawer */}
              <div className="ds1-reveal" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 2, overflow: 'hidden' }}>
                <div className="ds1-stage-label" style={{ padding: '12px 16px 0' }}>Drawer — Inventory</div>
                <div style={{ padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <h4 style={{ fontSize: 14, fontWeight: 600, margin: 0, color: 'var(--color-text-primary)' }}>Inventory</h4>
                      <div className="font-system" style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 2 }}>4 items</div>
                    </div>
                    <span className="font-system" style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Close</span>
                  </div>
                  <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 12 }}>
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
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Spinner animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
