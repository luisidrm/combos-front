import type { InputHTMLAttributes } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cx } from './cx';

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string;
  icon?: LucideIcon;
  hint?: string;
  error?: string;
  onChange?: (value: string) => void;
}

export function TextField({ label, icon: Icon, hint, error, onChange, className, ...rest }: TextFieldProps) {
  return (
    <label className={cx('fc-field', error && 'fc-field--error', className)}>
      {label && <span className="fc-field__label">{label}</span>}
      <span className="fc-field__box">
        {Icon && <Icon size={18} aria-hidden />}
        <input className="fc-field__input" onChange={(e) => onChange?.(e.target.value)} {...rest} />
      </span>
      {(error || hint) && <span className="fc-field__hint">{error || hint}</span>}
    </label>
  );
}
