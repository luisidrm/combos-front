import type { ReactNode } from 'react';

interface SegmentedControlProps<T extends string> {
  options: Array<{ value: T; label: ReactNode }>;
  value: T;
  onChange: (value: T) => void;
  label: string;
  size?: 'sm' | 'md';
  block?: boolean;
}

/** Pill switch: sm (32px) for the ES/EN toggle, md (38px) for form tabs. */
export function SegmentedControl<T extends string>({ options, value, onChange, label, size = 'sm', block }: SegmentedControlProps<T>) {
  const i = Math.max(0, options.findIndex((o) => o.value === value));
  return (
    <div className={`fc-seg${size === 'md' ? ' fc-seg--md' : ''}${block ? ' fc-seg--block' : ''}`} role="tablist" aria-label={label} style={{ ['--n' as string]: options.length, ['--i' as string]: i }}>
      <span className="fc-seg__thumb" />
      {options.map((o) => (
        <button key={o.value} type="button" role="tab" aria-selected={o.value === value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
