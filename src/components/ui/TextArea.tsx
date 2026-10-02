import type { TextareaHTMLAttributes } from 'react';
import { cx } from './cx';

interface TextAreaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
  label?: string;
  hint?: string;
  error?: string;
  onChange?: (value: string) => void;
}

export function TextArea({ label, hint, error, onChange, className, rows = 3, ...rest }: TextAreaProps) {
  return (
    <label className={cx('fc-field', error && 'fc-field--error', className)}>
      {label && <span className="fc-field__label">{label}</span>}
      <span className="fc-field__box" style={{ alignItems: 'flex-start', padding: '12px 14px' }}>
        <textarea className="fc-field__input" rows={rows} style={{ resize: 'vertical' }} onChange={(e) => onChange?.(e.target.value)} {...rest} />
      </span>
      {(error || hint) && <span className="fc-field__hint">{error || hint}</span>}
    </label>
  );
}
