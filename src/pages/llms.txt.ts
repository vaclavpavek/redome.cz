import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { SITE } from '~/lib/site';

/**
 * llms.txt – krátký rejstřík stránek pro LLM klienty podle https://llmstxt.org/
 * Sloučí:
 *   - statické routes (přehledové stránky, které nejsou v pages collection)
 *   - pages collection (Co je Reiki, O nás, GDPR)
 *   - services collection (Reiki, Dornova metoda, Breussova masáž)
 */

type Entry = { slug: string; title: string; summary: string; section: 'main' | 'optional' };

const STATIC_ENTRIES: Entry[] = [
  {
    slug: 'sluzby',
    title: 'Služby',
    summary:
      'Přehled terapeutických služeb – Reiki, Dornova metoda, Breussova masáž – v Litomyšli.',
    section: 'main',
  },
  {
    slug: 'reiki-mistri',
    title: 'Reiki mistři',
    summary:
      'Karel Háněl – Reiki Mistr/učitel (IV. stupeň), terapeut Dornovy metody a Breussovy masáže.',
    section: 'main',
  },
  {
    slug: 'pribehy-z-praxe',
    title: 'Příběhy z praxe',
    summary: 'Skutečné zkušenosti klientů s Reiki, Dornovou metodou a Breussovou masáží.',
    section: 'main',
  },
  {
    slug: 'kontakty',
    title: 'Kontakty',
    summary: 'Karel Háněl a Monika Bišická – telefon, e-mail, adresa Peciny 196, Litomyšl 570 01.',
    section: 'main',
  },
];

export const GET: APIRoute = async () => {
  const pages = (await getCollection('pages')).sort((a, b) => a.data.order - b.data.order);
  const services = (await getCollection('services')).sort((a, b) => a.data.order - b.data.order);

  const collectionEntries: Entry[] = pages.map((p) => ({
    slug: p.id,
    title: p.data.title,
    summary: p.data.description,
    section: p.data.section,
  }));

  const all = [...STATIC_ENTRIES, ...collectionEntries];
  const mainPages = all
    .filter((p) => p.section === 'main')
    .sort((a, b) => a.title.localeCompare(b.title, 'cs'));
  const optionalPages = all.filter((p) => p.section === 'optional');

  const formatPage = (e: Entry) => `- [${e.title}](${SITE.url}/${e.slug}.md): ${e.summary}`;
  const formatService = (s: { id: string; data: { title: string; summary: string } }) =>
    `- [${s.data.title}](${SITE.url}/${s.id}.md): ${s.data.summary}`;

  const sections: string[] = [
    `# ${SITE.name}`,
    '',
    `> ${SITE.description}`,
    '',
    '## Stránky',
    '',
    ...mainPages.map(formatPage),
    '',
    '## Služby',
    '',
    ...services.map(formatService),
  ];

  if (optionalPages.length > 0) {
    sections.push('', '## Optional', '', ...optionalPages.map(formatPage));
  }

  return new Response(sections.join('\n') + '\n', {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
