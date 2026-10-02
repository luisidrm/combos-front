// CLAUDE.md section 5: `es` is required, `en` falls back to `es`.
export function localized(locale: string, es: string, en: string | null | undefined): string {
  return locale === 'en' && en ? en : es;
}
