'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        'flex h-9 w-full rounded-xl hairline bg-transparent px-3.5 py-2 text-sm',
        'placeholder:text-muted-fg/70',
        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-fg/30 focus-visible:border-fg/30',
        'transition-colors duration-200',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';
