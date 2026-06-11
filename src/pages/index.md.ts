import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { SITE, CONTACT } from '~/lib/site';

/**
 * Markdown varianta homepage (`dist/index.md`).
 *
 * `.htaccess` rewriteuje `/` při `Accept: text/markdown` sem.
 * Obsah je krátký souhrn: tagline, představení, seznam služeb s odkazy,
 * kontakt. LLM klienti dostanou stručnou orientaci po webu.
 */

export const GET: APIRoute = async () => {
  const services = (await getCollection('services')).sort((a, b) => a.data.order - b.data.order);

  const out = [
    `# ${SITE.name}`,
    '',
    `> ${SITE.tagline}`,
    '',
    `*Zdroj: ${SITE.url}*`,
    '',
    '---',
    '',
    SITE.description,
    '',
    '## Služby',
    '',
    ...services.flatMap((s) => [`- [${s.data.title}](${SITE.url}/${s.id}) – ${s.data.summary}`]),
    '',
    '## Další stránky',
    '',
    `- [Co je Reiki](${SITE.url}/co-je-reiki)`,
    `- [Reiki mistři](${SITE.url}/reiki-mistri)`,
    `- [Příběhy z praxe](${SITE.url}/pribehy-z-praxe)`,
    `- [Kontakty](${SITE.url}/kontakty)`,
    '',
    '## Kontakt',
    '',
    `**${CONTACT.person}**`,
    `${CONTACT.address.street}, ${CONTACT.address.city} ${CONTACT.address.zip}`,
    `Telefon: [${CONTACT.phone}](${CONTACT.phoneHref})`,
    `E-mail: [${CONTACT.email}](${CONTACT.emailHref})`,
    '',
  ].join('\n');

  return new Response(out, {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
};
