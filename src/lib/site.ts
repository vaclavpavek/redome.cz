/**
 * Centrální konfigurace webu – URL, kontakty, navigace, sociální sítě.
 * Mění se tady, ne ve více komponentách najednou.
 */

export const SITE = {
  url: 'https://redome.cz',
  name: 'Redome.cz',
  shortName: 'Redome',
  tagline: 'Reiki a terapeutické služby',
  description:
    'Reiki, Dornova metoda a Breussova masáž. Kanit Hauel – mistr Reiki. Najděte rovnováhu těla i mysli.',
  locale: 'cs_CZ',
  lang: 'cs',
} as const;

export const CONTACT = {
  person: 'Karel Háněl',
  phone: '+420 775 504 175',
  phoneHref: 'tel:+420775504175',
  email: 'redome@redome.cz',
  emailHref: 'mailto:redome@redome.cz',
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
  email: 'redome@redome.cz',
  emailHref: 'mailto:redome@redome.cz',
} as const;

export const CREDITS = {
  by: 'Jan Chalupník & Václav Pávek',
} as const;

export const SOCIAL = {
  // Doplň skutečné URL nebo nech prázdné – komponenty si je odfiltrují
  facebook: '',
  instagram: '',
} as const;

export type NavItem = { href: string; label: string };

export const MAIN_NAV: NavItem[] = [
  { href: '/co-je-reiki', label: 'O Reiki' },
  { href: '/reiki-mistri', label: 'Reiki mistři' },
  { href: '/dornova-metoda', label: 'Dornova metoda' },
  { href: '/breussova-masaz', label: 'Breussova masáž' },
  { href: '/pribehy-z-praxe', label: 'Příběhy z praxe' },
  { href: '/kontakt', label: 'Kontakt' },
];

export const FOOTER_NAV: NavItem[] = [
  { href: '/co-je-reiki', label: 'O Reiki' },
  { href: '/reiki-mistri', label: 'Reiki mistři' },
  { href: '/dornova-metoda', label: 'Dornova metoda' },
  { href: '/breussova-masaz', label: 'Breussova masáž' },
  { href: '/pribehy-z-praxe', label: 'Příběhy z praxe' },
];
