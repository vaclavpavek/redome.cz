// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';
import { unlink } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

/**
 * Astro publicDir zkopíruje VŠECHNO z `public/` do `dist/`, včetně
 * souborů ignorovaných gitem. `config.local.php` obsahuje hCaptcha
 * secret a NESMÍ skončit v deploy streamu (atomic FTPS swap by ho
 * nahrál na hosting). Hook ho po dokončeném buildu z `dist/api/`
 * smaže. `noop`, pokud soubor neexistuje – tj. v CI nebo když lokálně
 * nemáš lokální override.
 */
const stripLocalPhpConfig = {
  name: 'strip-local-php-config',
  hooks: {
    'astro:build:done': async (/** @type {{ dir: URL }} */ { dir }) => {
      const target = fileURLToPath(new URL('api/config.local.php', dir));
      try {
        await unlink(target);
        console.log('  ▶ smazán dist/api/config.local.php (lokální override)');
      } catch (/** @type {any} */ err) {
        if (err?.code !== 'ENOENT') throw err;
      }
    },
  },
};

// Doména pro absolutní URL (sitemap, robots, canonical, OG).
//   - SITE_URL=https://nahled.redome.cz  na stage (build z `main`)
//   - SITE_URL nevyplněno → produkční default https://www.redome.cz
// Nastavuje se přes env (docker-compose, GitHub Actions, …),
// žádný .env soubor v repu není potřeba.
const SITE_URL = (process.env.SITE_URL ?? 'https://www.redome.cz').replace(/\/$/, '');

// https://astro.build/config
// Sitemap si generujeme sami v src/pages/sitemap.xml.ts – chceme jediný
// soubor sitemap.xml (ne sitemap-index.xml + sitemap-0.xml).
export default defineConfig({
  site: SITE_URL,
  trailingSlash: 'never',
  output: 'static',
  integrations: [mdx(), stripLocalPhpConfig],
  server: {
    host: '0.0.0.0',
    port: 4321,
  },
  vite: {
    // Vite types u Tailwindu 4 a Astro se trochu rozcházejí (interní rozhraní)
    // – plugin je funkčně kompatibilní, jen TS check potřebuje cast.
    plugins: [/** @type {any} */ (tailwindcss())],
    server: {
      // Polling je potřeba, protože pracujeme přes bind mount v Dockeru
      watch: { usePolling: true, interval: 300 },
      hmr: { clientPort: 4321 },
      // Pro dev povolíme všechny hosty – jsme uvnitř Dockeru s portem
      // exposovaným jen na hostiteli. Skutečné API by mělo přísnější check.
      // Pokrývá: localhost (host), host.docker.internal (browser kontejner),
      // case 127.0.0.1, IPv6 ::1, web (interní docker síť), …
      allowedHosts: true,
      // /api/* požadavky pošleme do PHP kontejneru
      // (v produkci je obsluhuje Apache přímo)
      proxy: {
        '/api': {
          target: 'http://php:8080',
          changeOrigin: true,
        },
      },
    },
  },
});
