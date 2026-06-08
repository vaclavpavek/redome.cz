/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
  /**
   * Absolutní URL webu pro daný build (canonical, OG, sitemap, robots).
   * - produkce: https://www.redome.cz (default v lib/site.ts)
   * - stage:    https://nahled.redome.cz (nastavovat v CI / docker-compose)
   */
  readonly SITE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
