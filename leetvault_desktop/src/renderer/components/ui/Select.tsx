import * as RSelect from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';
import { forwardRef, type ReactNode } from 'react';
import { cn } from '../../lib/cn';

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  children: ReactNode;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  name?: string;
  id?: string;
  'aria-label'?: string;
}

export const Select = forwardRef<HTMLButtonElement, SelectProps>(function Select(
  { value, onValueChange, children, placeholder, className, disabled, name, id, 'aria-label': ariaLabel },
  ref
) {
  return (
    <RSelect.Root value={value} onValueChange={onValueChange} disabled={disabled} name={name}>
      <RSelect.Trigger
        ref={ref}
        id={id}
        aria-label={ariaLabel}
        className={cn(
          'inline-flex h-9 w-full items-center justify-between gap-2 rounded-md border border-glass-stroke bg-bg-200/70 px-3 text-sm text-fg outline-none transition',
          'hover:bg-bg-200/90 focus:border-brand-500 data-[state=open]:border-brand-500',
          'data-[placeholder]:text-fgMuted',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
      >
        <RSelect.Value placeholder={placeholder} />
        <RSelect.Icon className="text-fgMuted">
          <ChevronDown className="h-4 w-4" />
        </RSelect.Icon>
      </RSelect.Trigger>

      <RSelect.Portal>
        <RSelect.Content
          position="popper"
          sideOffset={6}
          collisionPadding={8}
          className={cn(
            'z-50 overflow-hidden rounded-xl border border-glass-stroke bg-bg-200/95 shadow-glass backdrop-blur-md',
            'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
            'min-w-[var(--radix-select-trigger-width)]'
          )}
        >
          <RSelect.Viewport className="p-1">{children}</RSelect.Viewport>
        </RSelect.Content>
      </RSelect.Portal>
    </RSelect.Root>
  );
});

interface SelectOptionProps {
  value: string;
  children: ReactNode;
  disabled?: boolean;
  className?: string;
}

export const SelectOption = forwardRef<HTMLDivElement, SelectOptionProps>(function SelectOption(
  { value, children, disabled, className },
  ref
) {
  return (
    <RSelect.Item
      ref={ref}
      value={value}
      disabled={disabled}
      className={cn(
        'relative flex cursor-pointer select-none items-center gap-2 rounded-lg py-1.5 pl-7 pr-3 text-sm text-fgSoft outline-none',
        'data-[highlighted]:bg-white/8 data-[highlighted]:text-fg',
        'data-[state=checked]:text-fg data-[state=checked]:font-medium',
        'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-40',
        className
      )}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center text-brand-400">
        <RSelect.ItemIndicator>
          <Check className="h-3.5 w-3.5" />
        </RSelect.ItemIndicator>
      </span>
      <RSelect.ItemText>{children}</RSelect.ItemText>
    </RSelect.Item>
  );
});
