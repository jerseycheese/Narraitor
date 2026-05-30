'use client';

import { useState, useEffect, useCallback } from 'react';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { useActiveSection } from '@/hooks/useActiveSection';
import { SessionShowcase } from '../design-system/_ui/SessionShowcase';
import { ComponentShowcase } from '../design-system/_ui/ComponentShowcase';
import { OverlayShowcase } from '../design-system/_ui/OverlayShowcase';
import './design-system-2.css';

// ─────────────────────────────────────────────────────────────────
// Navigation Sections
// ─────────────────────────────────────────────────────────────────
const NAV_SECTIONS = [
  { id: 'ds2-hero', label: 'The Open Journal' },
  { id: 'ds2-logo', label: 'Brand' },
  { id: 'ds2-color', label: 'Colors' },
  { id: 'ds2-typography', label: 'Typography' },
  { id: 'ds2-spacing', label: 'Spacing' },
  { id: 'ds2-radius', label: 'Radius' },
  { id: 'ds2-elevation', label: 'Elevation' },
  { id: 'ds2-icons', label: 'Icons' },
  { id: 'ds2-grid', label: 'Grid' },
  { id: 'ds2-layout', label: 'Layout' },
  { id: 'ds2-variables', label: 'Variables' },
  { id: 'ds2-overlay', label: 'Overlay' },
  { id: 'ds2-manuscript', label: 'Session' },
  { id: 'ds2-components', label: 'Components' },
];

// ─────────────────────────────────────────────────────────────────
// Color Palette Data
// ─────────────────────────────────────────────────────────────────
const EARTH_PALETTE = [
  { name: 'Canvas', hex: '#FAF8F3', role: 'surface', dark: false },
  { name: 'Surface', hex: '#FFFDF7', role: 'surface', dark: false },
  { name: 'Surface Hover', hex: '#F5F1E8', role: 'surface', dark: false },
  { name: 'Border', hex: '#E0D5C7', role: 'border', dark: false },
  { name: 'Text Muted', hex: '#9C8D7E', role: 'text', dark: true },
  { name: 'Text Secondary', hex: '#6B5D52', role: 'text', dark: true },
  { name: 'Text Primary', hex: '#2D2520', role: 'text', dark: true },
  { name: 'Accent', hex: '#7C8B6F', role: 'accent', dark: true },
];

const CONTRAST = [
  { bg: '#FAF8F3', fg: '#2D2520', label: 'Primary on Canvas', ratio: '12.8:1', pass: true },
  { bg: '#FAF8F3', fg: '#6B5D52', label: 'Secondary on Canvas', ratio: '5.2:1', pass: true },
  { bg: '#FAF8F3', fg: '#9C8D7E', label: 'Muted on Canvas', ratio: '3.1:1', pass: false },
  { bg: '#C2532F', fg: '#FFFFFF', label: 'White on Terracotta', ratio: '4.8:1', pass: true },
];

// ─────────────────────────────────────────────────────────────────
// Type Scale Data (7 contexts)
// ─────────────────────────────────────────────────────────────────
const TYPE_ROWS = [
  { tag: 'Narrative body', family: 'var(--font-narrative)', size: '18px', lh: '1.75', weight: 400, sample: 'The ancient archive breathed stories into the quiet afternoon air.' },
  { tag: 'Dialogue', family: 'var(--font-narrative)', size: '18px', lh: '1.75', weight: 400, sample: '\u201CEvery scroll here has a story to tell,\u201D the curator said softly.', italic: true },
  { tag: 'Choice text', family: 'var(--font-interface)', size: '15px', lh: '1.5', weight: 500, sample: 'Open the leather-bound chronicle on the reading desk' },
  { tag: 'System data', family: 'var(--font-system)', size: '13px', lh: '1.5', weight: 400, sample: 'INSIGHT 14 \u00B7 EMPATHY 11 \u00B7 PERCEPTION 16' },
  { tag: 'Interface', family: 'var(--font-interface)', size: '14px', lh: '1.5', weight: 500, sample: 'Continue to Character Sheet' },
  { tag: 'HUD values', family: 'var(--font-system)', size: '16px', lh: '1.4', weight: 600, sample: 'HP 24/30' },
  { tag: 'Timestamps', family: 'var(--font-system)', size: '11px', lh: '1.4', weight: 400, sample: '3 MINUTES AGO', mono: true },
];

// ─────────────────────────────────────────────────────────────────
// Heading Scale Data
// ─────────────────────────────────────────────────────────────────
const HEADING_SCALE = [
  { tag: 'h1', size: '2.25rem', px: '36px', weight: 500, lh: 1.1, label: 'Chapter Opening' },
  { tag: 'h2', size: '1.875rem', px: '30px', weight: 500, lh: 1.12, label: 'Section Divider' },
  { tag: 'h3', size: '1.5rem', px: '24px', weight: 500, lh: 1.2, label: 'Subsection' },
  { tag: 'h4', size: '1.25rem', px: '20px', weight: 500, lh: 1.25, label: 'Paragraph Lead' },
  { tag: 'h5', size: '1.125rem', px: '18px', weight: 500, lh: 1.3, label: 'Minor Heading' },
  { tag: 'h6', size: '1rem', px: '16px', weight: 600, lh: 1.35, label: 'Label' },
];

// ─────────────────────────────────────────────────────────────────
// Spacing Scale (8px base grid)
// ─────────────────────────────────────────────────────────────────
const SPACING_SCALE = [8, 16, 24, 32, 40, 48, 64, 96];

