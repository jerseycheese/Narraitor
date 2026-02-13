'use client';

import { useState, useEffect } from 'react';
import { primitiveColors } from '@/lib/design-tokens';

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

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------
const NAV_GROUPS = [
  {
    title: 'FOUNDATIONS',
    items: [
      { id: 'colors', label: 'COLORS' },
      { id: 'typography', label: 'TYPOGRAPHY' },
      { id: 'spacing', label: 'SPACING' },
    ],
  },
  {
    title: 'SYSTEM',
    items: [
      { id: 'variables', label: 'CSS VARIABLES' },
    ],
  },
  {
    title: 'COMPONENTS',
    items: [
      { id: 'components', label: 'CORE UI' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function DesignSystemPage() {
  const [isDark, setIsDark] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);

  useEffect(() => {
    // Check initial theme
    const html = document.documentElement;
    setIsDark(html.classList.contains('dark'));
  }, []);

  useEffect(() => {
    // Close nav on escape key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsNavOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleTheme = () => {
    const html = document.documentElement;
    if (isDark) {
      html.classList.remove('dark');
    } else {
      html.classList.add('dark');
    }
    setIsDark(!isDark);
  };

  const closeNav = () => setIsNavOpen(false);

  // Nav button style matching the HTML prototype
  const navButtonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 12px',
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 4,
    cursor: 'pointer',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    color: 'var(--color-text-primary)',
    transition: 'all 0.15s',
  };

  return (
    <div className="design-system-page" style={{ maxWidth: 1024, margin: '0 auto', padding: '0 16px' }}>
      {/* Sticky nav matching HTML prototype */}
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'var(--color-canvas)',
          borderBottom: '1px solid var(--color-border)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        <div style={{ padding: '12px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* Navigation menu button */}
          <button
            onClick={() => setIsNavOpen(!isNavOpen)}
            className="font-system"
            style={navButtonStyle}
            aria-label="Navigation menu"
            aria-expanded={isNavOpen}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ width: 20, height: 20 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span>NAVIGATION</span>
          </button>

          {/* Theme toggle button */}
          <button
            onClick={toggleTheme}
            className="font-system"
            style={navButtonStyle}
            aria-label="Toggle dark mode"
          >
            {isDark ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ width: 20, height: 20 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ width: 20, height: 20 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
            <span>THEME</span>
          </button>
        </div>

        {/* Dropdown nav */}
        <div
          style={{
            maxHeight: isNavOpen ? 400 : 0,
            overflow: 'hidden',
            transition: 'max-height 0.3s ease-out',
            borderTop: isNavOpen ? '1px solid var(--color-border)' : 'none',
          }}
          aria-hidden={!isNavOpen}
        >
          <div style={{ padding: '24px 0', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
            {NAV_GROUPS.map((group) => (
              <div key={group.title}>
                <h4
                  className="font-system"
                  style={{
                    fontSize: 10,
                    color: 'var(--color-text-muted)',
                    marginBottom: 12,
                    letterSpacing: '0.2em',
                    borderBottom: '1px solid var(--color-border)',
                    paddingBottom: 4,
                  }}
                >
                  {group.title}
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {group.items.map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      onClick={closeNav}
                      tabIndex={isNavOpen ? 0 : -1}
                      className="font-system"
                      style={{
                        fontSize: 12,
                        color: 'var(--color-text-secondary)',
                        textDecoration: 'none',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {item.label}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </nav>

      {/* ================================================================= */}
      {/* COLORS                                                            */}
      {/* ================================================================= */}
      <Section id="colors" title="Color Palette">
        <SubSection title="Base Colors" description="Core surface and border colors used across the app.">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 16 }}>
            <Swatch color="#fafafa" name="zinc-50" hex="#fafafa" note="Canvas (light)" />
            <Swatch color="#ffffff" name="white" hex="#ffffff" note="Surfaces" />
            <Swatch color="#f4f4f5" name="zinc-100" hex="#f4f4f5" note="Hover states" />
            <Swatch color="#e4e4e7" name="zinc-200" hex="#e4e4e7" note="Borders" />
            <Swatch color="#d4d4d8" name="zinc-300" hex="#d4d4d8" note="Input borders" />
          </div>
        </SubSection>

        <SubSection title="Full Zinc Neutral Scale" description="Complete neutral ramp used for surfaces, typography, borders, and dark mode tokens.">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 12 }}>
            {Object.entries(primitiveColors.zinc).map(([stop, hex]) => (
              <ZincCard key={stop} stop={stop} hex={hex} />
            ))}
          </div>
        </SubSection>

        <SubSection title="Text Colors">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 16 }}>
            <Swatch color="#111111" name="Charcoal" hex="#111111" note="Primary text" />
            <Swatch color={primitiveColors.zinc[700]} name="zinc-700" hex={primitiveColors.zinc[700]} note="Secondary text" />
            <Swatch color={primitiveColors.zinc[500]} name="zinc-500" hex={primitiveColors.zinc[500]} note="Muted text" />
          </div>
        </SubSection>

        <SubSection title="Accent Color (Archival Ink)" description="Single functional accent for interactions. Uses CSS variable so it adapts to theme.">
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
        </SubSection>

        <SubSection title="Link Styling" description="Global anchor styling using the accent token. Underline with offset for readability.">
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
        </SubSection>

        <SubSection title="Semantic Colors" description="Status and feedback colors.">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 16 }}>
            <Swatch color="#065f46" name="emerald-800" hex="#065f46" note="Success" />
            <Swatch color="#9f1239" name="rose-800" hex="#9f1239" note="Error" />
            <Swatch color="#92400e" name="amber-800" hex="#92400e" note="Warning" />
            <Swatch color="#075985" name="sky-800" hex="#075985" note="Info" />
          </div>
        </SubSection>

        <SubSection title="Contrast Pairing Matrix" description="WCAG contrast ratios for core text/UI pairings. Re-check exact pairs in WebAIM before production migration.">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {[
              ['Text Primary on Canvas', '18.27:1'],
              ['Text Secondary on Canvas', '10.10:1'],
              ['Text Muted on Canvas', '4.68:1'],
              ['White on Accent Button', '11.42:1'],
              ['Success on Canvas', '7.43:1'],
              ['Error on Canvas', '7.76:1'],
              ['Warning on Canvas', '6.86:1'],
              ['Info on Canvas', '7.32:1'],
            ].map(([label, ratio]) => (
              <div
                key={label}
                style={{
                  padding: 12,
                  borderRadius: 2,
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  fontSize: 14,
                  color: 'var(--color-text-primary)',
                }}
              >
                {label} <span className="font-system">{ratio}</span> (AA pass)
              </div>
            ))}
          </div>
        </SubSection>
      </Section>

      {/* ================================================================= */}
      {/* TYPOGRAPHY                                                        */}
      {/* ================================================================= */}
      <Section id="typography" title="Typography">
        <SubSection title="Font Families">
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
        </SubSection>

        <SubSection title="Typography Roles" description="Role-based typography utilities map semantic intent to font and rhythm.">
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
        </SubSection>

        <SubSection title="Heading Scale">
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
        </SubSection>

        <SubSection title="Body Text" description="Narrative paragraph at reading width.">
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
        </SubSection>
      </Section>

      {/* ================================================================= */}
      {/* SPACING                                                           */}
      {/* ================================================================= */}
      <Section id="spacing" title="Spacing Scale">
        <SubSection description="Base unit: 24px. Scale derived from 4px grid.">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[4, 8, 16, 24, 32, 48, 64, 96].map((px) => (
              <div key={px} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div className="font-system" style={{ fontSize: 12, color: 'var(--color-text-muted)', width: 48, textAlign: 'right', flexShrink: 0 }}>{px}px</div>
                <div style={{ width: px, height: 16, background: 'var(--color-text-muted)', borderRadius: 2, flexShrink: 0 }} />
                <div className="font-system" style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{px / 16}rem</div>
              </div>
            ))}
          </div>
        </SubSection>
      </Section>

      {/* ================================================================= */}
      {/* CSS VARIABLES                                                     */}
      {/* ================================================================= */}
      <Section id="variables" title="CSS Variables">
        <SubSection description="Current custom property definitions from globals.css. These drive both the shadcn layer and the design system layer.">
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
{`:root {
  /* Typography tokens */
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
        </SubSection>
      </Section>

      {/* ================================================================= */}
      {/* COMPONENTS                                                        */}
      {/* ================================================================= */}
      <Section id="components" title="Components">

        {/* Buttons */}
        <SubSection title="Buttons (State Matrix)" description="Primary and secondary variants shown together for default, hover, active, disabled, and loading states.">
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
        </SubSection>

        {/* Inputs */}
        <SubSection title="Form Inputs (Validation States)" description="Validation states pair visual styling with explicit helper text labels so status is never color-only.">
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
        </SubSection>

        {/* Badges, Alerts, Cards */}
        <SubSection title="Badges, Alerts, Cards">
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
        </SubSection>
      </Section>

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
