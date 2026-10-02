import type { ButtonHTMLAttributes, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cx } from './cx';

type Variant = 'primary' | 'secondary' | 'glass' | 'tinted' | 'plain' | 'destructive';
type Size = 'sm' | 'md' | 'lg';
const ICON_PX: Record<Size, number> = { sm: 16, md: 18, lg: 20 };

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant?: Variant;
  size?: Size;
  icon?: LucideIcon;
  iconRight?: LucideIcon;
  block?: boolean;
  loading?: boolean;
  children?: ReactNode;
}

/** Pill-shaped action button (design-system/components/actions/Button). */
export function Button({
  variant = 'primary', size = 'md', icon: Icon, iconRight: IconRight, block, loading, disabled, className, children, type = 'button', ...rest
}: ButtonProps) {
  const px = ICON_PX[size];
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cx('fc-btn', `fc-btn--${variant}`, size !== 'md' && `fc-btn--${size}`, block && 'fc-btn--block', className)}
      {...rest}
    >
      {loading ? <span className="fc-spin" style={{ fontSize: px }} aria-hidden /> : Icon && <Icon size={px} aria-hidden />}
      {children}
      {IconRight && <IconRight size={px} aria-hidden />}
    </button>
  );
}
