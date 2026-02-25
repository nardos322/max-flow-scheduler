import type { PropsWithChildren } from 'react';
import { cn } from '../../lib/cn.js';

type CardProps = PropsWithChildren<{ className?: string }>;

export function Card({ children, className }: CardProps) {
  return <section className={cn('rounded-xl border border-slate-200 bg-white p-6 shadow-panel', className)}>{children}</section>;
}
