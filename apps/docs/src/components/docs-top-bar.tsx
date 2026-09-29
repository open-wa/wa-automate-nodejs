'use client';

import * as React from 'react';
import Link from 'fumadocs-core/link';
import { SidebarIcon, Languages } from 'lucide-react';
import { buttonVariants } from 'fumadocs-ui/components/ui/button';
import { useNotebookLayout } from 'fumadocs-ui/layouts/notebook';
import type { LinkItemType } from 'fumadocs-ui/layouts/shared';
import { cn } from '@/lib/cn';

function isSecondary(item: LinkItemType): boolean {
  if ('secondary' in item && item.secondary != null) return item.secondary;
  return item.type === 'icon';
}

function firstMenuUrl(
  item: Extract<LinkItemType, { type: 'menu' }>,
): string | undefined {
  if (item.url) return item.url;

  const firstLink = item.items.find(
    (child): child is Extract<(typeof item.items)[number], { url: string }> =>
      child.type !== 'custom' && 'url' in child,
  );

  return firstLink?.url;
}

function HeaderLink({ item }: { item: LinkItemType }) {
  if (item.type === 'custom') return <>{item.children}</>;

  if (item.type === 'menu') {
    const href = firstMenuUrl(item);

    return (
      <details className="group relative">
        <summary className="flex cursor-pointer list-none items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground [&::-webkit-details-marker]:hidden">
          {href ? (
            <Link href={href}>{item.text}</Link>
          ) : (
            <span>{item.text}</span>
          )}
          <span className="text-xs text-muted-foreground group-open:rotate-180">
            v
          </span>
        </summary>
        <div className="absolute left-0 top-full z-40 mt-2 grid min-w-56 gap-1 rounded-xl border-backstitch bg-popover p-2 text-sm text-popover-foreground shadow-stipple">
          {item.items.map((child, index) => {
            if (child.type === 'custom') {
              return (
                <React.Fragment key={index}>{child.children}</React.Fragment>
              );
            }

            return (
              <Link
                key={`${index}-${child.url}`}
                href={child.url}
                external={child.external}
                className="rounded-lg px-3 py-2 font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                {child.text}
              </Link>
            );
          })}
        </div>
      </details>
    );
  }

  return (
    <Link
      href={item.url}
      external={item.external}
      aria-label={item.type === 'icon' ? item.label : undefined}
      className={cn(
        item.type === 'icon'
          ? buttonVariants({ color: 'ghost', size: 'icon' })
          : 'inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground data-[active=true]:text-primary',
      )}
    >
      {item.type === 'icon' ? item.icon : item.text}
    </Link>
  );
}

function splitNavItems(items: LinkItemType[]) {
  const primaryItems = items.filter((item) => !isSecondary(item));
  const secondaryItems = items.filter(isSecondary);

  return {
    primaryItems,
    customActions: secondaryItems.filter((item) => item.type === 'custom'),
    utilityItems: secondaryItems.filter((item) => item.type !== 'custom'),
  };
}

export function DocsTopBar(props: React.ComponentPropsWithoutRef<'header'>) {
  const { isNavTransparent, navItems, slots } = useNotebookLayout();

  const { primaryItems, customActions, utilityItems } = splitNavItems(navItems);

  return (
    <>
      <header
        id="nd-subnav"
        data-transparent={isNavTransparent}
        {...props}
        className={cn(
          'w-full min-w-0 [grid-area:header] sticky top-(--fd-docs-row-1) z-30 flex h-(--fd-header-height) items-center border-b border-border bg-background ps-4 pe-2.5 transition-colors md:hidden max-md:layout:[--fd-header-height:--spacing(14)]',
          props.className,
        )}
      >
        {slots.navTitle ? (
          <slots.navTitle className="inline-flex items-center gap-2.5 font-semibold" />
        ) : null}
        <div className="flex-1" />
        {customActions.map((item, index) => <HeaderLink key={index} item={item} />)}
        {slots.searchTrigger ? (
          <slots.searchTrigger.sm
            hideIfDisabled
            className={cn(
              'rounded-full border-backstitch bg-secondary p-2 text-secondary-foreground hover:bg-accent hover:text-accent-foreground',
            )}
          />
        ) : null}
        {slots.sidebar ? (
          <slots.sidebar.trigger
            className={cn(
              buttonVariants({
                color: 'ghost',
                size: 'icon-sm',
                className: 'p-2',
              }),
            )}
          >
            <SidebarIcon />
          </slots.sidebar.trigger>
        ) : null}
      </header>

      <header className="w-full min-w-0 [grid-area:header] sticky top-(--fd-docs-row-1) z-30 hidden h-14 items-center border-b border-border bg-background px-4 md:flex">
        {slots.navTitle ? (
          <slots.navTitle className="inline-flex shrink-0 items-center gap-2.5 font-semibold" />
        ) : null}
        <nav
          className="ml-6 flex min-w-0 flex-1 items-center gap-2 overflow-x-auto"
          aria-label="Docs navigation"
        >
          {primaryItems.map((item, index) => (
            <HeaderLink key={index} item={item} />
          ))}
        </nav>
        <div className="ml-4 flex shrink-0 items-center justify-end gap-1.5">
          {customActions.map((item, index) => (
            <HeaderLink key={index} item={item} />
          ))}
          {slots.searchTrigger ? (
            <slots.searchTrigger.full
              hideIfDisabled
              className={cn(
                'w-full max-w-60 rounded-full border-backstitch bg-secondary ps-2.5 text-secondary-foreground hover:bg-accent hover:text-accent-foreground',
              )}
            />
          ) : null}
          {slots.themeSwitch ? <slots.themeSwitch /> : null}
          {slots.languageSelect ? (
            <slots.languageSelect.root>
              <Languages className="size-5" />
            </slots.languageSelect.root>
          ) : null}
          {utilityItems.map((item, index) => (
            <HeaderLink key={index} item={item} />
          ))}
        </div>
      </header>
    </>
  );
}
