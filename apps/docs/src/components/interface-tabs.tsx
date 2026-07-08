import * as React from 'react';

/**
 * A site-wide "preferred interface" preference. Lets a reader pick how they want
 * to consume the library — embedded Node code, the SocketClient (the basis for
 * other-language clients), or the Easy API over HTTP — once, and have every code
 * example follow that choice across pages.
 */
export const INTERFACES = ['Embedded', 'SocketClient', 'Easy API'] as const;
export type InterfaceId = (typeof INTERFACES)[number];

const STORAGE_KEY = 'openwa.preferredInterface';
const DEFAULT: InterfaceId = 'Embedded';

let current: InterfaceId = DEFAULT;
const listeners = new Set<() => void>();

function isInterface(v: unknown): v is InterfaceId {
  return typeof v === 'string' && (INTERFACES as readonly string[]).includes(v);
}

// Hydrate from localStorage on the client (after module load).
if (typeof window !== 'undefined') {
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (isInterface(saved)) current = saved;
  // Sync across tabs/windows.
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY && isInterface(e.newValue)) {
      current = e.newValue;
      listeners.forEach((l) => l());
    }
  });
}

function setInterface(next: InterfaceId) {
  if (next === current) return;
  current = next;
  if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, next);
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function usePreferredInterface(): [InterfaceId, (id: InterfaceId) => void] {
  // SSR renders the default; the client re-renders with the stored value.
  const value = React.useSyncExternalStore(
    subscribe,
    () => current,
    () => DEFAULT,
  );
  return [value, setInterface];
}

function TabBar({
  options,
  value,
  onChange,
}: {
  options: readonly string[];
  value: string;
  onChange: (v: InterfaceId) => void;
}) {
  return (
    <div className="inline-flex rounded-md border border-fd-border overflow-hidden text-sm not-prose">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => isInterface(opt) && onChange(opt)}
          className={`px-3 py-1.5 ${value === opt ? 'bg-fd-primary text-fd-primary-foreground' : 'bg-fd-background hover:bg-fd-accent'}`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

/** A standalone selector, e.g. at the top of the reference. */
export function InterfacePreference() {
  const [pref, setPref] = usePreferredInterface();
  return (
    <div className="not-prose my-4 flex flex-col gap-2 rounded-lg border border-fd-border p-4">
      <span className="text-sm font-medium">Preferred interface</span>
      <p className="text-sm text-fd-muted-foreground">
        Choose how you want to use open-wa. Code examples across the docs follow this choice. The
        SocketClient protocol is the basis for clients in other languages.
      </p>
      <TabBar options={INTERFACES} value={pref} onChange={setPref} />
    </div>
  );
}

type InterfaceTabProps = { value: InterfaceId; children: React.ReactNode };
export function InterfaceTab(_props: InterfaceTabProps): React.ReactNode {
  // Rendered by InterfaceTabs; standalone render is a no-op.
  return null;
}

/**
 * Renders the child whose `value` matches the reader's preferred interface,
 * with a tab bar to switch (which updates the global preference).
 */
export function InterfaceTabs({ children }: { children: React.ReactNode }) {
  const [pref, setPref] = usePreferredInterface();

  const tabs = React.Children.toArray(children).filter(
    (c): c is React.ReactElement<InterfaceTabProps> =>
      React.isValidElement(c) && isInterface((c.props as InterfaceTabProps).value),
  );
  if (tabs.length === 0) return null;

  const values = tabs.map((t) => t.props.value);
  const active = values.includes(pref) ? pref : values[0];
  const activeTab = tabs.find((t) => t.props.value === active) ?? tabs[0];

  return (
    <div className="not-prose my-4 flex flex-col gap-2">
      <TabBar options={values} value={active} onChange={setPref} />
      <div className="rounded-lg border border-fd-border p-1">{activeTab.props.children}</div>
    </div>
  );
}
