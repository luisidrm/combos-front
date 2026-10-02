import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { StoreProvider } from '@/store/Provider';
import { Header } from '@/components/layout/Header';
import { MobileTabBar } from '@/components/layout/NavLinks';
import './globals.css';

// Geist / Geist Mono from the design handoff, self-hosted (no Google Fonts request).
const geistSans = localFont({ src: '../fonts/Geist-Variable.woff2', variable: '--font-geist-sans', weight: '100 900', display: 'swap' });
const geistMono = localFont({ src: '../fonts/GeistMono-Variable.woff2', variable: '--font-geist-mono', weight: '100 900', display: 'swap' });

// Every page here reads from a live API (catalog stock/prices, sessions,
// tenant branding) — there is nothing meaningful to bake in at build time,
// and build-time prerendering can't run against a database that only
// exists once the stack is actually up. Pages still render on the server
// per-request (CLAUDE.md section 7's "RSC fetching directly"), just not
// ahead of time.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'food-combos',
  description: 'Combos para tu familia en Cuba',
};

// Runs before first paint so the saved (or OS) theme is applied with no flash.
// Keep in sync with THEME_KEY in components/layout/ThemeToggle.tsx.
const THEME_SCRIPT = `try{var t=localStorage.getItem('fc-theme');if(t!=='light'&&t!=='dark'){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.setAttribute('data-theme',t)}catch(e){}`;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  // Lets every Server Component in this subtree call getTranslations()
  // without repeating the locale — required for static rendering.
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    // suppressHydrationWarning: THEME_SCRIPT sets data-theme on <html> before React hydrates.
    <html lang={locale} className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider messages={messages}>
          <StoreProvider>
            <Header />
            <main className="fc-main">{children}</main>
            <MobileTabBar />
          </StoreProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
