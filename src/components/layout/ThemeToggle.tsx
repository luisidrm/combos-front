'use client';

import { useSyncExternalStore } from 'react';
import { useTranslations } from 'next-intl';
import { Moon, Sun } from 'lucide-react';
import { IconButton } from '@/components/ui/IconButton';

export const THEME_KEY = 'fc-theme';

// <html data-theme> is the source of truth. An inline script in the root layout
// sets it before first paint (saved choice, else the OS preference), so there is
// no flash; this just flips it and remembers the choice. A theme is a
// per-device convenience, not app state, so it stays out of redux-persist
// (CLAUDE.md section 7: persist almost nothing).
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  return () => observer.disconnect();
}
const getTheme = () => (document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getTheme, () => 'light' as const);
  const setTheme = (next: 'light' | 'dark') => {
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // Private mode / blocked storage: the choice just won't outlive the tab.
    }
  };
  return { theme, setTheme };
}

export function ThemeToggle() {
  const t = useTranslations('nav');
  const { theme, setTheme } = useTheme();

  return (
    <IconButton
      icon={theme === 'dark' ? Sun : Moon}
      label={t('theme')}
      variant="plain"
      size={38}
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    />
  );
}
