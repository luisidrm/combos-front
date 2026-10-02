import type { ButtonHTMLAttributes } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cx } from './cx';

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  icon: LucideIcon;
  /** Required: icon-only controls need an accessible name. */
  label: string;
  variant?: 'glass' | 'fill' | 'plain' | 'primary';
  /** Diameter in px. */
  size?: number;
  badge?: number | string;
}

export function IconButton({ icon: Icon, label, variant = 'glass', size = 40, badge, className, style, ...rest }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cx('fc-iconbtn', `fc-iconbtn--${variant}`, className)}
      style={{ ['--s' as string]: `${size}px`, ...style }}
      {...rest}
    >
      <Icon size={Math.round(size * 0.48)} aria-hidden />
      {badge != null && <span className="fc-iconbtn__badge">{badge}</span>}
    </button>
  );
}
