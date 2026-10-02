import type { SelectHTMLAttributes } from 'react';
import { cx } from './cx';

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
  /** Text of the empty first option. */
  placeholder?: string;
  onChange?: (value: string) => void;
}

/** Native select in the TextField look (keeps the mobile pickers people already know). */
export function Select({ label, error, options, placeholder, onChange, className, ...rest }: SelectProps) {
  return (
    <label className={cx('fc-field', error && 'fc-field--error', className)}>
      {label && <span className="fc-field__label">{label}</span>}
      <span className="fc-field__box">
        <select className="fc-field__input" onChange={(e) => onChange?.(e.target.value)} {...rest}>
          {placeholder !== undefined && <option value="">{placeholder}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </span>
      {error && <span className="fc-field__hint">{error}</span>}
    </label>
  );
}
