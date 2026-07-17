import WelcomePage from '@/app/welcome/page';
import { permanentRedirect } from 'next/navigation';

/**
 * /welcome is kept as a legacy alias after the Landing page moved to the
 * root route (#1528): old links must still land on the front door.
 */

jest.mock('next/navigation', () => ({
  permanentRedirect: jest.fn(),
}));

describe('WelcomePage alias (#1528)', () => {
  it('permanently redirects to the root landing page', () => {
    WelcomePage();

    expect(permanentRedirect).toHaveBeenCalledWith('/');
  });
});
