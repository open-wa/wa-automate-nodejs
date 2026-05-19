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
    tip: 'border-fd-primary/40 bg-fd-primary/10 text-fd-foreground',
    warning: 'border-amber-500/40 bg-amber-500/10 text-fd-foreground',
    danger: 'border-rose-500/40 bg-rose-500/10 text-fd-foreground',
    info: 'border-cyan-500/40 bg-cyan-500/10 text-fd-foreground',
  } as const;

  const labels = {
    note: 'i',
    tip: '+',
    warning: '!',
    danger: 'x',
    info: '?',
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
        'my-6 rounded-2xl border p-5 shadow-sm transition-colors sm:p-6',
        styles[type],
        className,
      )}
    >
      <div className="flex items-start gap-4">
        <span
          aria-hidden="true"
          className="flex size-8 shrink-0 items-center justify-center rounded-full border border-current/25 bg-fd-background/70 font-mono text-sm font-semibold text-fd-primary"
        >
          {labels[type]}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-fd-primary">
            {title ?? defaultTitles[type]}
          </p>
          <div className="mt-2 text-pretty text-sm leading-6 text-fd-foreground [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_a]:font-semibold [&_a]:text-fd-primary [&_code]:text-fd-foreground [&_li]:text-fd-muted-foreground [&_p]:text-fd-muted-foreground">
            {children}
          </div>
        </div>
      </div>
    </aside>
  );
}

export function Steps({ children }: { children?: React.ReactNode }) {
  return (
    <div className="my-10 space-y-5">
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-fd-primary/40 bg-fd-primary/10 font-mono text-sm font-semibold text-fd-primary">
          {number}
        </div>
        <div className="min-w-0 flex-1">
          {title ? (
            <h3 className="text-balance text-lg font-semibold text-fd-foreground">
              {title}
            </h3>
          ) : null}
          <div
            className={cx(
              title ? 'mt-3' : undefined,
              'text-pretty text-sm leading-6 text-fd-muted-foreground [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_a]:font-semibold [&_a]:text-fd-primary [&_code]:text-fd-foreground',
            )}
          >
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
      <div className="flex gap-2 overflow-x-auto border-b border-fd-border p-3">
        {Object.keys(commands).map((key) => {
          const manager = key as keyof typeof commands;
          return (
            <button
              key={manager}
              type="button"
              onClick={() => setActive(manager)}
              className={cx(
                'min-h-10 shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring',
                active === manager
                  ? 'bg-fd-primary text-fd-primary-foreground'
                  : 'border border-fd-border bg-fd-secondary text-fd-secondary-foreground hover:bg-fd-accent',
              )}
              aria-pressed={active === manager}
            >
              {manager}
            </button>
          );
        })}
      </div>
      <pre className="overflow-x-auto bg-fd-background p-4 text-sm leading-6 text-fd-foreground">
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
          <thead className="bg-fd-secondary">
            <tr>
              <th className="px-4 py-4 font-semibold text-fd-foreground">Feature</th>
              {columns.map((column) => (
                <th key={column.key} className="px-4 py-4 font-semibold text-fd-foreground">
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
                    <tr className="border-t border-fd-border bg-fd-background">
                      <td
                        colSpan={columns.length + 1}
                        className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-fd-primary"
                      >
                        {row.group}
                      </td>
                    </tr>
                  ) : null}
                  <tr className="border-t border-fd-border align-top transition-colors hover:bg-fd-secondary/60">
                    <td className="min-w-44 px-4 py-4 font-medium text-fd-foreground">
                      {row.feature}
                    </td>
                    {columns.map((column) => (
                      <td key={column.key} className="min-w-40 px-4 py-4 text-fd-muted-foreground">
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
          className="group rounded-2xl border border-fd-border bg-fd-card p-5 shadow-sm transition-colors open:border-fd-primary/45"
        >
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold text-fd-foreground transition-colors hover:text-fd-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring [&::-webkit-details-marker]:hidden">
            <span className="text-balance">{item.question}</span>
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-fd-border bg-fd-secondary font-mono text-sm text-fd-primary group-open:hidden">
              +
            </span>
            <span className="hidden size-7 shrink-0 items-center justify-center rounded-full border border-fd-primary/40 bg-fd-primary/10 font-mono text-sm text-fd-primary group-open:flex">
              -
            </span>
          </summary>
          <div className="mt-3 text-pretty text-sm leading-6 text-fd-muted-foreground [&_a]:font-semibold [&_a]:text-fd-primary">
            {item.answer}
          </div>
        </details>
      ))}
    </div>
  );
}
