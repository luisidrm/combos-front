import { defineRouting } from 'next-intl/routing';

// CLAUDE.md section 8: es is the default (most buyers are Miami-based
// Spanish speakers), en is the fallback for their US-born children.
export const routing = defineRouting({
  locales: ['es', 'en'],
  defaultLocale: 'es',
  localePrefix: 'always',
});

export type AppLocale = (typeof routing.locales)[number];
