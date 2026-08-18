import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
}

export function Button({
  className,
  variant = 'primary',
  children,
  ...props
}: PropsWithChildren<ButtonProps>) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60',
        variant === 'primary' && 'bg-blue-500 text-white hover:bg-blue-400',
        variant === 'secondary' && 'bg-slate-900 text-slate-100 border border-slate-800 hover:border-slate-700',
        variant === 'ghost' && 'text-slate-300 hover:text-white hover:bg-slate-900',
        variant === 'danger' && 'bg-red-500/90 text-white hover:bg-red-500',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
