import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { SITE } from '~/lib/site';

/**
 * sitemap.xml – jediný soubor (žádný sitemap-index).
 * Enumeruje:
 *   - statické routes (HP, /sluzby, /reiki-mistri, /pribehy-z-praxe,
 *     /kontakt – ten je definován jako vlastní astro page)
 *   - dynamické pages z pages collection
 *   - detail služeb (flat URL na ploše, např. /reiki)
 */

const STATIC_ROUTES = ['/', '/sluzby', '/reiki-mistri', '/pribehy-z-praxe'];

export const GET: APIRoute = async ({ site }) => {
  const base = (site?.toString() ?? SITE.url).replace(/\/$/, '');

  const pages = await getCollection('pages');
  const services = await getCollection('services');

  const urls = [
    ...STATIC_ROUTES,
    ...pages.map((p) => `/${p.id}`),
    ...services.map((s) => `/${s.id}`),
  ];
  // Unique + stable ordering
  const unique = Array.from(new Set(urls)).sort();

  const lastmod = new Date().toISOString().slice(0, 10);

  const body =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    unique
      .map((u) => {
        const loc = `${base}${u === '/' ? '' : u}`;
        return `  <url><loc>${loc}</loc><lastmod>${lastmod}</lastmod></url>`;
      })
      .join('\n') +
    '\n</urlset>\n';

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
