import * as React from 'react';
import { ArrowRight, ExternalLink, Info, Ticket } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@open-wa/ui-components/dialog';
import { GENERIC_LICENSE_URL, getLicenseTierHref, getLicenseTierLabel, getLicenseTierSummary, type LicenseTier } from '@/lib/site';
import { LicenseCheckoutTrigger } from '@/components/license-checkout';

function joinClasses(...classes: Array<string | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

export function GetLicenseButton({ href = GENERIC_LICENSE_URL, tier, className, label = 'Get a license', subtle = false, onClick }: {
  href?: string; tier?: LicenseTier; className?: string; label?: string; subtle?: boolean; onClick?: () => void;
}) {
  const requestedTier = new URL(href, GENERIC_LICENSE_URL).searchParams.get('tier');
  const selectedTier = tier ?? (requestedTier === 'insiders' || requestedTier === 'restricted' ? requestedTier : undefined);
  return <LicenseCheckoutTrigger tier={selectedTier} onClick={onClick} className={joinClasses('inline-flex min-h-10 items-center justify-center gap-2 rounded-[10px] border px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', subtle ? 'ow-license-foil' : 'border-primary bg-primary text-primary-foreground hover:opacity-90', className)}><Ticket size={16} aria-hidden="true" />{label}<ArrowRight size={16} aria-hidden="true" /></LicenseCheckoutTrigger>;
}

export function LicenseBadge({ tier, className }: { tier: LicenseTier; className?: string }) {
  return <span data-license-tier={tier} className={joinClasses('ow-license-foil inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[13px] font-semibold', className)}><Ticket size={14} aria-hidden="true" /><span>{getLicenseTierLabel(tier)}</span></span>;
}

const LicenseShader = React.lazy(() => import('./licensed-method-shader'));

class LicenseShaderBoundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? null : this.props.children; }
}

export function LicensedMethodSection({ tier, children, className }: {
  tier: LicenseTier;
  children: React.ReactNode;
  className?: string;
}) {
  const surface = React.useRef<HTMLElement>(null);
  const [animate, setAnimate] = React.useState(false);
  const [infoOpen, setInfoOpen] = React.useState(false);
  const label = getLicenseTierLabel(tier);

  React.useEffect(() => {
    const element = surface.current;
    if (!element) return;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let inView = false;
    const update = () => setAnimate(inView && !preference.matches && document.visibilityState === 'visible');
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      update();
    });
    observer.observe(element);
    preference.addEventListener('change', update);
    document.addEventListener('visibilitychange', update);
    return () => {
      observer.disconnect();
      preference.removeEventListener('change', update);
      document.removeEventListener('visibilitychange', update);
    };
  }, []);

  return (
    <section ref={surface} data-license-tier={tier} data-animate={animate} className={joinClasses('licensed-method-surface', className)}>
      <div className="licensed-method-shader" aria-hidden="true">
        {animate && <LicenseShaderBoundary><React.Suspense fallback={null}><LicenseShader tier={tier} /></React.Suspense></LicenseShaderBoundary>}
      </div>
      <div className="licensed-method-actions not-prose" aria-label={`${label} access`}>
        <LicenseBadge tier={tier} />
        <LicenseCheckoutTrigger tier={tier} className="licensed-method-action" aria-label={`Configure ${label} license`} title="Configure your license">
          <ExternalLink size={15} aria-hidden="true" />
        </LicenseCheckoutTrigger>
        <Dialog open={infoOpen} onOpenChange={setInfoOpen}>
          <DialogTrigger className="licensed-method-action" aria-label={`About ${label} licensing`} title="License details">
            <Info size={16} aria-hidden="true" />
          </DialogTrigger>
          <DialogContent className="license-details-dialog w-[calc(100vw-2rem)] max-w-md gap-4 rounded-2xl p-6">
            <LicenseBadge tier={tier} className="w-fit" />
            <DialogTitle>{label} license details</DialogTitle>
            <DialogDescription>{getLicenseTierSummary(tier)}</DialogDescription>
            <p className="text-sm leading-6 text-muted-foreground">A license covers access to the marked feature. Its availability can also depend on your WhatsApp account and the method’s current limitations.</p>
            <a href="/docs/licensing/licensed-features" className="text-sm font-medium text-primary underline underline-offset-4">Read the feature requirements</a>
            <GetLicenseButton tier={tier} label="Configure your license" onClick={() => setInfoOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>
      <div className="licensed-method-content">{children}</div>
    </section>
  );
}

export function LicensedFeatureCallout({ tier, title, children, className }: { tier: LicenseTier; title?: string; children?: React.ReactNode; className?: string }) {
  return <aside className={joinClasses('license-callout my-5 rounded-2xl p-5 text-left', className)} aria-label={`${getLicenseTierLabel(tier)} licensed feature`}>
    <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between"><div className="space-y-3"><LicenseBadge tier={tier} /><div className="space-y-2"><p className="!m-0 text-base font-semibold text-foreground">{title ?? `${getLicenseTierLabel(tier)} feature`}</p><div className="text-sm leading-6 text-muted-foreground [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">{children ?? getLicenseTierSummary(tier)}</div></div></div><GetLicenseButton href={getLicenseTierHref(tier)} label="See current license options" subtle className="shrink-0" /></div>
  </aside>;
}
export type { LicenseTier };
