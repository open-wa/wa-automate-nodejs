import { useEffect, useMemo, useState } from 'react';
import { Combobox } from '@base-ui/react/combobox';
import { Check, ChevronDown, Search } from 'lucide-react';
import { manualCallRecipient, useCalling, type CallRecipient } from '@/lib/hooks/use-calling';
import { usePrivacy } from '@/lib/hooks/use-privacy';

export function CallRecipientPicker() {
  const { contacts, contactsLoading, contactsError, recipient, setRecipient } = useCalling();
  const { redactName, redact } = usePrivacy();
  const label = (item: CallRecipient) => redactName(item.name, item.id);
  const [query, setQuery] = useState(recipient ? label(recipient) : '');
  useEffect(() => { if (recipient) setQuery(redactName(recipient.name, recipient.id)); }, [recipient?.id, recipient?.name, redactName]);
  const items = useMemo(() => {
    const search = query.trim().toLowerCase();
    const digits = search.replace(/\D/g, '');
    const matches = contacts.filter(item => !search || label(item).toLowerCase().includes(search) || item.name.toLowerCase().includes(search) || (digits.length >= 3 && item.name.replace(/\D/g, '').includes(digits)) || item.aliases.some(alias => alias.toLowerCase().includes(search) || (digits.length >= 3 && alias.replace(/\D/g, '').includes(digits))));
    const manual = manualCallRecipient(query);
    // A bare LID that exactly matches a contact must not become a phone number.
    const exact = matches.find(item => item.id === manual || item.aliases.includes(manual ?? '') || (manual && /^\d+$/.test(manual) && [...item.aliases, item.name].some(alias => alias.replace(/\D/g, '') === manual)));
    return [...(manual && !exact ? [{ id: manual, name: query.trim(), aliases: [manual] }] : []), ...matches].slice(0, 50);
  }, [contacts, query, redactName]);
  return <div className="min-w-0 flex-1 space-y-2">
    <label htmlFor="call-recipient" className="text-sm font-medium">Call a contact</label>
    <Combobox.Root<CallRecipient> items={items} filter={null} value={recipient} inputValue={query}
      itemToStringLabel={label} isItemEqualToValue={(item, value) => item.id === value.id}
      onInputValueChange={(value, details) => { setQuery(value); if (details.reason === 'input-change' || details.reason === 'input-clear') setRecipient(null); }}
      onValueChange={value => { setRecipient(value); if (value) setQuery(label(value)); }}>
      <div className="flex h-11 items-center gap-2 rounded-xl border bg-background px-3 focus-within:ring-2 focus-within:ring-ring">
        <Search className="size-4 shrink-0 text-muted-foreground" />
        <Combobox.Input id="call-recipient" placeholder="Search name, phone number or LID" className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
        <Combobox.Trigger aria-label="Show call contacts" className="rounded-md p-1 text-muted-foreground hover:bg-muted"><ChevronDown className="size-4" /></Combobox.Trigger>
      </div>
      <Combobox.Portal><Combobox.Positioner sideOffset={6} className="z-50 w-(--anchor-width) max-w-[calc(100vw-2rem)]">
        <Combobox.Popup className="rounded-xl border bg-popover p-1 text-popover-foreground shadow-lg">
          <Combobox.Empty className="p-3 text-sm text-muted-foreground">{contactsLoading ? 'Loading contacts…' : 'No matching contact. Enter an international phone number or a full contact ID.'}</Combobox.Empty>
          <Combobox.List className="max-h-72 overflow-auto overscroll-contain">{(item: CallRecipient) => <Combobox.Item key={item.id} value={item} className="flex cursor-default items-center gap-3 rounded-lg px-3 py-2 outline-none data-highlighted:bg-accent data-highlighted:text-accent-foreground">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">{label(item).slice(0, 1)}</span>
            <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{label(item)}</span><span className="block truncate text-xs text-muted-foreground">{redact(item.id)}</span></span>
            <Combobox.ItemIndicator><Check className="size-4" /></Combobox.ItemIndicator>
          </Combobox.Item>}</Combobox.List>
          {items.length === 50 && <p className="border-t p-2 text-xs text-muted-foreground">Keep typing to narrow the results.</p>}
        </Combobox.Popup>
      </Combobox.Positioner></Combobox.Portal>
    </Combobox.Root>
    {recipient ? <p className="text-xs text-muted-foreground">Selected: {label(recipient)} · {redact(recipient.id)}</p> : <p className="text-xs text-muted-foreground">Choose a result to confirm who you’ll call.</p>}
    {contactsError && <p className="text-xs text-muted-foreground">{contactsError}</p>}
  </div>;
}
