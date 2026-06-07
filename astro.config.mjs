// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://redome.cz',
  trailingSlash: 'never',
  output: 'static',
  integrations: [
    sitemap({
      i18n: {
        defaultLocale: 'cs',
        locales: { cs: 'cs-CZ' },
      },
    }),
    mdx(),
  ],
  server: {
    host: '0.0.0.0',
    port: 4321,
  },
  vite: {
    plugins: [tailwindcss()],
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
