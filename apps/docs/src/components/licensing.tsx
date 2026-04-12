import * as React from 'react';
import {
  GENERIC_LICENSE_URL,
  getLicenseTierHref,
  getLicenseTierLabel,
  getLicenseTierSummary,
  type LicenseTier,
} from '@/lib/site';

function joinClasses(...classes: Array<string | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

export function GetLicenseButton({
  href = GENERIC_LICENSE_URL,
  className,
  label = 'Get License',
  subtle = false,
}: {
  href?: string;
  className?: string;
  label?: string;
  subtle?: boolean;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={joinClasses(
        'inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-medium transition-colors',
        subtle
          ? 'border-fd-border bg-fd-card text-fd-foreground hover:bg-fd-accent hover:text-fd-accent-foreground'
          : 'border-fd-primary bg-fd-primary text-fd-primary-foreground hover:opacity-90',
        className,
      )}
    >
      {label}
    </a>
  );
}

export function LicenseBadge({
  tier,
  className,
}: {
  tier: LicenseTier;
  className?: string;
}) {
  return (
    <span
      className={joinClasses(
        'inline-flex items-center gap-1 rounded-full border border-fd-border bg-fd-secondary px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-fd-secondary-foreground',
        className,
      )}
    >
      <span aria-hidden="true">🏅</span>
      <span>{getLicenseTierLabel(tier)}</span>
    </span>
  );
}

export function LicensedFeatureCallout({
  tier,
  title,
  children,
  className,
}: {
  tier: LicenseTier;
  title?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <aside
      className={joinClasses(
        'rounded-2xl border border-fd-border bg-fd-card p-5 text-left shadow-sm',
        className,
      )}
      aria-label={`${getLicenseTierLabel(tier)} licensed feature`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <LicenseBadge tier={tier} />
            <span className="text-sm font-medium text-fd-muted-foreground">
              Licensed feature availability
            </span>
          </div>
          <div className="space-y-2">
            <p className="text-base font-semibold text-fd-foreground">
              {title ?? `${getLicenseTierLabel(tier)} feature`}
            </p>
            <p className="text-sm leading-6 text-fd-muted-foreground">
              {children ?? getLicenseTierSummary(tier)}
            </p>
          </div>
        </div>
        <GetLicenseButton
          href={getLicenseTierHref(tier)}
          label={`Get ${getLicenseTierLabel(tier)} License`}
          subtle
          className="shrink-0"
        />
      </div>
    </aside>
  );
}

export type { LicenseTier };
