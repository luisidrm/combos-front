import { Minus, Plus, Trash2 } from 'lucide-react';
import { cx } from './cx';

interface StepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  size?: 'sm' | 'md';
  /** Stops the buttons while a server round-trip is in flight. */
  disabled?: boolean;
  labels: { less: string; more: string };
}

export function Stepper({ value, onChange, min = 0, max = 99, size = 'md', disabled, labels }: StepperProps) {
  const icon = size === 'sm' ? 14 : 16;
  const set = (n: number) => onChange(Math.min(max, Math.max(min, n)));
  // At the floor of a removable line the minus becomes a trash can — same affordance as the design.
  const removes = value - 1 <= min && min === 0;
  return (
    <div className={cx('fc-stepper', size === 'sm' && 'fc-stepper--sm')}>
      <button type="button" aria-label={labels.less} disabled={disabled || value <= min} onClick={() => set(value - 1)}>
        {removes ? <Trash2 size={icon} aria-hidden /> : <Minus size={icon} aria-hidden />}
      </button>
      <span className="fc-stepper__value" aria-live="polite">{value}</span>
      <button type="button" aria-label={labels.more} disabled={disabled || value >= max} onClick={() => set(value + 1)}>
        <Plus size={icon} aria-hidden />
      </button>
    </div>
  );
}
