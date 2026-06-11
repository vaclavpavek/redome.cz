/**
 * Centrální konfigurace webu – URL, kontakty, navigace, sociální sítě.
 * Mění se tady, ne ve více komponentách najednou.
 */

// SITE_URL přebíráme z env (stejně jako v astro.config.mjs), aby stage
// (nahled.redome.cz) generovala správné canonical / OG / sitemap URL.
// Default produkce: https://www.redome.cz
const SITE_URL = (import.meta.env.SITE_URL ?? 'https://www.redome.cz').replace(/\/$/, '');

const PRODUCTION_URL = 'https://www.redome.cz';

/**
 * `true` jen pro produkční build (`SITE_URL === https://www.redome.cz`).
 * Používá se pro:
 *   - globální `noindex,nofollow` na stage/feature deploys
 *   - `robots.txt` s `Disallow: /` mimo produkci
 * Tím se nahled.redome.cz a feature větve nedostanou do Google indexu
 * a nekonkurují s produkční doménou v SERP.
 */
export const IS_PRODUCTION = SITE_URL === PRODUCTION_URL;

export const SITE = {
  url: SITE_URL,
  name: 'Redome.cz',
  shortName: 'Redome',
  tagline: 'Reiki a terapeutické služby',
  description:
    'Reiki, Dornova metoda a Breussova masáž. Karel Háněl – mistr Reiki. Najděte rovnováhu těla i mysli.',
  locale: 'cs_CZ',
  lang: 'cs',
} as const;

export const CONTACT = {
  person: 'Karel Háněl',
  phone: '+420 775 330 771',
  phoneHref: 'tel:+420775330771',
  email: 'karel@redome.cz',
  emailHref: 'mailto:karel@redome.cz',
  address: {
    street: 'Peciny 196',
    city: 'Litomyšl',
    zip: '570 01',
    country: 'CZ',
  },
} as const;

export const CONTACT_SECONDARY = {
  person: 'Monika Bišická',
  phone: '+420 739 033 191',
  phoneHref: 'tel:+420739033191',
  email: 'monika@redome.cz',
  emailHref: 'mailto:monika@redome.cz',
} as const;

export const CREDITS = {
  authors: [
    {
      name: 'Václav Pávek',
      url: 'https://www.vaclavpavek.cz/',
      role: 'programování',
    },
    {
      name: 'Jan Chalupník',
      url: 'https://www.janchalupnik.cz/',
      role: 'grafika a design',
    },
  ],
} as const;

export const SOCIAL = {
  // Doplň skutečné URL nebo nech prázdné – komponenty si je odfiltrují
  facebook: 'https://www.facebook.com/redome.cz',
  instagram: '',
} as const;

/**
 * hCaptcha invisible – ochrana kontaktního formuláře.
 * Site key je veřejný (vystavuje se v HTML), secret žije jen na backendu
 * (env `HCAPTCHA_SECRET` v dev, soubor mimo deploy na produkci).
 * Docs: https://docs.hcaptcha.com/invisible
 */
export const HCAPTCHA_SITE_KEY = 'cb2063a0-9696-4074-afce-f292e2d80b68';

export type NavItem = { href: string; label: string };

export const MAIN_NAV: NavItem[] = [
  { href: '/co-je-reiki', label: 'O Reiki' },
  { href: '/reiki-mistri', label: 'Reiki mistři' },
  { href: '/dornova-metoda', label: 'Dornova metoda' },
  { href: '/breussova-masaz', label: 'Breussova masáž' },
  { href: '/pribehy-z-praxe', label: 'Příběhy z praxe' },
  { href: '/kontakty', label: 'Kontakty' },
];

export const FOOTER_NAV: NavItem[] = [
  { href: '/co-je-reiki', label: 'O Reiki' },
  { href: '/reiki-mistri', label: 'Reiki mistři' },
  { href: '/dornova-metoda', label: 'Dornova metoda' },
  { href: '/breussova-masaz', label: 'Breussova masáž' },
  { href: '/pribehy-z-praxe', label: 'Příběhy z praxe' },
];
