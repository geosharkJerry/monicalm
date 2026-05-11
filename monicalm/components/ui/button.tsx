'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Genspark-style button:
 *   - No saturated brand colors.
 *   - Default variant is a 1px hairline pill with subtle hover opacity.
 *   - Primary is solid fg-on-bg (inverted).
 */
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium ' +
    'transition-[background,color,border-color,opacity,transform] duration-200 ease-spring ' +
    'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-fg/40 ' +
    'disabled:pointer-events-none disabled:opacity-40 active:scale-[0.985]',
  {
    variants: {
      variant: {
        default:
          'hairline bg-surface hover:bg-surface-2 text-fg shadow-soft',
        primary:
          'bg-fg text-bg hover:opacity-90 shadow-soft',
        ghost: 'text-fg hover:bg-muted',
        outline:
          'hairline bg-transparent text-fg hover:bg-muted',
        danger:
          'hairline bg-transparent text-danger hover:bg-danger/10',
        link: 'text-fg underline-offset-4 hover:underline px-0',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-9 px-4',
        lg: 'h-11 px-6 text-base',
        icon: 'h-9 w-9 p-0',
      },
    },
    defaultVariants: { variant: 'default', size: 'md' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export { buttonVariants };
