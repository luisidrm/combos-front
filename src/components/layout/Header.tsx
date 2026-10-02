import { Link } from '@/i18n/navigation';
import { NavLinks } from './NavLinks';
import { CartBadge } from './CartBadge';
import { HeaderSignIn } from './HeaderSignIn';
import { LocaleSwitcher } from './LocaleSwitcher';
import { ThemeToggle } from './ThemeToggle';

// Server Component shell; NavLinks / CartBadge / LocaleSwitcher / ThemeToggle
// are the small client islands (CLAUDE.md section 7). The design's brand is one
// fixed wordmark, so this no longer fetches the tenant.
export function Header() {
  return (
    <header className="fc-header">
      <div className="fc-header__inner">
        <Link href="/" className="fc-wordmark">
          food-combos
        </Link>
        <NavLinks />
        <div className="fc-spacer" />
        <LocaleSwitcher />
        <ThemeToggle />
        <CartBadge />
        <HeaderSignIn />
      </div>
    </header>
  );
}
