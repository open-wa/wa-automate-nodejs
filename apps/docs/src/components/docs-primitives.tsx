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
    note: 'border-backstitch bg-card text-foreground',
    tip: 'border-backstitch bg-primary/10 text-foreground',
    warning: 'border-backstitch bg-stitch-yellow/30 text-foreground',
    danger: 'border-backstitch bg-destructive/10 text-foreground',
    info: 'border-backstitch bg-stitch-lavender/20 text-foreground',
  } as const;

  const bgDitherOpacities = {
    note: 'opacity-[0.06]',
    tip: 'opacity-[0.08]',
    warning: 'opacity-[0.06]',
    danger: 'opacity-[0.08]',
    info: 'opacity-[0.06]',
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
        'my-6 rounded-2xl border-backstitch p-5 shadow-stipple relative overflow-hidden transition-all sm:p-6',
        styles[type],
        className,
      )}
    >
      <div className={cx("absolute inset-0 bg-dither pointer-events-none", bgDitherOpacities[type])} />
      <div className="flex items-start gap-4 relative">
        <span
          aria-hidden="true"
          className="flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-foreground bg-background font-mono text-sm font-bold text-foreground"
        >
          {labels[type]}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-foreground">
            {title ?? defaultTitles[type]}
          </p>
          <div className="mt-2 text-pretty text-sm leading-6 text-foreground [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_a]:font-bold [&_a]:text-primary [&_code]:text-foreground [&_li]:text-muted-foreground [&_p]:text-muted-foreground">
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
    <section className="my-6 rounded-2xl border-backstitch bg-card p-5 shadow-stipple relative overflow-hidden transition-colors sm:p-6">
      <div className="absolute inset-0 bg-dither opacity-[0.05] pointer-events-none" />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start relative ">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-foreground bg-primary text-primary-foreground font-mono text-sm font-bold shadow-sm">
          {number}
        </div>
        <div className="min-w-0 flex-1">
          {title ? (
            <h3 className="text-balance text-lg font-display font-bold text-foreground">
              {title}
            </h3>
          ) : null}
          <div
            className={cx(
              title ? 'mt-3' : undefined,
              'text-pretty text-sm leading-6 text-muted-foreground [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_a]:font-bold [&_a]:text-primary [&_code]:text-foreground',
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
    <div className="my-6 overflow-hidden rounded-2xl border-backstitch bg-card shadow-stipple relative">
      <div className="absolute inset-0 bg-dither opacity-[0.03] pointer-events-none" />
      <div className="flex gap-2 overflow-x-auto border-b-2 border-foreground p-3 bg-muted relative ">
        {Object.keys(commands).map((key) => {
          const manager = key as keyof typeof commands;
          return (
            <button
              key={manager}
              type="button"
              onClick={() => setActive(manager)}
              className={cx(
                'min-h-10 shrink-0 rounded-xl px-4 py-2 text-sm font-bold transition-all focus-visible:outline-none border-2 cursor-pointer shadow-sm',
                active === manager
                  ? 'bg-foreground text-background border-foreground'
                  : 'border-transparent bg-background text-foreground hover:bg-accent',
              )}
              aria-pressed={active === manager}
            >
              {manager}
            </button>
          );
        })}
      </div>
      <pre className="overflow-x-auto bg-foreground p-4 text-sm leading-6 text-background font-mono border-t-2 border-foreground relative ">
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
    <div className="my-8 overflow-hidden rounded-2xl border-backstitch bg-card shadow-stipple relative">
      <div className="absolute inset-0 bg-dither opacity-[0.03] pointer-events-none" />
      <div className="overflow-x-auto relative ">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead className="bg-muted border-b-2 border-foreground">
            <tr>
              <th className="px-4 py-4 font-bold text-foreground font-display">Feature</th>
              {columns.map((column) => (
                <th key={column.key} className="px-4 py-4 font-bold text-foreground font-display">
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
                    <tr className="border-b border-foreground bg-muted/50">
                      <td
                        colSpan={columns.length + 1}
                        className="px-4 py-3 text-xs font-bold uppercase tracking-[0.14em] text-foreground"
                      >
                        {row.group}
                      </td>
                    </tr>
                  ) : null}
                  <tr className="border-b border-foreground/30 align-top transition-colors hover:bg-muted/30 last:border-b-0">
                    <td className="min-w-44 px-4 py-4 font-bold text-foreground font-display">
                      {row.feature}
                    </td>
                    {columns.map((column) => (
                      <td key={column.key} className="min-w-40 px-4 py-4 text-muted-foreground font-medium">
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
          className="group rounded-2xl border-backstitch bg-card p-5 shadow-stipple relative overflow-hidden transition-all open:bg-card"
        >
          <div className="absolute inset-0 bg-dither opacity-[0.05] pointer-events-none" />
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 text-base font-bold text-foreground transition-colors hover:text-primary focus-visible:outline-none [&::-webkit-details-marker]:hidden relative  select-none">
            <span className="text-balance font-display">{item.question}</span>
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-foreground bg-background font-mono text-sm font-bold text-foreground group-open:hidden shadow-sm">
              +
            </span>
            <span className="hidden size-7 shrink-0 items-center justify-center rounded-full border-2 border-foreground bg-primary text-primary-foreground font-mono text-sm font-bold group-open:flex shadow-sm">
              -
            </span>
          </summary>
          <div className="mt-3 text-pretty text-sm leading-6 text-muted-foreground font-medium [&_a]:font-bold [&_a]:text-primary relative ">
            {item.answer}
          </div>
        </details>
      ))}
    </div>
  );
}
