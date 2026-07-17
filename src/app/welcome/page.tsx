import { permanentRedirect } from 'next/navigation';

/**
 * Legacy alias for the public landing page (#1528). The Landing experience
 * moved to the root route; keep /welcome redirecting so old links still land
 * on the front door.
 */
export default function WelcomePage() {
  permanentRedirect('/');
}