// ─────────────────────────────────────────────────────────────────
// Page Component
// ─────────────────────────────────────────────────────────────────
export default function DesignSystem2Page() {
  const [isDark, setIsDark] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const revealRef = useScrollReveal({ revealClass: 'ds2-reveal', visibleClass: 'ds2-visible', threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
  const activeSection = useActiveSection(NAV_SECTIONS.map((s) => s.id), { threshold: 0.15, rootMargin: '-10% 0px -60% 0px' });

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggleTheme = useCallback(() => {
    const html = document.documentElement;
    if (isDark) {
      html.classList.remove('dark');
    } else {
      html.classList.add('dark');
    }
    setIsDark(!isDark);
  }, [isDark]);

  return (
    <div className="ds2 design-system-2-page" ref={revealRef}>
      {/* Skip link */}
      <a href="#ds2-main-content" className="ds2-skip-link">Skip to content</a>
      {/* ── Floating Navigation ─────────────────────────── */}
      <nav className="ds2-nav" aria-label="Design system sections">
        {NAV_SECTIONS.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            className={`ds2-nav-item ${activeSection === section.id ? 'ds2-nav-active' : ''}`}
          >
            <span className="ds2-nav-dot" />
            <span className="ds2-nav-label">{section.label}</span>
          </a>
        ))}
      </nav>

      {/* ── Theme Toggle ────────────────────────────────── */}
      <button
        className="ds2-theme-toggle"
        onClick={toggleTheme}
        aria-label="Toggle theme"
      >
        {isDark ? 'Light' : 'Dark'}
      </button>

      {/* ════════════════════════════════════════════════════
          HERO
          ════════════════════════════════════════════════════ */}
      <section id="ds2-hero" className="ds2-hero">
        <div className="ds2-reveal">
          <p className="ds2-hero-meta">Narraitor Design System · The Open Journal · 2026</p>
        </div>
        <h1 className="ds2-hero-title ds2-reveal">
          The Open Journal
        </h1>
        <div className="ds2-reveal">
          <p className="ds2-hero-meta" style={{ maxWidth: '42ch', textAlign: 'center', lineHeight: 1.7, letterSpacing: '0.12em' }}>
            Organic neutrality with warm earth tones. Soft forms, breathing space, and calm typography that frames any narrative without competing.
          </p>
        </div>
        <div className="ds2-hero-divider ds2-reveal" />
        <div className="ds2-hero-scroll-hint ds2-reveal">Explore</div>
      </section>

      {/* Design Philosophy */}
      <section className="ds2-section" style={{ paddingTop: 48, paddingBottom: 32 }}>
        <div className="ds2-section-inner">
          <div className="ds2-section-number ds2-reveal">00 — Design Philosophy</div>
          <h2 className="ds2-section-title ds2-reveal">A Sanctuary for Stories</h2>
          <p className="ds2-section-subtitle ds2-reveal">
            The Open Journal treats every session as a handwritten journal page. Warm earth tones and organic rounded forms create a sense of comfort and safety. The interface disappears, leaving only the story.
          </p>
          <div className="ds2-stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            {[
              { title: 'SANCTUARY', text: 'Soft, rounded forms and warm-neutral tones create a space that feels safe and inviting. No sharp edges, no cold chrome.' },
              { title: 'GENRE-NEUTRAL', text: 'Earth tones frame any world — noir detective, sci-fi station, or fantasy realm — without competing with the narrative.' },
              { title: 'INVISIBLE UI', text: 'Interface elements appear as natural extensions of the page. Floating panels feel like paper notes pinned to a journal.' },
            ].map(c => (
              <div key={c.title} className="ds2-component-stage ds2-reveal" style={{ padding: 20 }}>
                <div className="ds2-component-label">{c.title}</div>
                <p style={{ fontFamily: 'var(--font-narrative)', fontSize: '0.9375rem', lineHeight: 1.65, color: 'var(--color-text-secondary)', margin: 0 }}>{c.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          LOGO TREATMENTS
          ════════════════════════════════════════════════════ */}
      <section id="ds2-logo" className="ds2-section">
        <div className="ds2-section-inner">
          <div className="ds2-section-number ds2-reveal">01 — Brand</div>
          <h2 className="ds2-section-title ds2-reveal">Narraitor</h2>
          <p className="ds2-section-subtitle ds2-reveal">
            Typography-driven brand identity. The logo lives in the type system, not as a locked graphic. Adaptable, warm, and grounded.
          </p>

          {/* Primary Wordmark */}
          <div className="ds2-component-stage ds2-reveal">
            <div className="ds2-component-label">Primary Wordmark</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', background: 'var(--gradient-warm)', borderRadius: '12px' }}>
              <h1 style={{ fontFamily: 'var(--font-narrative)', fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 400, letterSpacing: '-0.01em', color: 'var(--color-text-primary)', margin: 0 }}>
                Narr<span style={{ color: 'var(--color-accent)', fontWeight: 500 }}>ai</span>tor
              </h1>
            </div>
          </div>

          {/* Logo Variations */}
          <div className="ds2-stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '32px' }}>
            <div className="ds2-component-stage ds2-reveal" style={{ textAlign: 'center', padding: '32px' }}>
              <div className="ds2-component-label" style={{ textAlign: 'left' }}>All Caps</div>
              <div style={{ fontFamily: 'var(--font-interface)', fontSize: '2rem', fontWeight: 700, letterSpacing: '0.02em', textTransform: 'uppercase', color: 'var(--color-text-primary)' }}>
                NARR<span style={{ color: 'var(--color-accent)' }}>AI</span>TOR
              </div>
            </div>
            <div className="ds2-component-stage ds2-reveal" style={{ textAlign: 'center', padding: '32px' }}>
              <div className="ds2-component-label" style={{ textAlign: 'left' }}>Monospace</div>
              <div style={{ fontFamily: 'var(--font-system)', fontSize: '1.5rem', fontWeight: 600, letterSpacing: '0.05em', color: 'var(--color-text-primary)' }}>
                NARR<span style={{ color: 'var(--color-accent)' }}>AI</span>TOR
              </div>
            </div>
            <div className="ds2-component-stage ds2-reveal" style={{ textAlign: 'center', padding: '32px' }}>
              <div className="ds2-component-label" style={{ textAlign: 'left' }}>Condensed</div>
              <div style={{ fontFamily: 'var(--font-narrative)', fontSize: '2.25rem', fontWeight: 500, letterSpacing: '-0.03em', color: 'var(--color-text-primary)' }}>
                Narr<span style={{ color: 'var(--color-accent)', fontWeight: 600 }}>ai</span>tor
              </div>
            </div>
          </div>

          {/* Usage Guidelines */}
          <div className="ds2-reveal">
            <div className="ds2-component-label">Brand Guidelines</div>
            <div className="ds2-code" style={{ fontSize: '0.875rem', lineHeight: 1.7 }}>
              {`/* Primary wordmark: Crimson Pro */
.narraitor-wordmark {
  font-family: 'Crimson Pro', serif;
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
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          COLOR
          ════════════════════════════════════════════════════ */}
      <section id="ds2-color" className="ds2-section">
        <div className="ds2-section-inner">
          <div className="ds2-section-number ds2-reveal">02 — Palette</div>
          <h2 className="ds2-section-title ds2-reveal">Warm Earth Tones</h2>
          <p className="ds2-section-subtitle ds2-reveal">
            A palette inspired by clay, linen, sand, and stone. Warm neutrals that create calm without imposing mood. Genre-agnostic and story-focused.
          </p>

          {/* Color swatch cards */}
          <div className="ds2-reveal" style={{ marginBottom: '48px' }}>
            <div className="ds2-component-label">Color Swatches</div>
            <div className="ds2-swatch-grid">
              {EARTH_PALETTE.map(c => (
                <div key={c.name} className="ds2-swatch">
                  <div className="ds2-swatch-color" style={{ background: c.hex, color: c.dark ? '#FAF8F3' : '#2D2520' }}>
                    <span style={{ fontFamily: 'var(--font-system)', fontSize: 10, opacity: 0.8 }}>{c.role}</span>
                  </div>
                  <div className="ds2-swatch-info">
                    <div className="ds2-swatch-name">{c.name}</div>
                    <div className="ds2-swatch-hex">{c.hex}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Full earth palette strip */}
          <div className="ds2-reveal" style={{ marginBottom: '48px' }}>
            <div className="ds2-component-label">Earth Tone Spectrum</div>
            <div className="ds2-palette-strip">
              {EARTH_PALETTE.map(c => (
                <div
                  key={c.name}
                  className="ds2-palette-band"
                  style={{ background: c.hex, color: c.dark ? '#FAF8F3' : '#2D2520' }}
                >
                  <span className="ds2-palette-band-label">{c.name} · {c.hex}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Accent demo: light vs dark */}
          <div className="ds2-reveal" style={{ marginBottom: '48px' }}>
            <div className="ds2-component-label">Olive Moss Accent</div>
            <div className="ds2-accent-demo">
              <div className="ds2-accent-panel ds2-accent-panel-light">
                <div style={{ fontFamily: 'var(--font-system)', fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '16px', color: '#9C8D7E', fontWeight: 600 }}>
                  Light Mode — #7C8B6F (Olive Moss)
                </div>
                <p style={{ fontFamily: 'var(--font-narrative)', fontSize: '1.0625rem', lineHeight: 1.7, marginBottom: '16px' }}>
                  The archivist gestured toward <span style={{ color: '#7C8B6F', textDecoration: 'underline', textDecorationThickness: '2px', textUnderlineOffset: '3px', fontWeight: 500 }}>The Chronicle of Collected Memories</span>, its moss-green binding soft against weathered pages.
                </p>
                <button type="button" style={{ padding: '10px 20px', background: '#7C8B6F', color: 'white', border: 'none', borderRadius: '8px', fontFamily: 'var(--font-interface)', fontSize: '0.875rem', fontWeight: 600, cursor: 'default' }}>
                  Open Chronicle
                </button>
              </div>
              <div className="ds2-accent-panel ds2-accent-panel-dark">
                <div style={{ fontFamily: 'var(--font-system)', fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '16px', color: '#9C8D7E', fontWeight: 600 }}>
                  Dark Mode — #9CAA8A (Lighter Moss)
                </div>
                <p style={{ fontFamily: 'var(--font-narrative)', fontSize: '1.0625rem', lineHeight: 1.7, marginBottom: '16px' }}>
                  The archivist gestured toward <span style={{ color: '#9CAA8A', textDecoration: 'underline', textDecorationThickness: '2px', textUnderlineOffset: '3px', fontWeight: 500 }}>The Chronicle of Collected Memories</span>, its moss-green binding soft against weathered pages.
                </p>
                <button type="button" style={{ padding: '10px 20px', background: '#9CAA8A', color: '#1A1614', border: 'none', borderRadius: '8px', fontFamily: 'var(--font-interface)', fontSize: '0.875rem', fontWeight: 600, cursor: 'default' }}>
                  Open Chronicle
                </button>
              </div>
            </div>
          </div>

          {/* Semantic colors in narrative context */}
          <div className="ds2-reveal">
            <div className="ds2-component-label">Semantic Colors — In Context</div>
            <div style={{ fontFamily: 'var(--font-narrative)', fontSize: '1.125rem', lineHeight: 1.7, color: 'var(--color-text-primary)', maxWidth: '700px' }}>
              <p style={{ marginBottom: '16px' }}>
                The curator examined each scroll carefully, marking verified histories with a gentle stamp:{' '}
                <span style={{ display: 'inline-flex', alignItems: 'center', borderRadius: 9999, padding: '3px 12px', fontSize: '0.8125rem', fontWeight: 600, fontFamily: 'var(--font-interface)', background: 'rgba(6, 95, 70, 0.12)', color: '#065f46' }}>Verified</span>.
                Questionable accounts received a cautious note{' '}
                <span style={{ display: 'inline-flex', alignItems: 'center', borderRadius: 9999, padding: '3px 12px', fontSize: '0.8125rem', fontWeight: 600, fontFamily: 'var(--font-interface)', background: 'rgba(146, 64, 14, 0.12)', color: '#92400e' }}>Needs review</span>,
                while lost narratives were sealed away{' '}
                <span style={{ display: 'inline-flex', alignItems: 'center', borderRadius: 9999, padding: '3px 12px', fontSize: '0.8125rem', fontWeight: 600, fontFamily: 'var(--font-interface)', background: 'rgba(159, 18, 57, 0.12)', color: '#9f1239' }}>Incomplete</span>.
              </p>
              <p>
                A small notation in warm ink read:{' '}
                <span style={{ display: 'inline-flex', alignItems: 'center', borderRadius: 9999, padding: '3px 12px', fontSize: '0.8125rem', fontWeight: 600, fontFamily: 'var(--font-interface)', background: 'rgba(7, 89, 133, 0.12)', color: '#075985' }}>5 stories awaiting classification</span>.
              </p>
            </div>
          </div>

          {/* Contrast samples */}
          <div className="ds2-reveal" style={{ marginTop: '48px' }}>
            <div className="ds2-component-label">Accessibility — Contrast Verification</div>
            <div className="ds2-contrast-grid">
              {CONTRAST.map(c => (
                <div key={c.label} className="ds2-contrast-card" style={{ background: c.bg, color: c.fg }}>
                  <div className="ds2-contrast-sample">Readable text</div>
                  <div className={`ds2-contrast-meta ${c.pass ? 'ds2-contrast-pass' : 'ds2-contrast-fail'}`}>
                    {c.label}<br />{c.ratio} — {c.pass ? 'AA Pass' : 'AA Fail (decorative only)'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          TYPOGRAPHY
          ════════════════════════════════════════════════════ */}
      <section id="ds2-typography" className="ds2-section">
        <div className="ds2-section-inner">
          <div className="ds2-section-number ds2-reveal">03 — Typography</div>
          <h2 className="ds2-section-title ds2-reveal">Warm Voice, Clear Purpose</h2>
          <p className="ds2-section-subtitle ds2-reveal">
            Crimson Pro for narrative warmth. JetBrains Mono for technical precision. Manrope for interface clarity. Three distinct voices that work in harmony.
          </p>

          {/* Type scale — 7 contexts */}
          <div className="ds2-reveal" style={{ marginBottom: 48 }}>
            <div className="ds2-component-label">Type Scale</div>
            {TYPE_ROWS.map(r => (
              <div key={r.tag} className="ds2-type-row">
                <span className="ds2-type-tag">{r.tag}</span>
                <span className="ds2-type-sample" style={{
                  fontFamily: r.family, fontSize: r.size, lineHeight: r.lh, fontWeight: r.weight,
                  fontStyle: r.italic ? 'italic' : 'normal',
                  letterSpacing: r.mono ? '0.05em' : undefined,
                  textTransform: r.mono ? 'uppercase' as const : undefined,
                }}>{r.sample}</span>
                <span className="ds2-type-meta">{r.size} / w{r.weight}</span>
              </div>
            ))}
          </div>

          {/* Split specimen: narrative vs technical */}
          <div className="ds2-specimen-split ds2-reveal">
            <div className="ds2-specimen-narrative">
              <p>The library doors swung open to reveal shelves of leather-bound volumes stretching toward vaulted ceilings. Afternoon light filtered through tall windows, casting amber pools across worn oak tables.</p>
              <p>You approached the central reading desk where an open manuscript waited, its pages yellowed but text still clear. The air smelled of old paper and wood polish—a scent of preserved knowledge.</p>
              <p>A bronze plaque on the desk read: &ldquo;Every story deserves a sanctuary.&rdquo;</p>
            </div>
            <div className="ds2-specimen-technical">
              <p>
                <span className="ds2-specimen-annotation">font-narrative</span><br />
                font-family: Crimson Pro, serif<br />
                font-size: 1.25rem (20px)<br />
                line-height: 1.7 (34px)<br />
                font-weight: 400<br />
                color: var(--color-text-primary)
              </p>
              <p>
                <span className="ds2-specimen-annotation">measure</span><br />
                max-width: 640px<br />
                ~60-70 characters per line<br />
                optimized for sustained reading
              </p>
              <p>
                <span className="ds2-specimen-annotation">vertical rhythm</span><br />
                paragraph spacing: 16px<br />
                scene spacing: 24px<br />
                aligned to 8px baseline grid
              </p>
            </div>
          </div>

          {/* Three font roles */}
          <div className="ds2-stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '48px' }}>
            <div className="ds2-component-stage ds2-reveal">
              <div className="ds2-component-label">Narrative — Crimson Pro</div>
              <p style={{ fontFamily: 'var(--font-narrative)', fontSize: '1.375rem', lineHeight: 1.65, color: 'var(--color-text-primary)', margin: 0 }}>
                The ancient archive breathed stories into the quiet afternoon air.
              </p>
            </div>
            <div className="ds2-component-stage ds2-reveal">
              <div className="ds2-component-label">System — JetBrains Mono</div>
              <p style={{ fontFamily: 'var(--font-system)', fontSize: '0.9375rem', lineHeight: 1.6, letterSpacing: '0.01em', color: 'var(--color-text-primary)', margin: 0 }}>
                HP: 42/50 · TURN 14 · SAVE: Auto · STATUS: Active
              </p>
            </div>
            <div className="ds2-component-stage ds2-reveal">
              <div className="ds2-component-label">Interface — Manrope</div>
              <p style={{ fontFamily: 'var(--font-interface)', fontSize: '1.0625rem', lineHeight: 1.5, color: 'var(--color-text-primary)', margin: 0, fontWeight: 500 }}>
                Continue to Character Sheet
              </p>
            </div>
          </div>

          {/* Heading scale as table of contents */}
          <div className="ds2-heading-toc ds2-reveal">
            <div className="ds2-component-label" style={{ marginBottom: '16px' }}>Heading Scale — Visual Hierarchy</div>
            {HEADING_SCALE.map(({ tag, size, px, weight, lh, label }) => (
              <div key={tag} className="ds2-heading-toc-item">
                <span className="ds2-heading-toc-tag">{tag}</span>
                <span
                  className="ds2-heading-toc-text"
                  style={{ fontSize: size, fontWeight: weight, lineHeight: lh }}
                >
                  {label}
                </span>
                <span className="ds2-heading-toc-meta">{px} · w{weight} · lh {lh}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          SPACING & RHYTHM
          ════════════════════════════════════════════════════ */}
      <section id="ds2-spacing" className="ds2-section">
        <div className="ds2-section-inner">
          <div className="ds2-section-number ds2-reveal">04 — Rhythm</div>
          <h2 className="ds2-section-title ds2-reveal">Breathing Space</h2>
          <p className="ds2-section-subtitle ds2-reveal">
            An 8px baseline grid and organic spacing scale create generous, natural rhythm. Whitespace is not decorative—it&rsquo;s essential breathing room.
          </p>

          {/* Baseline grid toggle */}
          <div className="ds2-reveal" style={{ marginBottom: '48px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
              <div className="ds2-component-label" style={{ margin: 0, border: 'none', padding: 0 }}>Baseline Grid</div>
              <button
                type="button"
                onClick={() => setShowGrid(!showGrid)}
                style={{
                  padding: '6px 16px',
                  background: showGrid ? 'var(--color-accent)' : 'var(--color-surface)',
                  color: showGrid ? 'white' : 'var(--color-text-muted)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  fontFamily: 'var(--font-system)',
                  fontSize: '11px',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                {showGrid ? 'Hide Grid' : 'Show Grid'}
              </button>
            </div>
            <div className="ds2-rhythm-demo" style={{ padding: '32px', border: '1px solid var(--color-border)', borderRadius: '12px', background: 'var(--color-surface)' }}>
              <div className={`ds2-rhythm-grid-overlay ${showGrid ? 'ds2-rhythm-visible' : ''}`} />
              <div style={{ position: 'relative', zIndex: 1, maxWidth: '700px' }}>
                <p style={{ fontFamily: 'var(--font-narrative)', fontSize: '1.1875rem', lineHeight: 1.7, color: 'var(--color-text-primary)', marginBottom: '16px' }}>
                  Each line settles naturally into place, guided by an invisible structure beneath. The 8-pixel grid provides rhythm without rigidity—breathing space for words to rest.
                </p>
                <p style={{ fontFamily: 'var(--font-narrative)', fontSize: '1.1875rem', lineHeight: 1.7, color: 'var(--color-text-primary)', marginBottom: '24px' }}>
                  Headings float above their content with measured distance. Every margin is intentional, creating flow that feels organic rather than engineered.
                </p>
                <p style={{ fontFamily: 'var(--font-system)', fontSize: '0.8125rem', lineHeight: 1.6, letterSpacing: '0.02em', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                  Turn: 14 · Status: Active · Auto-save: 2m ago
                </p>
              </div>
            </div>
          </div>

          {/* Spacing scale */}
          <div className="ds2-reveal">
            <div className="ds2-component-label">Spacing Scale — 8px Base Grid</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', background: 'var(--color-surface)', padding: '24px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
              {SPACING_SCALE.map((px) => (
                <div key={px} className="ds2-spacing-row">
                  <span className="ds2-spacing-label">{px}px</span>
                  <div className="ds2-spacing-bar" style={{ width: px * 2 }} />
                  <span className="ds2-spacing-value">{px / 16}rem</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>



      {/* ════════════════════════════════════════════════════
          BORDER RADIUS
          ════════════════════════════════════════════════════ */}
      <section id="ds2-radius" className="ds2-section">
        <div className="ds2-section-inner">
          <div className="ds2-section-number ds2-reveal">05 — Form</div>
          <h2 className="ds2-section-title ds2-reveal">Border Radius</h2>
          <p className="ds2-section-subtitle ds2-reveal">
            Soft, rounded corners create organic forms. More generous than the technical 2px of the original system.
          </p>

          <div className="ds2-reveal">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              {[
                { name: 'Small', value: '8px', note: 'Buttons, inputs, small elements' },
                { name: 'Medium', value: '12px', note: 'Cards, panels, default' },
                { name: 'Large', value: '16px', note: 'Modals, drawers, prominent containers' },
                { name: 'Full', value: '9999px', note: 'Pills, badges, circular elements' },
              ].map(({ name, value, note }) => (
                <div key={name} className="ds2-component-stage" style={{ padding: '24px' }}>
                  <div className="ds2-component-label">{name} — {value}</div>
                  <div style={{ width: '100%', height: '80px', background: 'var(--color-accent-soft)', border: '2px solid var(--color-accent)', borderRadius: value, marginBottom: '12px' }} />
                  <p style={{ fontFamily: 'var(--font-system)', fontSize: '11px', color: 'var(--color-text-muted)', margin: 0 }}>{note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          ELEVATION
          ════════════════════════════════════════════════════ */}
      <section id="ds2-elevation" className="ds2-section">
        <div className="ds2-section-inner">
          <div className="ds2-section-number ds2-reveal">06 — Depth</div>
          <h2 className="ds2-section-title ds2-reveal">Elevation & Shadows</h2>
          <p className="ds2-section-subtitle ds2-reveal">
            Soft shadows with warm color cast. Elevation through gentle depth, not harsh contrast.
          </p>

          <div className="ds2-reveal">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              {[
                { name: 'Soft', shadow: 'var(--shadow-soft)', note: 'Cards, hover states' },
                { name: 'Elevated', shadow: 'var(--shadow-elevated)', note: 'Drawers, modals, floating panels' },
              ].map(({ name, shadow, note }) => (
                <div key={name} className="ds2-component-stage" style={{ padding: '32px', textAlign: 'center' }}>
                  <div className="ds2-component-label" style={{ textAlign: 'left' }}>{name}</div>
                  <div style={{ width: '100%', height: '100px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', boxShadow: shadow, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                    <span style={{ fontFamily: 'var(--font-system)', fontSize: '11px', color: 'var(--color-text-muted)' }}>Elevation</span>
                  </div>
                  <p style={{ fontFamily: 'var(--font-system)', fontSize: '11px', color: 'var(--color-text-muted)', margin: 0 }}>{note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          ICONS
          ════════════════════════════════════════════════════ */}
      <section id="ds2-icons" className="ds2-section">
        <div className="ds2-section-inner">
          <div className="ds2-section-number ds2-reveal">07 — Iconography</div>
          <h2 className="ds2-section-title ds2-reveal">Icon System</h2>
          <p className="ds2-section-subtitle ds2-reveal">
            Lucide icons with consistent sizing. Warm accent color for interactive states.
          </p>

          <div className="ds2-reveal">
            <div className="ds2-component-label">Icon Sizes</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
              {[
                { size: 16, label: '16px — Inline' },
                { size: 20, label: '20px — Standard' },
                { size: 24, label: '24px — Buttons' },
                { size: 32, label: '32px — Hero' },
              ].map(({ size, label }) => (
                <div key={size} className="ds2-component-stage" style={{ padding: '24px', textAlign: 'center' }}>
                  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 12px' }}>
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                  <p style={{ fontFamily: 'var(--font-system)', fontSize: '11px', color: 'var(--color-text-muted)', margin: 0 }}>{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          GRID
          ════════════════════════════════════════════════════ */}
      <section id="ds2-grid" className="ds2-section">
        <div className="ds2-section-inner">
          <div className="ds2-section-number ds2-reveal">08 — Structure</div>
          <h2 className="ds2-section-title ds2-reveal">Grid & Breakpoints</h2>
          <p className="ds2-section-subtitle ds2-reveal">
            Standard responsive breakpoints with container widths optimized for reading and creation.
          </p>

          <div className="ds2-reveal">
            <div className="ds2-component-label">Breakpoints</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '32px' }}>
              {[
                { label: 'sm', width: '640px', desc: 'Small devices' },
                { label: 'md', width: '768px', desc: 'Tablets' },
                { label: 'lg', width: '1024px', desc: 'Laptops' },
                { label: 'xl', width: '1280px', desc: 'Desktops — navigation appears' },
                { label: '2xl', width: '1536px', desc: 'Large screens' },
              ].map(({ label, width, desc }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
                  <span style={{ fontFamily: 'var(--font-system)', fontSize: '13px', fontWeight: 600, color: 'var(--color-accent)', width: '3rem' }}>{label}</span>
                  <span style={{ fontFamily: 'var(--font-system)', fontSize: '13px', color: 'var(--color-text-primary)', width: '5rem', fontWeight: 600 }}>{width}</span>
                  <span style={{ fontFamily: 'var(--font-system)', fontSize: '12px', color: 'var(--color-text-muted)' }}>{desc}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="ds2-reveal">
            <div className="ds2-component-label">Container Widths</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {[
                { title: 'Manuscript (Narrative)', width: '768px (max-w-3xl)', desc: 'Optimal reading, 60-70 chars/line' },
                { title: 'Workshop (Utility)', width: '1024px (max-w-5xl)', desc: 'Forms, lists, management' },
                { title: 'Default (Content)', width: '1200px', desc: 'General pages, dashboard' },
              ].map(({ title, width, desc }) => (
                <div key={title} className="ds2-component-stage" style={{ padding: '20px' }}>
                  <div className="ds2-component-label">{title}</div>
                  <p style={{ fontFamily: 'var(--font-system)', fontSize: '13px', color: 'var(--color-accent)', fontWeight: 600, marginBottom: '8px' }}>{width}</p>
                  <p style={{ fontFamily: 'var(--font-narrative)', fontSize: '0.9375rem', lineHeight: 1.6, color: 'var(--color-text-secondary)', margin: 0 }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      < section id="ds2-layout" className="ds2-section" style={{ borderBottom: '1px solid var(--color-border)' }
      }>
        <div className="ds2-section-inner">
          <div className="ds2-section-number ds2-reveal">09 — Patterns</div>
          <h2 className="ds2-section-title ds2-reveal">Layout Archetypes</h2>
          <p className="ds2-section-subtitle ds2-reveal">
            Three foundational patterns. Manuscript for immersive reading, Workshop for creation and management, Default for general navigation.
          </p>

          <div className="ds2-archetype-grid ds2-stagger">
            {/* Immersive Reading */}
            <div className="ds2-archetype-card ds2-reveal">
              <div className="ds2-archetype-preview">
                <div style={{ border: '1px solid var(--color-border)', borderRadius: '8px', padding: '12px', minHeight: '160px', background: 'var(--color-surface)', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '10px', fontFamily: 'var(--font-system)', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                  <div style={{ height: '12px', opacity: 0.2, background: 'var(--color-surface-hover)', borderRadius: '4px', marginBottom: '2px' }} />
                  <div style={{ flex: 1, background: 'var(--color-surface-hover)', borderRadius: '6px', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', fontSize: '9px' }}>
                    Fullscreen Narrative<br />Minimal chrome
                  </div>
                  <div style={{ height: '16px', background: 'var(--color-surface-hover)', borderRadius: '6px' }} />
                </div>
              </div>
              <div className="ds2-archetype-info">
                <div className="ds2-archetype-name">Immersive</div>
                <div className="ds2-archetype-desc">Fullscreen reading mode. HUD fades on idle but action controls stay visible. Story takes center stage.</div>
              </div>
            </div>

            {/* Balanced Session */}
            <div className="ds2-archetype-card ds2-reveal">
              <div className="ds2-archetype-preview">
                <div style={{ border: '1px solid var(--color-border)', borderRadius: '8px', padding: '12px', minHeight: '160px', background: 'var(--color-surface)', display: 'grid', gridTemplateRows: 'auto 1fr auto', gap: '6px', fontSize: '10px', fontFamily: 'var(--font-system)', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px' }}>
                    <div style={{ display: 'flex', gap: '3px' }}>
                      <div style={{ width: '28px', height: '12px', background: 'var(--color-surface-hover)', borderRadius: '4px' }} />
                      <div style={{ width: '28px', height: '12px', background: 'var(--color-surface-hover)', borderRadius: '4px' }} />
                    </div>
                    <div style={{ fontSize: '7px', padding: '2px 4px' }}>TURN 14</div>
                  </div>
                  <div style={{ background: 'var(--color-surface-hover)', borderRadius: '6px', padding: '12px', textAlign: 'center', fontSize: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    Full-Width Narrative<br />Drawers slide over
                  </div>
                  <div style={{ padding: '6px', background: 'var(--color-surface-hover)', borderRadius: '6px', textAlign: 'center' }}>Action Input</div>
                </div>
              </div>
              <div className="ds2-archetype-info">
                <div className="ds2-archetype-name">Active Session</div>
                <div className="ds2-archetype-desc">Balanced gameplay. Full-width narrative with HUD dropdowns and side drawers that slide over content on demand.</div>
              </div>
            </div>

            {/* Multi-Panel Creator */}
            <div className="ds2-archetype-card ds2-reveal">
              <div className="ds2-archetype-preview">
                <div style={{ border: '1px solid var(--color-border)', borderRadius: '8px', padding: '12px', minHeight: '160px', background: 'var(--color-surface)', display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '6px', fontSize: '10px', fontFamily: 'var(--font-system)', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                  <div style={{ background: 'var(--color-surface-hover)', borderRadius: '6px', padding: '6px' }}>
                    <div style={{ fontSize: '8px', marginBottom: '4px' }}>Nav</div>
                    <div style={{ background: 'var(--color-surface)', borderRadius: '3px', padding: '3px', marginBottom: '2px', fontSize: '7px' }}>Worlds</div>
                    <div style={{ background: 'var(--color-surface)', borderRadius: '3px', padding: '3px', fontSize: '7px' }}>Chars</div>
                  </div>
                  <div style={{ background: 'var(--color-surface-hover)', borderRadius: '6px', padding: '8px', textAlign: 'center' }}>
                    Main Editor
                  </div>
                  <div style={{ background: 'var(--color-surface-hover)', borderRadius: '6px', padding: '6px' }}>
                    <div style={{ fontSize: '8px', marginBottom: '4px' }}>Inspector</div>
                    <div style={{ background: 'var(--color-surface)', borderRadius: '3px', padding: '8px', fontSize: '7px' }}>Props</div>
                  </div>
                </div>
              </div>
              <div className="ds2-archetype-info">
                <div className="ds2-archetype-name">Creator Studio</div>
                <div className="ds2-archetype-desc">Multi-panel workspace for world building. Navigation sidebar, main editor, and properties inspector all visible.</div>
              </div>
            </div>

            {/* Library Landing — Magazine Spread */}
            <div className="ds2-archetype-card ds2-reveal">
              <div className="ds2-archetype-preview">
                <div style={{ border: 'none', borderRadius: '8px', padding: '12px', minHeight: '160px', background: 'var(--color-surface)', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '10px', fontFamily: 'var(--font-system)', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                  <div style={{ background: 'var(--color-surface-hover)', borderRadius: '6px', padding: '8px', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '6px' }}>
                    <div style={{ fontFamily: 'var(--font-narrative)', fontSize: '11px', fontWeight: 400, color: 'var(--color-text-primary)' }}>Lead Feature</div>
                    <div style={{ background: 'var(--color-border)', borderRadius: '4px', minHeight: 30 }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                    {['18', '7', '3', '42'].map((n, i) => (
                      <div key={i} style={{ fontFamily: 'var(--font-narrative)', fontSize: '20px', fontWeight: 400, color: 'var(--color-text-primary)', textAlign: 'center', padding: '4px 0' }}>{n}</div>
                    ))}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    <div style={{ background: 'var(--color-surface-hover)', borderRadius: '6px', padding: '6px', textAlign: 'center', fontSize: '8px' }}>Recent A</div>
                    <div style={{ background: 'var(--color-surface-hover)', borderRadius: '6px', padding: '6px', textAlign: 'center', fontSize: '8px' }}>Recent B</div>
                  </div>
                </div>
              </div>
              <div className="ds2-archetype-info">
                <div className="ds2-archetype-name">Library Landing</div>
                <div className="ds2-archetype-desc">A premium magazine spread: oversize narrative-serif headlines, display-scale numeric callouts without tile chrome, and a hero-photo lead feature in a 2-col Bento grid.</div>
              </div>
            </div>
          </div>

          {/* Library Landing primitives */}
          <h3 className="ds2-reveal" style={{ fontFamily: 'var(--font-narrative)', fontSize: '1.5rem', fontWeight: 400, margin: '32px 0 8px', color: 'var(--color-text-primary)', letterSpacing: '-0.005em' }}>
            Library Landing primitives
          </h3>
          <p className="ds2-reveal" style={{ fontFamily: 'var(--font-narrative)', fontSize: '14px', lineHeight: 1.65, color: 'var(--color-text-secondary)', margin: '0 0 16px' }}>
            Two reusable display-scale patterns the Library Landing introduces to the DS2 vocabulary.
          </p>
          <div className="ds2-reveal" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 24 }}>

            {/* Editorial display numerals */}
            <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-lg, 12px)', overflow: 'hidden' }}>
              <div style={{ padding: '24px 20px', background: 'var(--color-surface-hover)' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 32px', alignItems: 'baseline' }}>
                  {[['18', 'Worlds'], ['7', 'Characters']].map(([n, l]) => (
                    <div key={l} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontFamily: 'var(--font-narrative)', fontSize: '40px', fontWeight: 400, lineHeight: 1, color: 'var(--color-text-primary)', letterSpacing: '-0.02em' }}>{n}</span>
                      <span style={{ fontFamily: 'var(--font-system)', fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>{l}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ padding: '16px 20px' }}>
                <div style={{ fontFamily: 'var(--font-system)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)', fontWeight: 500 }}>Editorial display numerals</div>
                <p style={{ fontFamily: 'var(--font-narrative)', fontSize: '14px', lineHeight: 1.65, color: 'var(--color-text-secondary)', margin: '6px 0 8px' }}>Narrative-serif numerals at <code>clamp(2.5rem, 4.5vw, 3.5rem)</code> with no tile chrome — read as magazine pull-quotes.</p>
                <code style={{ fontFamily: 'var(--font-system)', fontSize: '11px', color: 'var(--color-text-muted)', display: 'block', lineHeight: 1.5 }}>font-size: clamp(2.5rem, 4.5vw, 3.5rem);<br />font-family: var(--font-narrative);</code>
              </div>
            </div>

            {/* Hero-photo lead feature */}
            <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-lg, 12px)', overflow: 'hidden' }}>
              <div style={{ position: 'relative', overflow: 'hidden', minHeight: 120, background: 'var(--color-surface-hover)' }}>
                <div style={{ position: 'absolute', inset: 0, left: '64%', background: 'linear-gradient(135deg, var(--color-border) 0%, var(--color-border-strong) 100%)' }} />
                <div style={{ position: 'relative', padding: '20px 36% 20px 20px' }}>
                  <div style={{ fontFamily: 'var(--font-narrative)', fontSize: '20px', fontWeight: 400, color: 'var(--color-text-primary)', letterSpacing: '-0.005em' }}>Lead Feature</div>
                  <div style={{ fontFamily: 'var(--font-system)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)', marginTop: 4 }}>Subhead</div>
                </div>
              </div>
              <div style={{ padding: '16px 20px' }}>
                <div style={{ fontFamily: 'var(--font-system)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)', fontWeight: 500 }}>Hero-photo lead</div>
                <p style={{ fontFamily: 'var(--font-narrative)', fontSize: '14px', lineHeight: 1.65, color: 'var(--color-text-secondary)', margin: '6px 0 8px' }}>A full-width banner with the visual asset as a 36% right-edge image strip + a soft gradient fade. Reads as a magazine cover feature.</p>
                <code style={{ fontFamily: 'var(--font-system)', fontSize: '11px', color: 'var(--color-text-muted)', display: 'block', lineHeight: 1.5 }}>padding-right: 38%;<br />.bg {'{ width: 36%; }'}</code>
              </div>
            </div>

          </div>

          {/* Note: Breakpoints moved to Grid section */}
        </div>
      </section >

      {/* ════════════════════════════════════════════════════
          LAYOUT PATTERNS
          ════════════════════════════════════════════════════ */}
      < section id="ds2-variables" className="ds2-section" >
        <div className="ds2-section-inner">
          <div className="ds2-section-number ds2-reveal">10 — Tokens</div>
          <h2 className="ds2-section-title ds2-reveal">CSS Variables</h2>
          <p className="ds2-section-subtitle ds2-reveal">
            Design tokens as CSS custom properties. Theme-aware and globally accessible.
          </p>

          <details className="ds2-reveal">
            <summary className="ds2-component-label" style={{ cursor: 'pointer', userSelect: 'none' }}>Core Variables</summary>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '16px', marginTop: '12px', marginBottom: '32px' }}>
              <div className="ds2-code">
                {`/* Typography */
--font-narrative: 'Crimson Pro', serif
--font-system: 'JetBrains Mono', monospace
--font-interface: 'Manrope', sans-serif

/* Surfaces */
--color-canvas: #FAF8F3
--color-surface: #FFFDF7
--color-surface-hover: #F5F1E8

/* Text */
--color-text-primary: #2D2520
--color-text-secondary: #6B5D52
--color-text-muted: #9C8D7E`}
              </div>
              <div className="ds2-code">
                {`/* Borders */
--color-border: #E0D5C7
--color-border-strong: #D4C9BA

/* Accent (Olive Moss) */
--color-accent: #7C8B6F
--color-accent-hover: #6A7760
--color-accent-soft: rgba(124, 139, 111, 0.12)

/* Overlays */
--color-overlay-surface: rgba(255, 253, 247, 0.90)
--color-overlay-surface-strong: rgba(255, 253, 247, 0.95)
--shadow-soft: 0 8px 24px rgba(45, 37, 32, 0.08)`}
              </div>
            </div>
          </details>

          <details className="ds2-reveal">
            <summary className="ds2-component-label" style={{ cursor: 'pointer', userSelect: 'none' }}>Spacing & Layout</summary>
            <div className="ds2-code" style={{ marginTop: '12px' }}>
              {`/* Spacing (8px base grid) */
--space-1: 8px
--space-2: 16px
--space-3: 24px
--space-4: 32px
--space-6: 48px
--space-8: 64px

/* Border Radius */
--border-radius-sm: 8px
--border-radius-md: 12px
--border-radius-lg: 16px

/* Shadows */
--shadow-soft: 0 8px 24px rgba(45, 37, 32, 0.08)
--shadow-elevated: 0 16px 48px rgba(45, 37, 32, 0.12)`}
            </div>
          </details>
        </div>
      </section >

      {/* ════════════════════════════════════════════════════
          CSS VARIABLES
          ════════════════════════════════════════════════════ */}
      < section id="ds2-overlay" className="ds2-section" >
        <div className="ds2-section-inner">
          <div className="ds2-section-number ds2-reveal">11 — Manuscript Overlay</div>
          <h2 className="ds2-section-title ds2-reveal">Overlay System</h2>
          <p className="ds2-section-subtitle ds2-reveal">
            The real <code>SimpleModal</code> and <code>PreviewModal</code> the app ships, themed by the Warm Earth tokens.
          </p>

          <div className="ds2-reveal" style={{ marginBottom: '32px' }}>
            <OverlayShowcase theme="ds2" />
          </div>

          <details className="ds2-reveal">
            <summary className="ds2-component-label" style={{ cursor: 'pointer', userSelect: 'none' }}>Overlay Tokens</summary>
            <div className="ds2-code" style={{ marginTop: '12px' }}>
              {`/* Manuscript Shell */
background: var(--gradient-manuscript), var(--color-canvas);

/* HUD & Rail */
background: var(--color-overlay-surface);    /* 90% opacity */
backdrop-filter: blur(16px);
border-radius: 12px;

/* Action Rail */
background: var(--color-overlay-surface-strong);  /* 95% opacity */
backdrop-filter: blur(20px);
box-shadow: var(--shadow-soft);

/* Drawer */
background: var(--color-surface);
box-shadow: var(--shadow-elevated);`}
            </div>
          </details>

          <div className="ds2-reveal" style={{ marginTop: '32px' }}>
            <div className="ds2-component-label">Class System</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              {[
                { label: 'Scaffold', items: ['.manuscript-viewport-layer', '.manuscript-viewport-shell', '.manuscript-viewport-inner'] },
                { label: 'Regions', items: ['.manuscript-overlay-header', '.manuscript-overlay-main', '.manuscript-main-stage'] },
                { label: 'Interactions', items: ['.manuscript-drawer-panel', '.manuscript-action-rail', '.manuscript-suggested-action'] },
              ].map((group) => (
                <div key={group.label} className="ds2-component-stage" style={{ padding: '16px' }}>
                  <div className="ds2-component-label">{group.label}</div>
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                    {group.items.map((cls) => (
                      <li key={cls} style={{ fontFamily: 'var(--font-system)', fontSize: '13px', color: 'var(--color-text-primary)', padding: '4px 0', fontWeight: 500 }}>{cls}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section >

      {/* ════════════════════════════════════════════════════
          OVERLAY SYSTEM
          ════════════════════════════════════════════════════ */}
      {/* ════════════════════════════════════════════════════
          MANUSCRIPT PREVIEW
          ════════════════════════════════════════════════════ */}
      <section id="ds2-manuscript" className="ds2-section">
        <div className="ds2-section-inner">
          <div className="ds2-section-number ds2-reveal">12 — Reading Experience</div>
          <h2 className="ds2-section-title ds2-reveal">Session Layout Demo</h2>
          <div id="ds2-main-content" />
          <p className="ds2-section-subtitle ds2-reveal">
            A journal page, not an app. The narrative dominates; choices appear as footnotes below a thin rule. Clicking the character name or Tools in the running head opens floating paper-note panels. No rails, no chrome.
          </p>

          {/* The real game session surface, themed by The Open Journal */}
          <SessionShowcase theme="ds2" />

          {/* Overlay Token Reference */}
          <details className="ds2-reveal" style={{ marginTop: '32px' }}>
            <summary className="ds2-component-label" style={{ cursor: 'pointer', userSelect: 'none' }}>Overlay System</summary>
            <div className="ds2-code" style={{ marginTop: '12px' }}>
              {`/* Manuscript Shell */
background: var(--gradient-manuscript), var(--color-canvas);

/* HUD & Rail */
background: var(--color-overlay-surface);    /* 90% opacity */
backdrop-filter: blur(16px);
border-radius: 12px;

/* Action Rail */
background: var(--color-overlay-surface-strong);  /* 95% opacity */
backdrop-filter: blur(20px);
box-shadow: var(--shadow-soft);`}
            </div>
          </details>

          {/* Class System */}
          <div className="ds2-stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginTop: '32px' }}>
            {[
              { label: 'Scaffold', items: ['.manuscript-viewport-layer', '.manuscript-viewport-shell', '.manuscript-viewport-inner', '.manuscript-overlay-backdrop'] },
              { label: 'Regions', items: ['.manuscript-overlay-header', '.manuscript-overlay-main', '.manuscript-main-stage', '.manuscript-characters-rail'] },
              { label: 'Interactions', items: ['.manuscript-action-rail-streaming', '.manuscript-suggested-action', '.manuscript-overlay-open'] },
            ].map((group) => (
              <div key={group.label} className="ds2-component-stage ds2-reveal" style={{ padding: '16px' }}>
                <div className="ds2-component-label">{group.label}</div>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                  {group.items.map((cls) => (
                    <li key={cls} style={{ fontFamily: 'var(--font-system)', fontSize: '13px', color: 'var(--color-text-primary)', padding: '4px 0', fontWeight: 500 }}>{cls}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section >

      {/* ════════════════════════════════════════════════════
          COMPONENTS
          ════════════════════════════════════════════════════ */}
      <section id="ds2-components" className="ds2-section">
        <div className="ds2-section-inner">
          <div className="ds2-section-number ds2-reveal">13 — Elements</div>
          <h2 className="ds2-section-title ds2-reveal">In Context</h2>
          <p className="ds2-section-subtitle ds2-reveal">
            The real production primitives, themed by the Warm Earth tokens.
          </p>
          <ComponentShowcase theme="ds2" />
        </div>
      </section>

      {/* Footer */}
      < div className="ds2-reveal" style={{ marginTop: '96px', padding: '48px 0', textAlign: 'center', borderTop: '1px solid var(--color-border)' }}>
        <div className="ds2-divider" />
        <p style={{ fontFamily: 'var(--font-system)', fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 600 }}>
          Narraitor Design System — Warm Earth Edition — End of Document
        </p>
      </div >

    </div >
  );
}
