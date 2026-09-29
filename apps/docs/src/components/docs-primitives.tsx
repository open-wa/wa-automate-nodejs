import * as React from 'react';
import { CircleAlert, Info, Lightbulb, TriangleAlert } from 'lucide-react';

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
  const Icon = { note: Info, tip: Lightbulb, warning: TriangleAlert, danger: CircleAlert, info: Info }[type];

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
        'docs-callout my-5 rounded-xl p-4 text-foreground',
        className,
      )}
      data-tone={type}
    >
      <div className="flex items-start gap-3 relative">
        <Icon aria-hidden="true" className="docs-callout-icon mt-0.5 size-5 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <p className="!m-0 text-sm font-semibold text-foreground">
            {title ?? defaultTitles[type]}
          </p>
          <div className="mt-1 text-pretty text-sm leading-6 text-foreground [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_a]:font-bold [&_a]:text-primary [&_code]:text-foreground [&_li]:text-muted-foreground [&_p]:text-muted-foreground">
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
    <section className="my-6 rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start relative ">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-primary text-primary-foreground font-mono text-sm font-semibold">
          {number}
        </div>
        <div className="min-w-0 flex-1">
          {title ? (
            <h3 className="text-balance text-lg font-semibold text-foreground">
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
      <div className="flex gap-2 overflow-x-auto border-b border-border p-3 bg-muted relative ">
        {Object.keys(commands).map((key) => {
          const manager = key as keyof typeof commands;
          return (
            <button
              key={manager}
              type="button"
              onClick={() => setActive(manager)}
              className={cx(
                'min-h-10 shrink-0 rounded-[10px] px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring border cursor-pointer',
                active === manager
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-transparent bg-background text-foreground hover:bg-accent',
              )}
              aria-pressed={active === manager}
            >
              {manager}
            </button>
          );
        })}
      </div>
      <pre className="overflow-x-auto bg-[var(--ow-surface-code)] p-4 text-sm leading-6 text-[var(--ow-content-code)] font-mono border-t border-border relative ">
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
      <div className="overflow-x-auto relative ">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead className="bg-muted border-b border-border">
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
                    <tr className="border-b border-border bg-muted/50">
                      <td
                        colSpan={columns.length + 1}
                        className="px-4 py-3 !m-0 text-sm font-semibold text-foreground"
                      >
                        {row.group}
                      </td>
                    </tr>
                  ) : null}
                  <tr className="border-b border-border align-top transition-colors hover:bg-muted/30 last:border-b-0">
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
  function renderAnswer(answer: React.ReactNode) {
    if (typeof answer !== 'string') return answer;

    const parts = answer.split(/(\[[^\]]+\]\([^\)]+\))/g);
    return parts.map((part, index) => {
      const match = part.match(/^\[([^\]]+)\]\(([^\)]+)\)$/);
      if (!match) return <React.Fragment key={index}>{part}</React.Fragment>;

      const [, label, href] = match;
      const safeHref = href.startsWith('/') || /^https?:\/\//.test(href) ? href : '#';
      return (
        <a key={index} href={safeHref}>
          {label}
        </a>
      );
    });
  }

  return (
    <div className="my-8 space-y-4">
      {items.map((item) => (
        <details
          key={item.question}
          className="group rounded-xl border border-border bg-card p-5 transition-colors open:bg-muted/40"
        >
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 text-base font-bold text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden relative  select-none">
            <span className="text-balance font-display">{item.question}</span>
            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-border bg-background font-mono text-sm font-bold text-foreground group-open:hidden shadow-sm">
              +
            </span>
            <span className="hidden size-7 shrink-0 items-center justify-center rounded-lg border border-border bg-primary text-primary-foreground font-mono text-sm font-bold group-open:flex shadow-sm">
              -
            </span>
          </summary>
          <div className="mt-3 text-pretty text-sm leading-6 text-muted-foreground font-medium [&_a]:font-bold [&_a]:text-primary relative ">
            {renderAnswer(item.answer)}
          </div>
        </details>
      ))}
    </div>
  );
}
