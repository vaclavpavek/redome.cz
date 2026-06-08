// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
// Sitemap si generujeme sami v src/pages/sitemap.xml.ts – chceme jediný
// soubor sitemap.xml (ne sitemap-index.xml + sitemap-0.xml).
export default defineConfig({
  site: 'https://www.redome.cz',
  trailingSlash: 'never',
  output: 'static',
  integrations: [mdx()],
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
      // Povolíme host.docker.internal kvůli `make screenshot`
      // (browser kontejner sahá na dev server přes tento alias)
      allowedHosts: ['host.docker.internal', 'localhost'],
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
