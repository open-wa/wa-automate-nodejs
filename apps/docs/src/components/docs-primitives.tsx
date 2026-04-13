import * as React from 'react';

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

export function Callout({
  type = 'note',
  title,
  children,
  className,
}: {
  type?: 'note' | 'tip' | 'warning' | 'danger' | 'info';
  title?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const styles = {
    note: 'border-fd-border bg-fd-card text-fd-foreground',
    tip: 'border-emerald-500/30 bg-emerald-500/10 text-fd-foreground',
    warning: 'border-amber-500/30 bg-amber-500/10 text-fd-foreground',
    danger: 'border-rose-500/30 bg-rose-500/10 text-fd-foreground',
    info: 'border-sky-500/30 bg-sky-500/10 text-fd-foreground',
  } as const;

  const icons = {
    note: '📝',
    tip: '💡',
    warning: '⚠️',
    danger: '⛔',
    info: 'ℹ️',
  } as const;

  const defaultTitles = {
    note: 'Note',
    tip: 'Tip',
    warning: 'Warning',
    danger: 'Danger',
    info: 'Info',
  } as const;

  return (
    <aside
      className={cx(
        'my-6 rounded-2xl border p-5 shadow-sm transition-colors',
        styles[type],
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span aria-hidden="true" className="text-lg leading-none">
          {icons[type]}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-fd-muted-foreground">
            {title ?? defaultTitles[type]}
          </p>
          <div className="mt-2 text-sm leading-6 text-fd-foreground [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_a]:text-fd-primary [&_code]:text-fd-foreground [&_p]:text-fd-muted-foreground [&_li]:text-fd-muted-foreground">
            {children}
          </div>
        </div>
      </div>
    </aside>
  );
}

export function Steps({ children }: { children?: React.ReactNode }) {
  return (
    <div className="my-10 space-y-6">
      {React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return child;
        return React.cloneElement(child as React.ReactElement<{ number?: number }>, {
          number: index + 1,
        });
      })}
    </div>
  );
}

export function Step({
  number,
  title,
  children,
}: {
  number?: number;
  title?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-fd-border bg-fd-card p-5 shadow-sm transition-colors sm:p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-fd-border bg-fd-background text-sm font-semibold text-fd-foreground">
          {number}
        </div>
        <div className="min-w-0 flex-1">
          {title ? (
            <h3 className="text-lg font-semibold text-fd-foreground">{title}</h3>
          ) : null}
          <div className={cx(title && 'mt-3', 'text-sm leading-6 text-fd-muted-foreground [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_a]:text-fd-primary [&_code]:text-fd-foreground')}>
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}

export function PackageManagerTabs({
  command,
  mode = 'add',
}: {
  command: string;
  mode?: 'add' | 'dlx';
}) {
  const commands =
    mode === 'dlx'
      ? {
          npm: `npx ${command}`,
          pnpm: `pnpm dlx ${command}`,
          yarn: `yarn dlx ${command}`,
          bun: `bunx ${command}`,
        }
      : {
          npm: `npm install ${command}`,
          pnpm: `pnpm add ${command}`,
          yarn: `yarn add ${command}`,
          bun: `bun add ${command}`,
        };

  const [active, setActive] = React.useState<keyof typeof commands>('pnpm');

  return (
    <div className="my-6 overflow-hidden rounded-3xl border border-fd-border bg-fd-card shadow-sm">
      <div className="flex flex-wrap gap-2 border-b border-fd-border p-3">
        {Object.keys(commands).map((key) => {
          const manager = key as keyof typeof commands;
          return (
            <button
              key={manager}
              type="button"
              onClick={() => setActive(manager)}
              className={cx(
                'rounded-full px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-fd-card',
                active === manager
                  ? 'bg-fd-primary text-fd-primary-foreground'
                  : 'bg-fd-secondary text-fd-secondary-foreground hover:bg-fd-accent',
              )}
              aria-pressed={active === manager}
            >
              {manager}
            </button>
          );
        })}
      </div>
      <pre className="overflow-x-auto p-4 text-sm leading-6 text-fd-foreground">
        <code>{commands[active]}</code>
      </pre>
    </div>
  );
}

type ComparisonColumn = {
  key: string;
  label: string;
};

type ComparisonRow = {
  feature: string;
  values: Record<string, React.ReactNode>;
  group?: string;
};

export function ComparisonTable({
  columns,
  rows,
}: {
  columns: ComparisonColumn[];
  rows: ComparisonRow[];
}) {
  let lastGroup: string | undefined;

  return (
    <div className="my-8 overflow-hidden rounded-3xl border border-fd-border bg-fd-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead className="bg-fd-secondary/60">
            <tr>
              <th className="px-4 py-3 font-semibold text-fd-foreground">Feature</th>
              {columns.map((column) => (
                <th key={column.key} className="px-4 py-3 font-semibold text-fd-foreground">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const showGroup = row.group && row.group !== lastGroup;
              lastGroup = row.group ?? lastGroup;

              return (
                <React.Fragment key={`${row.group ?? 'row'}-${row.feature}`}>
                  {showGroup ? (
                    <tr className="border-t border-fd-border bg-fd-background/80">
                      <td colSpan={columns.length + 1} className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-fd-muted-foreground">
                        {row.group}
                      </td>
                    </tr>
                  ) : null}
                  <tr className="border-t border-fd-border align-top">
                    <td className="px-4 py-3 font-medium text-fd-foreground">{row.feature}</td>
                    {columns.map((column) => (
                      <td key={column.key} className="px-4 py-3 text-fd-muted-foreground">
                        {row.values[column.key]}
                      </td>
                    ))}
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function FAQ({
  items,
}: {
  items: Array<{ question: string; answer: React.ReactNode }>;
}) {
  return (
    <div className="my-8 space-y-4">
      {items.map((item) => (
        <details
          key={item.question}
          className="group rounded-2xl border border-fd-border bg-fd-card p-5 shadow-sm"
        >
          <summary className="cursor-pointer list-none pr-6 text-base font-semibold text-fd-foreground transition-colors hover:text-fd-primary focus-visible:outline-none [&::-webkit-details-marker]:hidden">
            {item.question}
          </summary>
          <div className="mt-3 text-sm leading-6 text-fd-muted-foreground">
            {item.answer}
          </div>
        </details>
      ))}
    </div>
  );
}
