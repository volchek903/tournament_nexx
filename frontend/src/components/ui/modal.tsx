import type { PropsWithChildren } from 'react';
import { cn } from '@/lib/utils';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  className?: string;
}

export function Modal({ open, onClose, title, className, children }: PropsWithChildren<ModalProps>) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4">
      <div className="absolute inset-0" onClick={onClose} />
      <div className={cn('relative z-10 w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6', className)}>
        <div className="mb-4 flex items-center justify-between gap-4">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="text-slate-500 transition hover:text-white">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
