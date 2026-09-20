import React from 'react';
import fs from 'fs';
import path from 'path';
import { render, screen } from '@testing-library/react';
import { useToast } from '@/components/ui/toast';
import { Badge } from '@/components/ui/badge';
import activeGameSessionMeta from '../05-pages/game-session/ActiveGameSession.stories';
import { CompleteShowcase } from '../00-foundation/DesignSystemShowcase.stories';
import {
  Default as BadgeDefault,
  Variants as BadgeVariants,
  Sizes as BadgeSizes,
  WithCounts as BadgeWithCounts,
  SkillRequirements as BadgeSkillRequirements,
  EntityTypes as BadgeEntityTypes,
} from '../01-atoms/display/Badge.stories';

describe('Storybook regressions (#1389)', () => {
  describe('1. .storybook/preview.tsx CSS imports', () => {
    const previewPath = path.resolve(__dirname, '../../../.storybook/preview.tsx');
    const badgeCssPath = path.resolve(__dirname, '../../app/badge.css');
    const sharedTokensPath = path.resolve(__dirname, '../../lib/theme/themes/_shared-tokens.css');

    it('loads preview.tsx and required CSS files from disk', () => {
      expect(fs.existsSync(previewPath)).toBe(true);
      expect(fs.existsSync(badgeCssPath)).toBe(true);
      expect(fs.existsSync(sharedTokensPath)).toBe(true);
    });

    it('imports badge.css in preview.tsx so Badge variants receive styling', () => {
      const previewContent = fs.readFileSync(previewPath, 'utf-8');
      expect(previewContent).toMatch(/import\s+['"][^'"]*badge\.css['"]/);
    });

    it('imports _shared-tokens.css in preview.tsx so radius and space tokens resolve', () => {
      const previewContent = fs.readFileSync(previewPath, 'utf-8');
      expect(previewContent).toMatch(/import\s+['"][^'"]*_shared-tokens\.css['"]/);
    });

    it('defines base .badge and variant classes in badge.css', () => {
      const badgeCss = fs.readFileSync(badgeCssPath, 'utf-8');
      expect(badgeCss).toContain('.badge {');
      expect(badgeCss).toContain('.badge-default');
      expect(badgeCss).toContain('.badge-secondary');
      expect(badgeCss).toContain('.badge-destructive');
      expect(badgeCss).toContain('.badge-outline');
      expect(badgeCss).toContain('.badge-success');
      expect(badgeCss).toContain('.badge-warning');
      expect(badgeCss).toContain('.badge-info');
      expect(badgeCss).toContain('.badge-available');
      expect(badgeCss).toContain('.badge-unavailable');
      expect(badgeCss).toContain('.badge-skill-requirement');
    });

    it('defines size classes in badge.css', () => {
      const badgeCss = fs.readFileSync(badgeCssPath, 'utf-8');
      expect(badgeCss).toContain('.badge-sm');
      expect(badgeCss).toContain('.badge-md');
      expect(badgeCss).toContain('.badge-lg');
    });

    it('defines full radius and spacing tokens in _shared-tokens.css', () => {
      const tokensCss = fs.readFileSync(sharedTokensPath, 'utf-8');
      expect(tokensCss).toMatch(/--radius-full:\s*9999px/);
      expect(tokensCss).toMatch(/--space-1:\s*0\.25rem/);
    });
  });

  describe('2. DesignSystemShowcase swatch rendering', () => {
    const showcasePath = path.resolve(
      __dirname,
      '../00-foundation/DesignSystemShowcase.stories.tsx'
    );

    it('uses div-based backgrounds instead of SVG rect fill for color swatches in source', () => {
      const showcaseContent = fs.readFileSync(showcasePath, 'utf-8');
      expect(showcaseContent).not.toMatch(/<rect\s+[^>]*fill="#"/);
      expect(showcaseContent).not.toMatch(/<rect\s+[^>]*fill=\{/);
      expect(showcaseContent).toContain('ds-css-var-swatch');
      expect(showcaseContent).toContain('background: `var(${token})`');
    });

    it('renders color token swatches as div elements with CSS custom property backgrounds', () => {
      const renderFn = CompleteShowcase.render as () => React.ReactElement;
      const { container } = render(renderFn());

      const swatchContainers = container.querySelectorAll('.ds-css-var-swatch');
      expect(swatchContainers.length).toBeGreaterThan(20);

      const swatchChips = container.querySelectorAll('.ds-css-var-swatch-chip');
      expect(swatchChips.length).toBe(swatchContainers.length);

      swatchChips.forEach((chip) => {
        expect(chip.tagName.toLowerCase()).toBe('div');
        expect(chip.getAttribute('role')).toBe('img');
        const ariaLabel = chip.getAttribute('aria-label');
        expect(ariaLabel).toMatch(/^--[a-z0-9-]+ swatch$/);

        // Ensure no nested SVG rect inside the color swatch chip
        expect(chip.querySelector('svg')).toBeNull();
        expect(chip.querySelector('rect')).toBeNull();
      });

      // Verify token text labels accompany the swatch chips
      const tokenLabels = Array.from(swatchContainers).map(
        (swatch) => swatch.querySelector('div:last-child')?.textContent?.trim()
      );
      expect(tokenLabels).toContain('--color-accent');
      expect(tokenLabels).toContain('--color-canvas');
      expect(tokenLabels).toContain('--ending-triumphant');
      expect(tokenLabels).toContain('--lore-characters-bg');
    });

    it('confirms SVG rects in showcase are reserved for spacing scale bars and not color swatches', () => {
      const renderFn = CompleteShowcase.render as () => React.ReactElement;
      const { container } = render(renderFn());

      const svgRects = container.querySelectorAll('svg rect');
      expect(svgRects.length).toBeGreaterThan(0);
      svgRects.forEach((rect) => {
        const fillAttr = rect.getAttribute('fill');
        expect(fillAttr).toBeNull();
      });
    });
  });

  describe('3. ActiveGameSession story decorators include ToastProvider', () => {
    const activeGameSessionPath = path.resolve(
      __dirname,
      '../05-pages/game-session/ActiveGameSession.stories.tsx'
    );

    it('imports ToastProvider in ActiveGameSession.stories.tsx source', () => {
      const content = fs.readFileSync(activeGameSessionPath, 'utf-8');
      expect(content).toMatch(/import\s*\{[^}]*ToastProvider[^}]*\}\s*from\s*['"]@\/components\/ui\/toast['"]/);
    });

    it('includes a ToastProvider decorator in story meta', () => {
      const decorators = activeGameSessionMeta.decorators;
      expect(Array.isArray(decorators)).toBe(true);
      expect(decorators && decorators.length).toBeGreaterThan(0);
    });

    it('provides a functioning ToastProvider decorator preventing useToast crashes', () => {
      const ToastConsumer: React.FC = () => {
        const toast = useToast();
        return React.createElement(
          'button',
          { type: 'button', onClick: () => toast.success('Test Toast') },
          'Toast Ready'
        );
      };

      // Suppress console.error for expected throwing test
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => render(React.createElement(ToastConsumer))).toThrow(
        'useToast must be used within a ToastProvider'
      );
      consoleErrorSpy.mockRestore();

      const decorators = activeGameSessionMeta.decorators as Array<(Story: React.ComponentType) => React.ReactElement>;
      const toastDecorator = decorators[0];

      const WrappedStory = () => toastDecorator(ToastConsumer);
      render(React.createElement(WrappedStory));

      expect(screen.getByRole('button', { name: 'Toast Ready' })).toBeInTheDocument();
    });
  });

  describe('4. Badge.stories.tsx renders badge classes properly', () => {
    it('renders default badge story with base and variant classes', () => {
      const { container } = render(
        React.createElement(Badge, BadgeDefault.args, BadgeDefault.args?.children || 'Badge')
      );
      const badge = container.querySelector('.badge');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('badge', 'badge-default', 'badge-md');
      expect(badge).toHaveTextContent('Badge');
    });

    it('renders all 7 core badge variants with correct classes', () => {
      const renderFn = BadgeVariants.render as () => React.ReactElement;
      const { container } = render(renderFn());

      const expectedVariants = [
        'default',
        'secondary',
        'destructive',
        'outline',
        'success',
        'warning',
        'info',
      ];

      expectedVariants.forEach((variant) => {
        const badge = container.querySelector(`.badge.badge-${variant}`);
        expect(badge).toBeInTheDocument();
        expect(badge).toHaveClass('badge', `badge-${variant}`, 'badge-md');
      });
    });

    it('renders all badge sizes with correct classes', () => {
      const renderFn = BadgeSizes.render as () => React.ReactElement;
      const { container } = render(renderFn());

      ['sm', 'md', 'lg'].forEach((size) => {
        const badge = container.querySelector(`.badge.badge-${size}`);
        expect(badge).toBeInTheDocument();
        expect(badge).toHaveClass('badge', `badge-${size}`);
      });
    });

    it('renders badge count badges with .badge-count element', () => {
      const renderFn = BadgeWithCounts.render as () => React.ReactElement;
      const { container } = render(renderFn());

      const counts = container.querySelectorAll('.badge-count');
      expect(counts.length).toBe(4);
      const countTexts = Array.from(counts).map((el) => el.textContent?.trim());
      expect(countTexts).toEqual(['8', '6', '9', '7']);
    });

    it('renders skill requirement badges with game-specific classes', () => {
      const renderFn = BadgeSkillRequirements.render as () => React.ReactElement;
      const { container } = render(renderFn());

      const availableBadges = container.querySelectorAll('.badge.badge-available');
      const unavailableBadges = container.querySelectorAll('.badge.badge-unavailable');

      expect(availableBadges.length).toBe(2);
      expect(unavailableBadges.length).toBe(1);
    });

    it('renders entity type badges with semantic variant classes', () => {
      const renderFn = BadgeEntityTypes.render as () => React.ReactElement;
      const { container } = render(renderFn());

      expect(container.querySelector('.badge.badge-info')).toHaveTextContent('World');
      expect(container.querySelector('.badge.badge-success')).toHaveTextContent('Character');
      expect(container.querySelector('.badge.badge-warning')).toHaveTextContent('Item');
      expect(container.querySelector('.badge.badge-default')).toHaveTextContent('Location');
    });
  });
});
