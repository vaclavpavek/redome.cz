// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://www.redome.cz',
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
    },
  },
});
