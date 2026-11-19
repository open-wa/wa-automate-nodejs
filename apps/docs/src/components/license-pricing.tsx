import * as React from 'react';

const PRICING_URL = 'https://api.openwa.cloud/api/public/license-pricing';
const STORE_URL = 'https://openwa.cloud';

type Tier = { from: number; upTo: number | null; unitAmount: number };
type CommitmentOffer = { minimum: number; unitAmount: number; totalAmount: number; savingAmount: number };
type Pricing = { currency: string; minimum: number; maximum: number; tiers: Tier[]; commitmentOffers: CommitmentOffer[] };

function isPricing(value: unknown): value is Pricing {
  if (!value || typeof value !== 'object') return false;
  const pricing = value as Partial<Pricing>;
  return typeof pricing.currency === 'string'
    && typeof pricing.maximum === 'number'
    && Array.isArray(pricing.tiers) && pricing.tiers.length > 0
    && pricing.tiers.every(tier => typeof tier?.from === 'number' && typeof tier.unitAmount === 'number')
    && Array.isArray(pricing.commitmentOffers);
}

function formatMoney(minorUnits: number, currency: string): string {
  const amount = minorUnits / 100;
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  }).format(amount);
}

/**
 * Per-license monthly prices by volume band, fetched in the browser from the
 * public license-pricing endpoint. While loading, or if the request fails, it
 * shows a link to the store instead of stale numbers.
 */
export function LicensePricing() {
  const [pricing, setPricing] = React.useState<Pricing | null>(null);
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    const controller = new AbortController();
    fetch(PRICING_URL, { signal: controller.signal, headers: { Accept: 'application/json' } })
      .then(response => (response.ok ? response.json() : Promise.reject(new Error(String(response.status)))))
      .then((body: unknown) => {
        if (!isPricing(body)) throw new Error('Unexpected pricing response');
        setPricing(body);
      })
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true);
      });
    return () => controller.abort();
  }, []);

  if (!pricing) {
    return (
      <p className="license-pricing-fallback" aria-live="polite">
        {failed ? 'Prices are not available here right now. ' : 'Loading current prices… '}
        See <a href={STORE_URL}>openwa.cloud</a> for current prices.
      </p>
    );
  }

  const { currency, tiers, commitmentOffers, maximum } = pricing;
  return (
    <table className="license-pricing">
      <thead>
        <tr>
          <th scope="col">Licenses</th>
          <th scope="col">Price per license, per month</th>
          <th scope="col">If you commit to at least this many</th>
        </tr>
      </thead>
      <tbody>
        {tiers.map(tier => {
          const upTo = tier.upTo ?? maximum;
          const offer = commitmentOffers.find(item => item.minimum === tier.from);
          return (
            <tr key={tier.from}>
              <td>{tier.from === upTo ? tier.from : `${tier.from}–${upTo}`}</td>
              <td>{formatMoney(tier.unitAmount, currency)}</td>
              <td>
                {offer
                  ? `Every license at ${formatMoney(offer.unitAmount, currency)}`
                  : '—'}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
