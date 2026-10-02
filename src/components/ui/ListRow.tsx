import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { ChevronRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';

interface ListRowProps {
  icon?: LucideIcon;
  /** Tile colour; any CSS colour or token. Default is the accent. */
  iconBg?: string;
  /** Custom leading node (e.g. a photo); replaces the icon tile. */
  leading?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  value?: ReactNode;
  /** Trailing node, e.g. a status badge. */
  accessory?: ReactNode;
  /** Makes the whole row a link, with a chevron. */
  href?: string;
}

export function ListRow({ icon: Icon, iconBg, leading, title, subtitle, value, accessory, href }: ListRowProps) {
  const content = (
    <>
      {leading ??
        (Icon && (
          <span className="fc-row__tile" style={iconBg ? { ['--tile' as string]: iconBg } : undefined}>
            <Icon size={18} aria-hidden />
          </span>
        ))}
      <div className="fc-row__body">
        <div className="fc-row__title">{title}</div>
        {subtitle && <div className="fc-row__sub">{subtitle}</div>}
      </div>
      {value != null && <div className="fc-row__value">{value}</div>}
      {accessory}
      {href && <ChevronRight size={18} className="fc-row__chev" aria-hidden />}
    </>
  );
  return href ? (
    <Link href={href} className="fc-row fc-row--link">
      {content}
    </Link>
  ) : (
    <div className="fc-row">{content}</div>
  );
}
