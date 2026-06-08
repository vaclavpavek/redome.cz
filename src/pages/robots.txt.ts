import type { APIRoute } from 'astro';
import { SITE } from '~/lib/site';

/**
 * Dynamický robots.txt – odkaz na sitemap vychází ze SITE.url,
 * aby se nemusela URL udržovat na dvou místech.
 */
export const GET: APIRoute = ({ site }) => {
  const baseUrl = site?.toString().replace(/\/$/, '') ?? SITE.url;

  const body = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /api/',
    '',
    `Sitemap: ${baseUrl}/sitemap.xml`,
    '',
  ].join('\n');

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
