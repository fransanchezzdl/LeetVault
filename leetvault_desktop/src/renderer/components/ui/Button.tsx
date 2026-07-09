import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

type Variant = 'primary' | 'ghost' | 'danger' | 'outline';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const variants: Record<Variant, string> = {
  primary: 'btn-primary',
  ghost: 'btn text-fgSoft hover:bg-fg/5',
  danger: 'btn-danger',
  outline: 'btn border border-glass-stroke/10 bg-fg/[0.04] text-fgSoft hover:bg-fg/[0.08]',
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = 'primary', className, type = 'button', ...rest },
  ref
) {
  return <button ref={ref} type={type} className={cn(variants[variant], className)} {...rest} />;
});
