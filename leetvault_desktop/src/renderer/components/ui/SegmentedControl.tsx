import { cn } from '../../lib/cn';

interface SegmentedControlOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: SegmentedControlOption<T>[];
  ariaLabel?: string;
  className?: string;
}

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        'inline-flex rounded-lg border border-glass-stroke/10 bg-black/20 p-1',
        className
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => {
              if (!active) onChange(opt.value);
            }}
            className={cn(
              'rounded-md px-4 py-1.5 text-sm font-medium transition',
              active ? 'bg-brand-500 text-black' : 'text-fg/[0.68] hover:text-fg'
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
