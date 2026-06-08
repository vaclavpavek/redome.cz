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
