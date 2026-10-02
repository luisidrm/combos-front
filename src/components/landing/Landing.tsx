import { getLocale, getTranslations } from 'next-intl/server';
import { ArrowRight, Camera, ChevronDown, Clock, CreditCard, Gift, Languages, Mail, MapPin, Package, Phone, Truck } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ProductCard } from '@/components/catalog/ProductCard';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Photo } from '@/components/ui/Photo';
import { Link } from '@/i18n/navigation';
import { categoryIcon } from '@/lib/categoryIcons';
import { formatUsd } from '@/lib/format';
import { localized } from '@/lib/localized';
import type { Category, Product } from '@/store/api/catalogApi';
import type { DeliveryZone } from '@/store/api/geoApi';
import type { PublicTenant } from '@/store/api/tenancyApi';

interface Props {
  tenant: PublicTenant | null;
  categories: Category[];
  products: Product[];
  zones: DeliveryZone[];
}

const DAYS = [0, 1, 2, 3, 4, 5, 6];
const FAQ = ['howLong', 'pay', 'account', 'where', 'proof', 'gift', 'cancel'] as const;
const WHY = [
  { key: 'speed', icon: Truck },
  { key: 'proof', icon: Camera },
  { key: 'stock', icon: Package },
  { key: 'pay', icon: CreditCard },
  { key: 'gift', icon: Gift },
  { key: 'language', icon: Languages },
] as const;

// "HH:MM" (Cuba time) -> a clock time in the reader's format ("2:00 p. m." / "2:00 PM").
function clock(locale: string, hhmm: string): string {
  return new Intl.DateTimeFormat(locale, { timeStyle: 'short', timeZone: 'UTC' }).format(new Date(`1970-01-01T${hhmm}:00Z`));
}

/**
 * What a visitor needs to decide to sign up: what we do, how it works, why it is different, what is
 * in the shop, where we deliver and at what price, when and how to reach us, and the questions
 * people ask before sending money to Cuba. Everything specific (areas, fees, hours, contact, free
 * delivery) comes from the shop's own settings, so it cannot drift from what checkout charges.
 */
