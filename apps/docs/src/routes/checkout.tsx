import { createFileRoute } from '@tanstack/react-router';

/**
 * The customer checkout is owned by the authenticated webapp. Keep this
 * legacy main-domain entry point pointed at that route instead of duplicating
 * Polar checkout setup in the docs deployment.
 *
 * Preserve only non-secret runtime context for the account webapp. API and
 * licence keys are deliberately excluded from the redirect.
 */
export const LICENSE_CHECKOUT_URL = 'https://openwa.cloud/onboarding';

function checkoutRedirect(requestUrl: string) {
  const source = new URL(requestUrl);
  const target = new URL(LICENSE_CHECKOUT_URL);
  const session = source.searchParams.get('session')
    ?.replace(/[\u0000-\u001f\u007f]/g, '')
    .trim()
    .slice(0, 160);
  const phone = source.searchParams.get('phone')?.replace(/\D/g, '').slice(0, 32);
  if (session) target.searchParams.set('session', session);
  if (phone) target.searchParams.set('phone', phone);
  return target;
}

export const Route = createFileRoute('/checkout')({
  server: {
    handlers: {
      GET({ request }) {
        return Response.redirect(checkoutRedirect(request.url), 302);
      },
    },
  },
});
