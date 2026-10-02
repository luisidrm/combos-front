import type { HTMLAttributes } from 'react';
import { cx } from './cx';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'solid' | 'glass' | 'grouped';
  padding?: number | string;
}

export function Card({ variant = 'solid', padding, className, style, ...rest }: CardProps) {
  return <div className={cx('fc-card', variant !== 'solid' && `fc-card--${variant}`, className)} style={{ padding, ...style }} {...rest} />;
}
