import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { SITE } from '~/lib/site';

/**
 * llms.txt – krátký rejstřík stránek pro LLM klienty podle https://llmstxt.org/
 * Skládá se ze stránek z `pages` collection, doplněný o detaily služeb.
 */
export const GET: APIRoute = async () => {
  const pages = (await getCollection('pages')).sort(
    (a, b) => a.data.order - b.data.order
  );
  const services = (await getCollection('services')).sort(
    (a, b) => a.data.order - b.data.order
  );

  const mainPages = pages.filter((p) => p.data.section === 'main');
  const optionalPages = pages.filter((p) => p.data.section === 'optional');

  const formatPage = (slug: string, title: string, summary: string) =>
    `- [${title}](${SITE.url}/${slug}.md): ${summary}`;

  const sections: string[] = [
    `# ${SITE.name}`,
    '',
    `> ${SITE.description}`,
    '',
    '## Stránky',
    '',
    ...mainPages.map((p) => formatPage(p.id, p.data.title, p.data.description)),
    '',
    '## Služby',
    '',
    ...services.map((s) =>
      formatPage(`sluzby/${s.id}`, s.data.title, s.data.summary)
    ),
  ];

  if (optionalPages.length > 0) {
    sections.push(
      '',
      '## Optional',
      '',
      ...optionalPages.map((p) =>
        formatPage(p.id, p.data.title, p.data.description)
      )
    );
  }

  return new Response(sections.join('\n') + '\n', {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
