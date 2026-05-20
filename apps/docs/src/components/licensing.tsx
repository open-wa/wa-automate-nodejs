import * as React from 'react';
import {
  GENERIC_LICENSE_URL,
  getLicenseTierHref,
  getLicenseTierLabel,
  getLicenseTierSummary,
  type LicenseTier,
} from '@/lib/site';
import { Popover, PopoverTrigger, PopoverContent, PopoverClose } from './ui/popover';
import { X, ArrowRight, Ticket } from 'lucide-react';

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
  const [github, setGithub] = React.useState('');
  const [number, setNumber] = React.useState('');
  const [reason, setReason] = React.useState('');
  const [open, setOpen] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const searchParams = new URLSearchParams();
    if (github.trim()) searchParams.append('Github Username', github.trim());
    if (number.trim()) searchParams.append('Number (e.g 447712345678)', number.trim());
    if (reason.trim()) searchParams.append('Reason/Use case', reason.trim());

    const queryString = searchParams.toString().replace(/\+/g, '%20');
    let finalUrl = href;
    if (queryString) {
      const separator = href.includes('?') ? '&' : '?';
      finalUrl = `${href}${separator}${queryString}`;
    }

    window.open(finalUrl, '_blank', 'noopener,noreferrer');
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={joinClasses(
            'w-64 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all duration-200 cursor-pointer',
            subtle
              ? 'border-2 border-foreground bg-card text-foreground shadow-stipple hover-stipple'
              : 'border-2 border-foreground bg-primary text-primary-foreground shadow-stipple hover-stipple',
            className,
          )}
        >
          <Ticket className="w-4 h-4" />
          {label}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-[360px] p-0 border-2 border-foreground bg-card rounded-2xl shadow-stipple overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Dither texture overlay */}
        <div className="absolute inset-0 bg-dither opacity-[0.06] pointer-events-none" />

        {/* Header strip */}
        <div className="relative z-10 flex items-center justify-between border-b-2 border-foreground bg-muted px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-foreground bg-primary text-primary-foreground font-mono text-xs font-bold shadow-sm">
              🎫
            </span>
            <span className="font-display font-bold text-foreground text-sm">License Configuration</span>
          </div>
          <PopoverClose className="flex size-7 items-center justify-center rounded-lg border-2 border-foreground bg-background text-foreground transition-all hover:bg-accent cursor-pointer shadow-sm active:translate-y-px">
            <X className="w-3.5 h-3.5" />
          </PopoverClose>
        </div>

        {/* Body */}
        <div className="relative z-10 p-4">
          {/* Wally helper row */}
          <div className="flex items-start gap-3 mb-4 rounded-xl border-2 border-foreground/20 bg-muted/50 p-3">
            <div className="shrink-0 w-10 h-10 rounded-lg overflow-hidden border border-foreground/30 bg-background">
              <img
                src="/wally-woodworker.png"
                alt="Wally the Woodcrafter"
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed font-medium">
              <span className="font-bold text-foreground">Wally says:</span>{' '}
              "Fill in your details below — I'll prefill your Gumroad checkout so you can skip the boring bits!"
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-foreground uppercase tracking-[0.12em] font-display">
                Github Username
              </label>
              <input
                type="text"
                placeholder="e.g. smashah"
                value={github}
                onChange={(e) => setGithub(e.target.value)}
                required
                className="w-full h-10 px-3 rounded-lg border-2 border-foreground/40 bg-background text-sm text-foreground font-mono focus:outline-none focus:border-foreground focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/40"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-foreground uppercase tracking-[0.12em] font-display">
                Number (e.g 447712345678)
              </label>
              <input
                type="text"
                placeholder="e.g. 447712345678"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                required
                className="w-full h-10 px-3 rounded-lg border-2 border-foreground/40 bg-background text-sm text-foreground font-mono focus:outline-none focus:border-foreground focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/40"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-foreground uppercase tracking-[0.12em] font-display">
                Reason / Use case
              </label>
              <textarea
                placeholder="Briefly describe your use case"
                value={reason}
                rows={2}
                onChange={(e) => setReason(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-lg border-2 border-foreground/40 bg-background text-sm text-foreground font-mono focus:outline-none focus:border-foreground focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/40 resize-none"
              />
            </div>

            <button
              type="submit"
              className="mt-1 w-full h-11 inline-flex items-center justify-center gap-2 rounded-xl border-2 border-foreground bg-foreground text-background font-display font-bold text-sm transition-all hover:bg-primary hover:border-primary hover:text-primary-foreground active:translate-y-px cursor-pointer shadow-stipple hover:shadow-[6px_6px_0px_0px_var(--color-foreground)] hover:translate-x-[-2px] hover:translate-y-[-2px]"
            >
              <span>Proceed to Gumroad</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </PopoverContent>
    </Popover>
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
        'inline-flex items-center gap-1.5 rounded-lg border-2 border-foreground bg-muted px-2.5 py-1 text-xs font-bold uppercase tracking-[0.1em] text-foreground font-display shadow-sm',
        className,
      )}
    >
      <span aria-hidden="true" className="text-sm">🧵</span>
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
        'rounded-2xl border-backstitch bg-card p-5 text-left shadow-stipple relative overflow-hidden',
        className,
      )}
      aria-label={`${getLicenseTierLabel(tier)} licensed feature`}
    >
      <div className="absolute inset-0 bg-dither opacity-[0.06] pointer-events-none" />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between relative z-10">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <LicenseBadge tier={tier} />
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-[0.1em]">
              Licensed feature
            </span>
          </div>
          <div className="space-y-2">
            <p className="text-base font-display font-bold text-foreground">
              {title ?? `${getLicenseTierLabel(tier)} feature`}
            </p>
            <p className="text-sm leading-6 text-muted-foreground font-medium">
              {children ?? getLicenseTierSummary(tier)}
            </p>
          </div>
        </div>
        <GetLicenseButton
          href={getLicenseTierHref(tier)}
          label={`Get ${getLicenseTierLabel(tier)}`}
          subtle
          className="shrink-0"
        />
      </div>
    </aside>
  );
}

export type { LicenseTier };
