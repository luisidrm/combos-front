import type { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from '@/i18n/navigation';

/** Title block with an optional back link (design: PageHead). */
export function PageHead({ title, sub, back }: { title: string; sub?: ReactNode; back?: { href: string; label: string } }) {
  return (
    <div className="fc-pagehead">
      {back && (
        <Link href={back.href} className="fc-back">
          <ArrowLeft size={16} aria-hidden />
          {back.label}
        </Link>
      )}
      <h1 className="fc-pagehead__title">{title}</h1>
      {sub && <div className="fc-pagehead__sub">{sub}</div>}
    </div>
  );
}
