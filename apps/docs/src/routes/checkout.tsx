import { createFileRoute } from '@tanstack/react-router';
import { LicenseCheckoutPage } from '@/components/license-checkout';
import { readLicenseCheckoutDetails } from '@/lib/license-checkout';

export const Route = createFileRoute('/checkout')({
  validateSearch: readLicenseCheckoutDetails,
  head: () => ({ meta: [{ title: 'Configure your license | open-wa' }, { name: 'robots', content: 'noindex' }] }),
  component: Checkout,
});

function Checkout() {
  return <LicenseCheckoutPage initialDetails={Route.useSearch()} />;
}
