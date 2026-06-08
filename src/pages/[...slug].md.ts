import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection, type CollectionEntry } from 'astro:content';
import { SITE, CONTACT, CONTACT_SECONDARY } from '~/lib/site';

/**
 * Markdown varianta každé stránky.
 * `/co-je-reiki` → `/co-je-reiki.md`
 * `/sluzby` → `/sluzby.md` (přehled, body generovaný z services collection)
 *
 * `.htaccess` na produkci umí podle hlavičky `Accept: text/markdown`
 * automaticky podsouvat tuto verzi místo HTML.
 */

interface MDProps {
  title: string;
  description: string;
  body: string;
  canonical: string;
}

export const getStaticPaths: GetStaticPaths = async () => {
  const pages = await getCollection('pages');
  const services = await getCollection('services');
  const masters = await getCollection('masters');
  const stories = await getCollection('stories');

  // 1) Pages collection (Co je Reiki, O nás, Ochrana osobních údajů)
  const pagePaths = pages.map((page) => ({
    params: { slug: page.id },
    props: {
      title: page.data.title,
      description: page.data.description,
      body: page.body ?? '',
      canonical: `${SITE.url}/${page.id}`,
    } satisfies MDProps,
  }));

  // 2) Services collection (Reiki, Dornova metoda, Breussova masáž)
  const servicePaths = services.map((service: CollectionEntry<'services'>) => ({
    params: { slug: service.id },
    props: {
      title: service.data.title,
      description: service.data.summary,
      body: service.body ?? '',
      canonical: `${SITE.url}/${service.id}`,
    } satisfies MDProps,
  }));

  // 3) Statické routes (přehledové stránky) – body generovaný z dat
  const sortedServices = [...services].sort((a, b) => a.data.order - b.data.order);
  const sortedMasters = [...masters].sort((a, b) => a.data.order - b.data.order);
  const sortedStories = [...stories].sort((a, b) => a.data.order - b.data.order);

  const sluzbyBody = [
    'Nabízíme tři vzájemně se doplňující metody. Vyberte si, co vás oslovuje – nebo se ozvěte a vyladíme to společně.',
    '',
    ...sortedServices.flatMap((s) => [
      `## [${s.data.title}](${SITE.url}/${s.id})`,
      '',
      s.data.summary,
      ...(s.data.duration ? ['', `*Délka sezení:* ${s.data.duration}`] : []),
      '',
    ]),
  ].join('\n');

  const mistriBody = sortedMasters
    .flatMap((m) => [`## ${m.data.name}`, '', `*${m.data.role}*`, '', m.body ?? '', ''])
    .join('\n');

  const pribehyBody = [
    'Skutečné zkušenosti klientů s Reiki, Dornovou metodou a Breussovou masáží.',
    '',
    ...sortedStories.flatMap((s) => [m_story_attribution(s), '', s.body ?? '', '', '---', '']),
  ].join('\n');

  const kontaktyBody = [
    `## ${CONTACT.person}`,
    '',
    `**Adresa:** ${CONTACT.address.street}, ${CONTACT.address.city} ${CONTACT.address.zip}`,
    `**Telefon:** [${CONTACT.phone}](${CONTACT.phoneHref})`,
    `**E-mail:** [${CONTACT.email}](${CONTACT.emailHref})`,
    '',
    `## ${CONTACT_SECONDARY.person}`,
    '',
    `**Telefon:** [${CONTACT_SECONDARY.phone}](${CONTACT_SECONDARY.phoneHref})`,
    `**E-mail:** [${CONTACT_SECONDARY.email}](${CONTACT_SECONDARY.emailHref})`,
  ].join('\n');

  const staticPaths: { params: { slug: string }; props: MDProps }[] = [
    {
      params: { slug: 'sluzby' },
      props: {
        title: 'Terapeutické služby',
        description: 'Reiki, Dornova metoda a Breussova masáž – individuální sezení v Litomyšli.',
        body: sluzbyBody,
        canonical: `${SITE.url}/sluzby`,
      },
    },
    {
      params: { slug: 'reiki-mistri' },
      props: {
        title: 'Reiki mistři',
        description:
          'Karel Háněl – Reiki Mistr/učitel (IV. stupeň). Praxe Reiki, Dornovy metody a Breussovy masáže v Litomyšli.',
        body: mistriBody,
        canonical: `${SITE.url}/reiki-mistri`,
      },
    },
    {
      params: { slug: 'pribehy-z-praxe' },
      props: {
        title: 'Příběhy z praxe',
        description: 'Skutečné zkušenosti klientů s Reiki, Dornovou metodou a Breussovou masáží.',
        body: pribehyBody,
        canonical: `${SITE.url}/pribehy-z-praxe`,
      },
    },
    {
      params: { slug: 'kontakty' },
      props: {
        title: 'Kontakty',
        description:
          'Karel Háněl a Monika Bišická – telefon, e-mail, adresa Peciny 196, Litomyšl 570 01.',
        body: kontaktyBody,
        canonical: `${SITE.url}/kontakty`,
      },
    },
  ];

  return [...pagePaths, ...servicePaths, ...staticPaths];
};

/** Pomocná funkce pro story attribution řádek (autor + lokace). */
function m_story_attribution(s: CollectionEntry<'stories'>): string {
  const where = s.data.location ? `, ${s.data.location}` : '';
  return `### ${s.data.author}${where}`;
}

export const GET: APIRoute<MDProps> = ({ props }) => {
  const { title, description, body, canonical } = props;

  const out = [
    `# ${title}`,
    '',
    `> ${description}`,
    '',
    `*Zdroj: ${canonical}*`,
    '',
    '---',
    '',
    body,
  ].join('\n');

  return new Response(out, {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
};
