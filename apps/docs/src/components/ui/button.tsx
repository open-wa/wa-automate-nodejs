'use client';

import * as React from 'react';
import {
  Button as SharedButton,
  type ButtonProps as SharedButtonProps,
} from '@open-wa/ui-components/button';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../../lib/cn';

const variants = {
  primary:
    'border border-primary/30 bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground',
  outline: 'border border-border bg-card text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground',
  ghost: 'text-foreground hover:bg-accent hover:text-accent-foreground',
  secondary:
    'border border-primary/15 bg-secondary text-secondary-foreground shadow-sm hover:bg-accent hover:text-accent-foreground',
} as const;

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-lg p-2 text-sm font-medium transition-colors duration-100 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
  {
    variants: {
      variant: variants,
      // Fumadocs uses `color` instead of `variant` in several slot APIs.
      color: variants,
      size: {
        sm: 'gap-1 px-2 py-1.5 text-xs',
        icon: 'p-1.5 [&_svg]:size-5',
        'icon-sm': 'p-1.5 [&_svg]:size-4.5',
        'icon-xs': 'p-1 [&_svg]:size-4',
      },
    },
  },
);

export type ButtonProps = Omit<
  SharedButtonProps,
  'className' | 'size' | 'variant'
> &
  VariantProps<typeof buttonVariants> & {
    className?: string;
  };

export const Button = React.forwardRef<HTMLElement, ButtonProps>(
  ({ className, variant, color, size, ...props }, ref) => {
    const selectedVariant = variant ?? color ?? 'primary';

    return (
      <SharedButton
        ref={ref}
        variant={selectedVariant}
        size={size}
        className={cn(
          buttonVariants({
            variant: selectedVariant,
            color: selectedVariant,
            size,
          }),
          className,
        )}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export { buttonVariants };
