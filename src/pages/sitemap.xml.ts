import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { SITE } from '~/lib/site';

/**
 * sitemap.xml – jediný soubor (žádný sitemap-index).
 *
 * Enumeruje:
 *   - statické routes (HP, /sluzby, /reiki-mistri, /pribehy-z-praxe,
 *     /kontakty – ty jsou vlastní astro pages, ne v pages collection)
 *   - dynamické pages z pages collection (Co je Reiki, O nás, GDPR)
 *   - detail služeb (flat URL na ploše, např. /reiki)
 *
 * Formát odpovídá protokolu sitemaps.org 0.9 vč. xsi:schemaLocation
 * pro validátory typu Google Search Console.
 */

const STATIC_ROUTES = ['/', '/sluzby', '/reiki-mistri', '/pribehy-z-praxe', '/kontakty'];

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

  // W3C Datetime – validátory sitemap akceptují prostý YYYY-MM-DD
  // (ne ISO timestamp s milisekundami a Z, který některé checkery hlásí)
  const lastmod = new Date().toISOString().slice(0, 10);

  const body =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n' +
    '        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\n' +
    '        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">\n' +
    unique
      .map((u) => {
        const loc = `${base}${u === '/' ? '/' : u}`;
        return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`;
      })
      .join('\n') +
    '\n</urlset>\n';

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
