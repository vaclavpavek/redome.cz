/// <reference path="../.astro/types.d.ts" />

declare namespace App {
  /**
   * Per-page registry strukturovaných dat. Schema komponenty
   * (LocalBusiness, WebSite, Service, Person, FAQPage, Breadcrumbs)
   * sem registrují svoje JSON-LD objekty; BaseLayout je na konci
   * <head> spojí do jednoho `<script type="application/ld+json">`
   * s `@graph` – propojení `@id` referencí napříč entitami.
   */
  interface Locals {
    schemas?: Record<string, unknown>[];
  }
}

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
