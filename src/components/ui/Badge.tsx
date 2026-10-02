import type { ReactNode } from 'react';
import { cx } from './cx';

export function Badge({ tone = 'neutral', dot, size = 'md', children }: {
  tone?: 'success' | 'info' | 'warning' | 'danger' | 'neutral' | 'accent';
  dot?: boolean;
  size?: 'sm' | 'md';
  children?: ReactNode;
}) {
  return (
    <span className={cx('fc-badge', `fc-badge--${tone}`, size === 'sm' && 'fc-badge--sm')}>
      {dot && <span className="fc-badge__dot" />}
      {children}
    </span>
  );
}
