import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { SITE } from '~/lib/site';

/**
 * llms-full.txt – kompletní obsah všech stránek a služeb v jednom Markdown
 * souboru. Pro LLM nástroje, které chtějí ingestovat celý web najednou.
 */
export const GET: APIRoute = async () => {
  const pages = (await getCollection('pages')).sort(
    (a, b) => a.data.order - b.data.order
  );
  const services = (await getCollection('services')).sort(
    (a, b) => a.data.order - b.data.order
  );

  const out: string[] = [
    `# ${SITE.name}`,
    '',
    `> ${SITE.description}`,
    '',
    '---',
    '',
  ];

  for (const page of pages) {
    out.push(`## ${page.data.title}`, '', page.body ?? '', '', '---', '');
  }

  for (const service of services) {
    out.push(
      `## Služba: ${service.data.title}`,
      '',
      `_${service.data.summary}_`,
      '',
      service.body ?? '',
      '',
      '---',
      ''
    );
  }

  return new Response(out.join('\n') + '\n', {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
