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

const productTiers: Record<LicenseTier, string> = {
  insiders: 'Insiders Program',
  restricted: '1 Restricted License Key',
};

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

export function buildGumroadCheckoutUrl(details: LicenseCheckoutDetails): string {
  const url = new URL('https://smashah.gumroad.com/l/open-wa');
  url.searchParams.set('wanted', 'true');
  // Gumroad resolves variant names to product options; legacy tier= is ignored.
  if (details.tier) url.searchParams.set('variant', productTiers[details.tier]);
  // Custom fields are matched by their exact configured labels.
  url.searchParams.set('Github Username', details.github.trim().replace(/^@/, ''));
  url.searchParams.set('Number (e.g 447712345678)', details.phone.replace(/\D/g, ''));
  url.searchParams.set('Reason/Use case', [details.useCase.trim().replace(/\s+/g, ' '), details.session ? `Session: ${details.session}` : ''].filter(Boolean).join(' | '));
  return url.toString();
}
