import type { APIRoute } from 'astro';
import { SITE, IS_PRODUCTION } from '~/lib/site';

/**
 * Dynamický robots.txt:
 *   - produkce → otevřený index + odkaz na sitemap
 *   - stage / feature deploy → Disallow: / (žádná indexace)
 *
 * Důvod: nahled.redome.cz a feature subdomény by jinak konkurovaly
 * produkci v SERP nebo způsobily duplicit content warning.
 */
export const GET: APIRoute = ({ site }) => {
  const baseUrl = site?.toString().replace(/\/$/, '') ?? SITE.url;

  const body = IS_PRODUCTION
    ? [
        'User-agent: *',
        'Allow: /',
        'Disallow: /api/',
        '',
        `Sitemap: ${baseUrl}/sitemap.xml`,
        '',
      ].join('\n')
    : ['User-agent: *', 'Disallow: /', ''].join('\n');

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
