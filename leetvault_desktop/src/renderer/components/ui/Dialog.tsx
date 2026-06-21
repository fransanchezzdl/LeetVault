import * as RDialog from '@radix-ui/react-dialog';
import { type ReactNode } from 'react';
import { cn } from '../../lib/cn';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const sizes = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
};

export function Dialog({ open, onOpenChange, title, description, children, size = 'md' }: Props) {
  return (
    <RDialog.Root open={open} onOpenChange={onOpenChange}>
      <RDialog.Portal>
        <RDialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in" />
        <RDialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50 w-[92vw] -translate-x-1/2 -translate-y-1/2 glass-card p-6 outline-none',
            sizes[size]
          )}
        >
          <RDialog.Title className="text-lg font-semibold text-fg">{title}</RDialog.Title>
          {description ? (
            <RDialog.Description className="mt-1 text-xs text-fgMuted">{description}</RDialog.Description>
          ) : null}
          <div className="mt-4">{children}</div>
        </RDialog.Content>
      </RDialog.Portal>
    </RDialog.Root>
  );
}
