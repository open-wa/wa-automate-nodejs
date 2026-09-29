import * as React from 'react';
import { ArrowRight, Ticket } from 'lucide-react';
import { GENERIC_LICENSE_URL, getLicenseTierHref, getLicenseTierLabel, getLicenseTierSummary, type LicenseTier } from '@/lib/site';

function joinClasses(...classes: Array<string | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

export function GetLicenseButton({ href = GENERIC_LICENSE_URL, className, label = 'Get a license', subtle = false }: {
  href?: string; className?: string; label?: string; subtle?: boolean;
}) {
  return <a href={href} className={joinClasses('inline-flex min-h-10 items-center justify-center gap-2 rounded-[10px] border px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', subtle ? 'ow-license-foil' : 'border-primary bg-primary text-primary-foreground hover:opacity-90', className)}><Ticket size={16} aria-hidden="true" />{label}<ArrowRight size={16} aria-hidden="true" /></a>;
}

export function LicenseBadge({ tier, className }: { tier: LicenseTier; className?: string }) {
  return <span className={joinClasses('ow-license-foil inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[13px] font-semibold', className)}><Ticket size={14} aria-hidden="true" /><span>{getLicenseTierLabel(tier)}</span></span>;
}

export function LicensedFeatureCallout({ tier, title, children, className }: { tier: LicenseTier; title?: string; children?: React.ReactNode; className?: string }) {
  return <aside className={joinClasses('license-callout my-5 rounded-2xl p-5 text-left', className)} aria-label={`${getLicenseTierLabel(tier)} licensed feature`}>
    <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between"><div className="space-y-3"><LicenseBadge tier={tier} /><div className="space-y-2"><p className="!m-0 text-base font-semibold text-foreground">{title ?? `${getLicenseTierLabel(tier)} feature`}</p><div className="text-sm leading-6 text-muted-foreground [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">{children ?? getLicenseTierSummary(tier)}</div></div></div><GetLicenseButton href={getLicenseTierHref(tier)} label="See current license options" subtle className="shrink-0" /></div>
  </aside>;
}
export type { LicenseTier };
