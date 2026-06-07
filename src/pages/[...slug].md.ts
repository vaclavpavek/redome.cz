import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection, type CollectionEntry } from 'astro:content';
import { SITE } from '~/lib/site';

/**
 * Markdown varianta každé stránky.
 * `/co-je-reiki` → `/co-je-reiki.md`
 * `/sluzby/reiki` → `/sluzby/reiki.md`
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

  const pagePaths = pages.map((page) => ({
    params: { slug: page.id },
    props: {
      title: page.data.title,
      description: page.data.description,
      body: page.body ?? '',
      canonical: `${SITE.url}/${page.id}`,
    } satisfies MDProps,
  }));

  const servicePaths = services.map((service: CollectionEntry<'services'>) => ({
    params: { slug: `sluzby/${service.id}` },
    props: {
      title: service.data.title,
      description: service.data.summary,
      body: service.body ?? '',
      canonical: `${SITE.url}/sluzby/${service.id}`,
    } satisfies MDProps,
  }));

  return [...pagePaths, ...servicePaths];
};

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
