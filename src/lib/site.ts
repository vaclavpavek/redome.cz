/**
 * Centrální konfigurace webu – URL, kontakty, navigace, sociální sítě.
 * Mění se tady, ne ve více komponentách najednou.
 */

export const SITE = {
  url: 'https://www.redome.cz',
  name: 'Redome.cz',
  shortName: 'Redome',
  tagline: 'Reiki a terapeutické služby',
  description:
    'Reiki, Dornova metoda a Breussova masáž. Kanit Hauel – mistr Reiki. Najděte rovnováhu těla i mysli.',
  locale: 'cs_CZ',
  lang: 'cs',
} as const;

export const CONTACT = {
  person: 'Kanit Hauel',
  phone: '+420 775 504 175',
  phoneHref: 'tel:+420775504175',
  email: 'redome@redome.cz',
  emailHref: 'mailto:redome@redome.cz',
  ico: '04210280',
} as const;

export const SOCIAL = {
  // Doplň skutečné URL nebo nech prázdné – komponenty si je odfiltrují
  facebook: '',
  instagram: '',
} as const;

export type NavItem = { href: string; label: string };

export const MAIN_NAV: NavItem[] = [
  { href: '/o-nas', label: 'O nás' },
  { href: '/sluzby', label: 'Služby' },
  { href: '/dornova-metoda', label: 'Dornova metoda' },
  { href: '/breussova-masaz', label: 'Breussova masáž' },
  { href: '/pribehy-z-praxe', label: 'Příběhy z praxe' },
  { href: '/kontakt', label: 'Kontakt' },
];

export const FOOTER_NAV: NavItem[] = [
  { href: '/o-nas', label: 'O nás' },
  { href: '/sluzby', label: 'Služby' },
  { href: '/dornova-metoda', label: 'Dornova metoda' },
  { href: '/breussova-masaz', label: 'Breussova masáž' },
  { href: '/pribehy-z-praxe', label: 'Příběhy z praxe' },
];
