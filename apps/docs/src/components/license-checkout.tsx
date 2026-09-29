import * as React from 'react';
import { ArrowUpRight, Ticket } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@open-wa/ui-components/dialog';
import { buildGumroadCheckoutUrl, emptyLicenseDetails, type LicenseCheckoutDetails } from '@/lib/license-checkout';

type CheckoutContext = { openCheckout: (details: Partial<LicenseCheckoutDetails>, trigger: HTMLElement) => void };
const LicenseCheckoutContext = React.createContext<CheckoutContext | null>(null);

function CheckoutIntroduction() {
  return <div className="license-config-intro">
    <img src="/mascots/wally-quickstart-transparent.png" width="92" height="92" alt="Wally, the open-wa mascot" />
    <p>Add your details once. Wally will have them ready for you at checkout!</p>
  </div>;
}

export function LicenseCheckoutForm({ details, onChange }: {
  details: LicenseCheckoutDetails;
  onChange: (details: LicenseCheckoutDetails) => void;
}) {
  const id = React.useId();
  const [error, setError] = React.useState('');
  function update(key: keyof LicenseCheckoutDetails, value: string) {
    setError('');
    onChange({ ...details, [key]: value });
  }
  return <form className="license-config-form" onSubmit={(event) => {
    event.preventDefault();
    if (!/^[+\d ()-]+$/.test(details.phone) || !/^[1-9]\d{6,14}$/.test(details.phone.replace(/\D/g, ''))) {
      setError('Enter an international WhatsApp number, including its country code.');
      event.currentTarget.querySelector<HTMLInputElement>('[name="phone"]')?.focus();
      return;
    }
    window.location.assign(buildGumroadCheckoutUrl(details));
  }}>
    <label htmlFor={`${id}-tier`}>License</label>
    <select id={`${id}-tier`} value={details.tier} required onChange={(event) => update('tier', event.target.value)}>
      <option value="" disabled>Choose a license</option>
      <option value="insiders">Insiders</option>
      <option value="restricted">Restricted</option>
    </select>
    <label htmlFor={`${id}-github`}>GitHub username</label>
    <input id={`${id}-github`} name="github" value={details.github} onChange={(event) => update('github', event.target.value)} placeholder="Your GitHub username" required maxLength={40} pattern="@?[A-Za-z0-9]([A-Za-z0-9]|-(?=[A-Za-z0-9])){0,38}" autoCapitalize="none" spellCheck={false} autoComplete="username" />
    <label htmlFor={`${id}-phone`}>WhatsApp number</label>
    <input id={`${id}-phone`} name="phone" value={details.phone} onChange={(event) => update('phone', event.target.value)} placeholder="e.g. +44 7700 900123" required type="tel" inputMode="tel" autoComplete="tel" maxLength={32} aria-describedby={`${id}-phone-help${error ? ` ${id}-error` : ''}`} aria-invalid={error ? true : undefined} />
    <p id={`${id}-phone-help`} className="license-config-help">Include the country code. Use the WhatsApp account you want to license.</p>
    <label htmlFor={`${id}-use-case`}>What will you use open-wa for?</label>
    <textarea id={`${id}-use-case`} name="useCase" value={details.useCase} onChange={(event) => update('useCase', event.target.value)} placeholder="e.g. Send order updates from our shop" required maxLength={1000} rows={3} />
    {details.session ? <p className="license-config-help">Session: <code>{details.session}</code>. This reference will be included with your use case.</p> : null}
    {error ? <p id={`${id}-error`} role="alert" className="license-config-error">{error}</p> : null}
    <button type="submit" className="license-config-submit">Continue to Gumroad <ArrowUpRight size={18} aria-hidden="true" /></button>
    <p className="license-config-help license-config-footer">Your details will be prefilled. Review the license and current price before paying.</p>
  </form>;
}

export function LicenseCheckoutProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const [details, setDetails] = React.useState<LicenseCheckoutDetails>(emptyLicenseDetails);
  const trigger = React.useRef<HTMLElement | null>(null);
  const openCheckout = React.useCallback((initial: Partial<LicenseCheckoutDetails>, element: HTMLElement) => {
    trigger.current = element;
    setDetails((current) => ({ ...current, ...initial }));
    setOpen(true);
  }, []);
  const context = React.useMemo(() => ({ openCheckout }), [openCheckout]);
  return <LicenseCheckoutContext.Provider value={context}>
    {children}
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="license-config-popup" finalFocus={() => trigger.current?.isConnected ? trigger.current : document.querySelector<HTMLElement>('[data-license-trigger]')}>
        <div className="license-config-heading"><Ticket size={21} aria-hidden="true" /><DialogTitle>Configure your license</DialogTitle></div>
        <DialogDescription className="sr-only">Fill in your license details, then continue to a prefilled Gumroad checkout.</DialogDescription>
        <CheckoutIntroduction />
        <LicenseCheckoutForm details={details} onChange={setDetails} />
      </DialogContent>
    </Dialog>
  </LicenseCheckoutContext.Provider>;
}

export function LicenseCheckoutTrigger({ tier, onClick, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { tier?: LicenseCheckoutDetails['tier'] }) {
  const context = React.useContext(LicenseCheckoutContext);
  return <button {...props} data-license-trigger type="button" aria-haspopup="dialog" onClick={(event) => {
    onClick?.(event);
    if (!event.defaultPrevented) context?.openCheckout(tier ? { tier } : {}, event.currentTarget);
  }} />;
}

export function LicenseCheckoutPage({ initialDetails }: { initialDetails: LicenseCheckoutDetails }) {
  const [details, setDetails] = React.useState(initialDetails);
  return <main className="license-checkout-page">
    <a href="/" className="license-checkout-home"><img src="/logo.png" width="24" height="24" alt="" />open-wa</a>
    <section className="license-config-card">
      <div className="license-config-heading"><Ticket size={22} aria-hidden="true" /><h1>Configure your license</h1></div>
      <CheckoutIntroduction />
      <LicenseCheckoutForm details={details} onChange={setDetails} />
    </section>
    <a href="/docs/licensing/licensed-features">Compare licensed features</a>
  </main>;
}
