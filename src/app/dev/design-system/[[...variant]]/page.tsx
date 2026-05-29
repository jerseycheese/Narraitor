import { notFound } from 'next/navigation';
import dynamic from 'next/dynamic';
import { DSToggle, type DSTheme } from '../_ui/DSToggle';
import { ForceTheme } from '../_ui/ForceTheme';

const DS1Page = dynamic(() => import('../DS1Page'));
const DS2Page = dynamic(() => import('../../design-system-2/DS2Page'));
const DS3Page = dynamic(() => import('../../design-system-3/DS3Page'));

function resolveTheme(variant?: string[]): DSTheme | null {
  if (!variant || variant.length === 0) return 'ds1';
  if (variant.length !== 1) return null;
  const v = variant[0].toLowerCase();
  if (v === '1' || v === 'ds1') return 'ds1';
  if (v === '2' || v === 'ds2') return 'ds2';
  if (v === '3' || v === 'ds3') return 'ds3';
  return null;
}

export default async function DesignSystemRoute({
  params,
}: {
  params: Promise<{ variant?: string[] }>;
}) {
  const { variant } = await params;
  const theme = resolveTheme(variant);
  if (!theme) notFound();

  const PageBody =
    theme === 'ds1' ? DS1Page : theme === 'ds2' ? DS2Page : DS3Page;

  return (
    <div className="ds-variant-root" data-ds={theme}>
      <ForceTheme theme={theme} />
      <DSToggle active={theme} />
      <PageBody />
    </div>
  );
}
