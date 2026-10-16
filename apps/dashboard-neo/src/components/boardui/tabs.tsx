// BoardUI registry source (MIT). Pinned source and adaptations: ./README.md.
"use client";

import { useDirection } from "./direction";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ComponentType, ReactNode, Ref } from "react";
import {
  Tab as AriaTab,
  TabList as AriaTabList,
  TabPanel as AriaTabPanel,
  Tabs as AriaTabs,
} from "react-aria-components";
import type {
  TabListProps as AriaTabListProps,
  TabPanelProps as AriaTabPanelProps,
  TabProps as AriaTabProps,
  TabsProps as AriaTabsProps,
} from "react-aria-components";
import { cx } from "@/utils/cx";

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Figma source: Board UI → Tab (node 3793:2942).
 *
 * Underline tabs. The tab strip sits on a 1px border/button/default baseline;
 * the active tab paints a 2px color/blue/600 underline over it.
 *   tab       px 10, py 8, gap 10 (label ↔ count), Body 1 (14/20)
 *     active     text color/blue/600, Medium weight, 2px blue underline
 *     inactive   text/primary, Regular weight, transparent underline
 *   count     radius/sm, px 4, py 1, Caption 1/Medium (12/16)
 *     active     bg color/blue/100, text color/blue/600
 *     inactive   bg black/10 @ 50% opacity, text/primary
 *   icon      optional 16px leading glyph, inherits the label color
 *
 * Built on react-aria Tabs: roving-tabindex arrow-key navigation, automatic
 * activation, and TabList/TabPanel association.
 */

type IconComponent = ComponentType<{
  className?: string;
  "aria-hidden"?: boolean | "true" | "false";
}>;

export interface TabsProps extends AriaTabsProps {
  ref?: Ref<HTMLDivElement>;
}

export function Tabs({ className, ref, ...props }: TabsProps) {
  return (
    <AriaTabs
      ref={ref}
      {...props}
      className={(state) =>
        cx(
          "flex w-full flex-col gap-4",
          state.orientation === "vertical" && "flex-row",
          typeof className === "function" ? className(state) : className,
        )
      }
    />
  );
}

export interface TabListProps<T extends object> extends AriaTabListProps<T> {
  ref?: Ref<HTMLDivElement>;
}

type Underline = { left: number; width: number };

export function TabList<T extends object>({ className, ref, ...props }: TabListProps<T>) {
  const direction = useDirection();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [underline, setUnderline] = useState<Underline | null>(null);

  useIsomorphicLayoutEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const measure = () => {
      const selected = el.querySelector<HTMLElement>("[role='tab'][data-selected]");
      if (selected) {
        setUnderline({ left: selected.offsetLeft, width: selected.offsetWidth });
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    // Labels and fonts can change width without resizing the full tab strip.
    const observeTabs = () => el.querySelectorAll("[role='tab']").forEach(tab => ro.observe(tab));
    observeTabs();
    const mo = new MutationObserver(() => { observeTabs(); measure(); });
    mo.observe(el, { attributes: true, childList: true, characterData: true, subtree: true, attributeFilter: ["data-selected"] });
    return () => {
      mo.disconnect();
      ro.disconnect();
    };
  }, [direction]);

  return (
    <div ref={wrapperRef} className="relative w-full">
      <AriaTabList
        ref={ref}
        {...props}
        className={(state) =>
          cx(
            "flex w-full items-center gap-1 border-b border-separator-border",
            typeof className === "function" ? className(state) : className,
          )
        }
      />
      {underline && (
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-0 h-0.5 bg-accent-600 transition-[transform,width] duration-200 ease"
          style={{
            transform: `translateX(${underline.left}px)`,
            width: underline.width,
          }}
        />
      )}
    </div>
  );
}

export interface TabProps extends Omit<AriaTabProps, "children"> {
  children?: ReactNode;
  /** Optional leading icon (16px). Inherits the label color. */
  icon?: IconComponent;
  /** Optional trailing count badge. */
  count?: ReactNode;
  ref?: Ref<HTMLDivElement>;
}

export function Tab({ className, children, icon: Icon, count, ref, ...props }: TabProps) {
  return (
    <AriaTab
      ref={ref}
      {...props}
      className={(state) =>
        cx(
          "relative inline-flex cursor-pointer items-center gap-2.5 px-2.5 py-2 whitespace-nowrap",
          "outline-none transition-colors duration-150 ease",
          "focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-border-focus-ring",
          state.isDisabled && "cursor-not-allowed opacity-50",
          typeof className === "function" ? className(state) : className,
        )
      }
    >
      {({ isSelected }) => (
        <>
          <span
            className={cx(
              "inline-flex items-center gap-1.5",
              isSelected
                ? "text-body-medium text-accent-600"
                : "text-body-regular text-text-primary",
            )}
          >
            {Icon && <Icon className="size-4 shrink-0" aria-hidden />}
            {children}
          </span>
          {count != null && (
            <span
              className={cx(
                "inline-flex items-center justify-center rounded-sm px-1 py-px text-caption-1-medium whitespace-nowrap",
                isSelected
                  ? "bg-tab-count-selected-background text-accent-600"
                  : "bg-black/10 text-text-primary opacity-50",
              )}
            >
              {count}
            </span>
          )}
        </>
      )}
    </AriaTab>
  );
}

export interface TabPanelProps extends AriaTabPanelProps {
  ref?: Ref<HTMLDivElement>;
}

export function TabPanel({ className, ref, ...props }: TabPanelProps) {
  return (
    <AriaTabPanel
      ref={ref}
      {...props}
      className={(state) =>
        cx(
          "outline-none focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-border-focus-ring",
          typeof className === "function" ? className(state) : className,
        )
      }
    />
  );
}
