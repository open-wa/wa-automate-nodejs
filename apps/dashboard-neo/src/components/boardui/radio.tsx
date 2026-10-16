// BoardUI registry source (MIT). Pinned source and adaptations: ./README.md.
"use client";

import type { ReactNode, Ref } from "react";
import {
  Radio as AriaRadio,
  RadioGroup as AriaRadioGroup,
} from "react-aria-components";
import type {
  RadioGroupProps as AriaRadioGroupProps,
  RadioProps as AriaRadioProps,
} from "react-aria-components";
import { cx } from "@/utils/cx";

/**
 * Figma source: Board UI → radio_default_sm / radio_selected_sm (used in the
 * AI chat model picker, node 4035:6925) and the checkbox family tokens.
 *
 * Two sizes:
 *   md  16×16 dot, 6px inner, label Body 1/Medium (14)
 *   sm  14×14 dot, 5px inner, label Body 2/Medium (13)
 *
 * States:
 *   default   bg background/primary/default, 1px border/checkbox/default,
 *             shadow/xs
 *   selected  Button/Primary gradient (blue/500 → blue/600) with an inset
 *             blue ring + top highlight, white inner dot
 *   disabled  50% opacity, not-allowed cursor
 *
 * `RadioGroup` + `Radio` are built on React Aria (keyboard arrows, form
 * semantics, label association). The bare `RadioDot` glyph is also exported
 * for menu rows that manage selection themselves (e.g. Dropdown items acting
 * as a radio group), where a nested focusable radio would be invalid.
 */

export type RadioSize = "sm" | "md";

const dotStyles = {
  sm: {
    dot: "size-3.5",
    inner: "size-[5px]",
    selected:
      "bg-gradient-to-b from-accent-500 to-accent-600 shadow-[inset_0px_0px_0px_0.875px_var(--color-accent-500),inset_0px_1.75px_0px_0px_rgba(255,255,255,0.25)]",
    border: "border-[0.875px]",
    gap: "gap-2",
    label: "text-body-2-medium",
  },
  md: {
    dot: "size-4",
    inner: "size-1.5",
    selected:
      "bg-gradient-to-b from-accent-500 to-accent-600 shadow-[inset_0px_0px_0px_1px_var(--color-accent-500),inset_0px_2px_0px_0px_rgba(255,255,255,0.25)]",
    border: "border",
    gap: "gap-2",
    label: "text-body-medium",
  },
};

export interface RadioDotProps {
  selected?: boolean;
  size?: RadioSize;
  /** Draws the keyboard focus ring around the glyph. */
  focusVisible?: boolean;
  className?: string;
}

/**
 * The bare radio glyph — presentation only, no interaction or semantics.
 *
 * Select/deselect animates: the default bordered surface and the selected
 * gradient are stacked layers cross-fading over 200ms (a gradient background
 * can't transition directly), while the white inner dot scales in and out.
 */
export function RadioDot({ selected = false, size = "sm", focusVisible = false, className }: RadioDotProps) {
  const s = dotStyles[size];
  return (
    <span
      aria-hidden
      className={cx(
        "relative flex shrink-0 items-center justify-center rounded-full",
        s.dot,
        focusVisible && "ring-2 ring-border-focus-ring ring-offset-2",
        className,
      )}
    >
      {/* Default surface */}
      <span
        className={cx(
          "absolute inset-0 rounded-full border-border-checkbox-default bg-background-primary-default shadow-xs",
          "transition-opacity duration-200 ease",
          s.border,
          selected && "opacity-0",
        )}
      />
      {/* Selected gradient surface */}
      <span
        className={cx(
          "absolute inset-0 rounded-full",
          "transition-opacity duration-200 ease",
          s.selected,
          !selected && "opacity-0",
        )}
      />
      {/* Inner dot: absolutely centered (flex centering of fractional sizes can
          land on subpixels) and no drop shadow — a downward shadow makes the
          dot read as sitting below center. */}
      <span
        className={cx(
          "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-control-indicator-background",
          "transition-[scale,opacity] duration-200 ease",
          s.inner,
          selected ? "scale-100 opacity-100" : "scale-0 opacity-0",
        )}
      />
    </span>
  );
}

/* ------------------------------------------------------------------- group */

export interface RadioGroupProps extends Omit<AriaRadioGroupProps, "children"> {
  children?: ReactNode;
  ref?: Ref<HTMLDivElement>;
}

/** Wraps a set of Radios: arrow-key navigation, single selection, form value. */
export function RadioGroup({ className, children, ref, ...props }: RadioGroupProps) {
  return (
    <AriaRadioGroup
      ref={ref}
      {...props}
      className={(state) =>
        cx(
          "flex flex-col gap-2",
          typeof className === "function" ? className(state) : className,
        )
      }
    >
      {children}
    </AriaRadioGroup>
  );
}

/* ------------------------------------------------------------------- radio */

export interface RadioProps extends Omit<AriaRadioProps, "children"> {
  children?: ReactNode;
  size?: RadioSize;
  ref?: Ref<HTMLLabelElement>;
}

export function Radio({ className, children, size = "md", ref, ...props }: RadioProps) {
  const s = dotStyles[size];

  return (
    <AriaRadio
      ref={ref}
      {...props}
      className={(state) =>
        cx(
          "group inline-flex items-center select-none",
          s.gap,
          state.isDisabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
          typeof className === "function" ? className(state) : className,
        )
      }
    >
      {(state) => (
        <>
          <RadioDot selected={state.isSelected} size={size} focusVisible={state.isFocusVisible} />
          {children !== undefined && children !== null && (
            <span className={cx(s.label, "text-text-primary")}>{children}</span>
          )}
        </>
      )}
    </AriaRadio>
  );
}
