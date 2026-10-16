// BoardUI registry source (MIT). Pinned source and adaptations: ./README.md.
"use client";

import { useDirection } from "./direction";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ReactNode, Ref } from "react";
import {
  ToggleButton as AriaToggleButton,
  ToggleButtonGroup as AriaToggleButtonGroup,
} from "react-aria-components";
import type {
  ToggleButtonGroupProps as AriaToggleButtonGroupProps,
  ToggleButtonProps as AriaToggleButtonProps,
} from "react-aria-components";
import { cx } from "@/utils/cx";

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Figma source: Board UI → dashboard 1 Weekly/Monthly/Yearly switch
 * (node 3731:3096).
 *
 * Single-select segmented control.
 *   track    bg background/tertiary/default, p 4, radius 10 (radius/2lg), gap 2
 *   segment  px 10, py 4, radius/md (6px)
 *     selected    bg segmented-control/selected (white in light), shadow/2xs, Body 1/Medium,
 *                 text/primary
 *     unselected  transparent, Body 1/Regular, text/secondary
 *
 * Built on react-aria ToggleButtonGroup with single selection that can't be
 * emptied — arrow keys move focus, Space/Enter selects.
 */

/**
 * `solid` (default) is the Figma design — tertiary track, white thumb behind
 * the selected segment. `plain` drops the track background and the thumb; the
 * selected segment reads only through its text weight/color.
 */
export type SegmentedControlVariant = "solid" | "plain";

export interface SegmentedControlProps
  extends Omit<AriaToggleButtonGroupProps, "selectionMode" | "disallowEmptySelection"> {
  children?: ReactNode;
  variant?: SegmentedControlVariant;
  ref?: Ref<HTMLDivElement>;
}

type Thumb = { left: number; top: number; width: number; height: number };

export function SegmentedControl({ className, children, variant = "solid", ref, ...props }: SegmentedControlProps) {
  const direction = useDirection();
  const innerRef = useRef<HTMLDivElement>(null);
  const [thumb, setThumb] = useState<Thumb | null>(null);

  useIsomorphicLayoutEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    const measure = () => {
      const selected = el.querySelector<HTMLElement>("[data-selected]");
      if (selected) {
        setThumb({
          left: selected.offsetLeft,
          top: selected.offsetTop,
          width: selected.offsetWidth,
          height: selected.offsetHeight,
        });
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    const observeItems = () => el.querySelectorAll("button").forEach(item => ro.observe(item));
    observeItems();
    const mo = new MutationObserver(() => { observeItems(); measure(); });
    mo.observe(el, { attributes: true, childList: true, characterData: true, subtree: true, attributeFilter: ["data-selected"] });
    return () => {
      mo.disconnect();
      ro.disconnect();
    };
  }, [direction]);

  const setRefs = (node: HTMLDivElement | null) => {
    innerRef.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) (ref as { current: HTMLDivElement | null }).current = node;
  };

  return (
    <AriaToggleButtonGroup
      ref={setRefs}
      selectionMode="single"
      disallowEmptySelection
      {...props}
      className={(state) =>
        cx(
          "relative inline-flex items-start gap-0.5 rounded-2lg",
          variant === "solid" && "bg-segmented-control-background p-1",
          typeof className === "function" ? className(state) : className,
        )
      }
    >
      {variant === "solid" && thumb && (
        <span
          aria-hidden
          className="pointer-events-none absolute left-0 top-0 rounded-md bg-segmented-control-selected-background shadow-2xs transition-[transform,width,height] duration-200 ease"
          style={{
            transform: `translate(${thumb.left}px, ${thumb.top}px)`,
            width: thumb.width,
            height: thumb.height,
          }}
        />
      )}
      {children}
    </AriaToggleButtonGroup>
  );
}

export interface SegmentedControlItemProps extends Omit<AriaToggleButtonProps, "children"> {
  children?: ReactNode;
  ref?: Ref<HTMLButtonElement>;
}

export function SegmentedControlItem({
  className,
  children,
  ref,
  ...props
}: SegmentedControlItemProps) {
  return (
    <AriaToggleButton
      ref={ref}
      {...props}
      className={(state) =>
        cx(
          "relative z-10 inline-flex cursor-pointer items-center justify-center rounded-md px-2.5 py-1 text-center whitespace-nowrap",
          "transition-colors duration-200 ease",
          "outline-none focus-visible:ring-2 focus-visible:ring-border-focus-ring",
          state.isSelected
            ? "text-body-medium text-text-primary"
            : "text-body-regular text-text-secondary hover:text-text-primary",
          state.isDisabled && "cursor-not-allowed opacity-50",
          typeof className === "function" ? className(state) : className,
        )
      }
    >
      {children}
    </AriaToggleButton>
  );
}