export async function Landing({ tenant, categories, products, zones }: Props) {
  const locale = await getLocale();
  const t = await getTranslations('landing');

  const cutoff = tenant?.sameDayCutoff ? clock(locale, tenant.sameDayCutoff) : null;
  const freeOver = tenant?.freeDeliveryOverCents != null ? formatUsd(tenant.freeDeliveryOverCents) : null;
  const inStock = products.filter((p) => p.stockStatus !== 'out');
  const featured = inStock.slice(0, 4);
  const mosaic = inStock.filter((p) => p.cover).slice(0, 4);
  const places = [...zones]
    .sort((a, b) => localized(locale, a.municipality.nameEs, a.municipality.nameEn).localeCompare(localized(locale, b.municipality.nameEs, b.municipality.nameEn), locale))
    .map((z) => ({
      id: z.id,
      name: `${localized(locale, z.municipality.nameEs, z.municipality.nameEn)}, ${localized(locale, z.province.nameEs, z.province.nameEn)}`,
      fee: formatUsd(z.feeCents),
    }));
  const hours = tenant?.openingHours ?? null;
  const contact = tenant?.contact ?? { phone: null, email: null, address: null };
  const hasContact = Boolean(contact.phone || contact.email || contact.address);
  const weekday = (i: number) => new Intl.DateTimeFormat(locale, { weekday: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(2024, 0, 1 + i))); // 2024-01-01 was a Monday

  const faqAnswer = (key: (typeof FAQ)[number]) =>
    key === 'howLong' ? (cutoff ? t('faq.howLong.a', { time: cutoff }) : t('faq.howLong.aNoCutoff')) : t(`faq.${key}.a`);
  const whyText = (key: (typeof WHY)[number]['key']) =>
    key === 'pay' && freeOver ? t('why.pay.textFree', { amount: freeOver }) : t(`why.${key}.text`);

  return (
    <div className="fc-landwrap">
      <div className="fc-landbg" aria-hidden>
        <span className="fc-landbg__glow fc-landbg__glow--a" />
        <span className="fc-landbg__glow fc-landbg__glow--b" />
        <span className="fc-landbg__glow fc-landbg__glow--c" />
      </div>
      <div className="fc-land">
      <section className="fc-hero" aria-labelledby="land-title">
        <div className="fc-hero__copy">
          <span className="fc-hero__eyebrow">{t('hero.eyebrow')}</span>
          <h1 id="land-title" className="fc-hero__title">{t('hero.title')}</h1>
          <p className="fc-hero__sub">{t('hero.sub')}</p>
          <div className="fc-hero__cta">
            <Link href="/shop" className="fc-btn fc-btn--primary fc-btn--lg">
              {t('hero.shop')}
              <ArrowRight size={18} aria-hidden />
            </Link>
            <Link href="/account/sign-in?mode=signup" className="fc-btn fc-btn--secondary fc-btn--lg">
              {t('hero.signup')}
            </Link>
          </div>
          <div className="fc-shop__perks">
            <span className="fc-shop__perk"><Truck size={16} aria-hidden />{cutoff ? t('hero.perkCutoff', { time: cutoff }) : t('hero.perkSameDay')}</span>
            <span className="fc-shop__perk"><Camera size={16} aria-hidden />{t('hero.perkProof')}</span>
            <span className="fc-shop__perk"><CreditCard size={16} aria-hidden />{t('hero.perkUsd')}</span>
          </div>
        </div>
        {mosaic.length >= 2 && (
          <div className="fc-hero__mosaic" style={{ ['--n' as string]: mosaic.length }} aria-hidden>
            {mosaic.map((p, i) => (
              <div key={p.id} className="fc-hero__tile">
                <Photo picture={p.cover} alt="" sizes="(min-width: 900px) 280px, 45vw" radius={0} priority={i < 2} />
              </div>
            ))}
          </div>
        )}
      </section>

      <section id="how" aria-labelledby="how-title">
        <div className="fc-land__head">
          <h2 id="how-title" className="fc-land__title">{t('how.title')}</h2>
          <p className="fc-land__lead">{t('how.lead')}</p>
        </div>
        <div className="fc-land__grid">
          {(['choose', 'who', 'pay', 'receive'] as const).map((key, i) => (
            <Card key={key} padding={22} className="fc-land__card">
              <span className="fc-section__n">{i + 1}</span>
              <h3>{t(`how.${key}.title`)}</h3>
              <p>{t(`how.${key}.text`)}</p>
            </Card>
          ))}
        </div>
      </section>

      <section aria-labelledby="why-title">
        <div className="fc-land__head">
          <h2 id="why-title" className="fc-land__title">{t('why.title')}</h2>
          <p className="fc-land__lead">{t('why.lead')}</p>
        </div>
        <div className="fc-land__grid">
          {WHY.map(({ key, icon: Icon }) => (
            <Card key={key} padding={22} className="fc-land__card">
              <span className="fc-land__icon"><Icon size={22} aria-hidden /></span>
              <h3>{t(`why.${key}.title`)}</h3>
              <p>{whyText(key)}</p>
            </Card>
          ))}
        </div>
      </section>

      {featured.length > 0 && (
        <section aria-labelledby="shop-title">
          <div className="fc-land__head">
            <h2 id="shop-title" className="fc-land__title">{t('shop.title')}</h2>
            <p className="fc-land__lead">{t('shop.lead')}</p>
          </div>
          {categories.length > 0 && (
            <div className="fc-land__cats">
              {categories.map((c) => (
                <Link key={c.id} href="/shop" className="fc-chip">
                  <Glyph icon={categoryIcon(c.icon)} />
                  {localized(locale, c.nameEs, c.nameEn)}
                </Link>
              ))}
            </div>
          )}
          <div className="fc-grid">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          <div className="fc-land__more">
            <Link href="/shop" className="fc-btn fc-btn--secondary">
              {t('shop.all')}
              <ArrowRight size={16} aria-hidden />
            </Link>
          </div>
        </section>
      )}

      {places.length > 0 && (
        <section aria-labelledby="where-title">
          <div className="fc-land__head">
            <h2 id="where-title" className="fc-land__title">{t('where.title')}</h2>
            <p className="fc-land__lead">{freeOver ? t('where.leadFree', { amount: freeOver }) : t('where.lead')}</p>
          </div>
          <div className="fc-zonechips">
            {places.map((p) => (
              <span key={p.id} className="fc-zonechip">
                <MapPin size={15} aria-hidden />
                {p.name}
                <span className="fc-zonechip__fee">{t('where.fee', { fee: p.fee })}</span>
              </span>
            ))}
          </div>
        </section>
      )}

      {(hours || hasContact) && (
        <section aria-labelledby="visit-title">
          <div className="fc-land__head">
            <h2 id="visit-title" className="fc-land__title">{t('visit.title')}</h2>
            <p className="fc-land__lead">{t('visit.lead')}</p>
          </div>
          <div className="fc-land__split">
            {hours && (
              <Card padding={22}>
                <div className="fc-land__card"><h3><Clock size={18} aria-hidden style={{ verticalAlign: '-3px', marginRight: 8 }} />{t('visit.hours')}</h3></div>
                <div className="fc-hours">
                  {DAYS.map((i) => {
                    const day = hours[i] ?? null;
                    return (
                      <div key={i} className="fc-hours__row" data-closed={day ? 'false' : 'true'}>
                        <span style={{ textTransform: 'capitalize' }}>{weekday(i)}</span>
                        <span>{day ? `${clock(locale, day.open)} – ${clock(locale, day.close)}` : t('visit.closed')}</span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
            {hasContact && (
              <Card padding={22}>
                <div className="fc-land__card"><h3>{t('visit.contact')}</h3></div>
                <div className="fc-contact" style={{ marginTop: 10 }}>
                  {contact.phone && <a href={`tel:${contact.phone.replace(/[^\d+]/g, '')}`}><Phone size={18} aria-hidden />{contact.phone}</a>}
                  {contact.email && <a href={`mailto:${contact.email}`}><Mail size={18} aria-hidden />{contact.email}</a>}
                  {contact.address && <div><MapPin size={18} aria-hidden />{contact.address}</div>}
                </div>
              </Card>
            )}
          </div>
        </section>
      )}

      <section aria-labelledby="faq-title">
        <div className="fc-land__head">
          <h2 id="faq-title" className="fc-land__title">{t('faq.title')}</h2>
        </div>
        <div className="fc-faq">
          {FAQ.map((key) => (
            <details key={key} className="fc-faq__item">
              <summary>
                {t(`faq.${key}.q`)}
                <ChevronDown size={18} aria-hidden />
              </summary>
              <p>{faqAnswer(key)}</p>
            </details>
          ))}
        </div>
      </section>

      <section>
        <Card variant="glass" padding={36} className="fc-land__cta">
          <Badge tone="accent">{t('cta.badge')}</Badge>
          <h2 className="fc-land__title">{t('cta.title')}</h2>
          <p className="fc-land__lead">{t('cta.text')}</p>
          <div className="fc-hero__cta" style={{ justifyContent: 'center' }}>
            <Link href="/shop" className="fc-btn fc-btn--primary fc-btn--lg">{t('hero.shop')}</Link>
            <Link href="/account/sign-in?mode=signup" className="fc-btn fc-btn--secondary fc-btn--lg">{t('hero.signup')}</Link>
          </div>
        </Card>
      </section>

      <footer className="fc-footer">
        <span>
          <span className="fc-wordmark">food-combos</span> · {t('footer.tagline')}
        </span>
        <nav aria-label={t('footer.nav')}>
          <Link href="/shop">{t('footer.shop')}</Link>
          <Link href="/account/sign-in">{t('footer.signin')}</Link>
          <a href="#how">{t('footer.how')}</a>
        </nav>
      </footer>
      </div>
    </div>
  );
}

function Glyph({ icon: Icon }: { icon?: LucideIcon }) {
  return Icon ? <Icon size={16} aria-hidden /> : null;
}
