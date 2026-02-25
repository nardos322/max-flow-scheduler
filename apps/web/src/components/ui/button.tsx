import { cva, type VariantProps } from 'class-variance-authority';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/cn.js';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-brand-600 text-white hover:bg-brand-700',
        outline: 'border border-slate-300 bg-white text-slate-900 hover:bg-slate-50',
      },
      size: {
        sm: 'h-9 px-3',
        md: 'h-10 px-4',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
