/**
 * Helper pro registraci JSON-LD bloků. Schema komponenta volá:
 *
 *   addSchema(Astro.locals, { '@type': 'Service', ... });
 *
 * Astro vyhodnocuje slot expressions v kontextu volajícího, takže
 * komponenta zapsaná uvnitř `<Fragment slot="head">` může běžet dřív,
 * než parent layout stihne `Astro.locals.schemas` inicializovat –
 * lazy init zde to vyřeší.
 */
import type { APIContext } from 'astro';

export function addSchema(locals: APIContext['locals'], data: Record<string, unknown>): void {
  if (!locals.schemas) locals.schemas = [];
  locals.schemas.push(data);
}
