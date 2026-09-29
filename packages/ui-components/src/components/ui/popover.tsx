'use client';

import * as React from 'react';
import { Popover as PopoverPrimitive } from '@base-ui/react/popover';

import { cn } from '../../lib/utils';

const Popover = PopoverPrimitive.Root;
const PopoverPortal = PopoverPrimitive.Portal;

type PopoverTriggerProps = React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Trigger> & {
  asChild?: boolean;
};

const PopoverTrigger = React.forwardRef<HTMLElement, PopoverTriggerProps>(
  ({ asChild = false, children, ...props }, ref) => {
    const render = asChild && React.isValidElement(children) ? children : undefined;
    return (
      <PopoverPrimitive.Trigger ref={ref} render={render} {...props}>
        {render ? undefined : children}
      </PopoverPrimitive.Trigger>
    );
  },
);
PopoverTrigger.displayName = 'PopoverTrigger';

type PopoverCloseProps = React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Close> & {
  asChild?: boolean;
};

const PopoverClose = React.forwardRef<HTMLButtonElement, PopoverCloseProps>(
  ({ asChild = false, children, ...props }, ref) => {
    const render = asChild && React.isValidElement(children) ? children : undefined;
    return (
      <PopoverPrimitive.Close ref={ref} render={render} {...props}>
        {render ? undefined : children}
      </PopoverPrimitive.Close>
    );
  },
);
PopoverClose.displayName = 'PopoverClose';

type PopoverContentProps = PopoverPrimitive.Popup.Props &
  Pick<
    PopoverPrimitive.Positioner.Props,
    'align' | 'alignOffset' | 'side' | 'sideOffset'
  >;

const PopoverContent = React.forwardRef<HTMLDivElement, PopoverContentProps>(
  (
    {
      className,
      align = 'center',
      alignOffset = 0,
      side = 'bottom',
      sideOffset = 4,
      ...props
    },
    ref,
  ) => (
    <PopoverPortal>
      <PopoverPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        className="isolate z-50 outline-none"
      >
        <PopoverPrimitive.Popup
          ref={ref}
          data-slot="popover-content"
          className={cn(
            'z-50 max-h-(--available-height) min-w-60 max-w-[98vw] origin-(--transform-origin) overflow-y-auto rounded-xl border border-border bg-popover p-2 text-sm text-popover-foreground shadow-lg outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95',
            className,
          )}
          {...props}
        />
      </PopoverPrimitive.Positioner>
    </PopoverPortal>
  ),
);
PopoverContent.displayName = 'PopoverContent';

export {
  Popover,
  PopoverTrigger,
  PopoverPortal,
  PopoverContent,
  PopoverClose,
};
