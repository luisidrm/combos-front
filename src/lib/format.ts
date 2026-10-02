// CLAUDE.md section 8: currency via Intl.NumberFormat, dates via
// Intl.DateTimeFormat — never hand-formatted.
export function formatCents(cents: number, locale: string, currency = 'USD'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(cents / 100);
}

// Brand rule (design BRAND-GUIDE, "Numbers"): prices always read `$48.50` in
// both languages — the es locale's own rendering ("48,50 US$") is not used.
const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
export function formatUsd(cents: number): string {
  return usd.format(cents / 100);
}

export function formatDate(value: string | Date, locale: string): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}
