import type { LicenseTier } from './site';

export type LicenseCheckoutDetails = {
  tier: LicenseTier | '';
  github: string;
  phone: string;
  useCase: string;
  session: string;
};

export const emptyLicenseDetails: LicenseCheckoutDetails = {
  tier: '', github: '', phone: '', useCase: '', session: '',
};

export const LICENSE_DASHBOARD_URL = 'https://app.openwa.cloud/dashboard';

export function readLicenseCheckoutDetails(search: Record<string, unknown>): LicenseCheckoutDetails {
  // TanStack parses digit-only query values as numbers, including phone numbers.
  const text = (key: string, limit: number) => {
    const value = search[key];
    return typeof value === 'string' || (typeof value === 'number' && Number.isSafeInteger(value))
      ? String(value).replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, limit)
      : '';
  };
  const tier = text('tier', 40);
  return {
    tier: tier === 'insiders' || tier === 'restricted' ? tier : '',
    github: text('github', 39),
    phone: text('phone', 32).replace(/[^\d+ ()-]/g, ''),
    useCase: text('useCase', 1000),
    session: text('session', 160),
  };
}

export function buildLicenseCheckoutUrl(details: LicenseCheckoutDetails): string {
  const url = new URL(LICENSE_DASHBOARD_URL);
  url.searchParams.set('view', 'billing');
  url.searchParams.set('license_checkout', JSON.stringify({
    ...details,
    github: details.github.trim().replace(/^@/, ''),
    phone: details.phone.replace(/\D/g, ''),
  }));
  return url.toString();
}
