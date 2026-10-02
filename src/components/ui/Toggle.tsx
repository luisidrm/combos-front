interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}

/** iOS-style switch (design: Toggle). */
export function Toggle({ checked, onChange, label, disabled }: ToggleProps) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} disabled={disabled} className="fc-toggle" onClick={() => onChange(!checked)}>
      <span className="fc-toggle__knob" />
    </button>
  );
}
