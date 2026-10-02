import type { ButtonHTMLAttributes } from 'react';
import type { LucideIcon } from 'lucide-react';

export function Chip({ active, icon: Icon, children, ...rest }: Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> & { active?: boolean; icon?: LucideIcon }) {
  return (
    <button type="button" className="fc-chip" aria-pressed={!!active} {...rest}>
      {Icon && <Icon size={16} aria-hidden />}
      {children}
    </button>
  );
}
