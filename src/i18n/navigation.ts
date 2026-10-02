import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

// Locale-aware wrappers so route code never hand-builds a `/es/...` path.
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
