import type { ReactNode } from 'react';

/** Inset grouped list (design: List). Children are ListRow elements. */
export function List({ header, children }: { header?: ReactNode; children: ReactNode }) {
  return (
    <section className="fc-list">
      {header && <div className="fc-list__header">{header}</div>}
      <div className="fc-list__body">{children}</div>
    </section>
  );
}
