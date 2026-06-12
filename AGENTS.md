# Instrukce pro AI agenty

Tento dokument popisuje, jak v tomto repozitáři pracovat. Píšu ho tak, aby
mu rozuměl i zákazník bez technického zázemí.

---

## Co je tohle za projekt

Statický web **Redome.cz** (Reiki a terapeutické služby, Karel Háněl).
Postavený na [Astro 5](https://astro.build/) + Tailwind, výstup je čisté HTML
a nasazuje se přes FTPS na Apache hosting (Wedos).

---

## Pravidla pro vývoj

### Veškerá interakce přes Makefile

Nikdy nevolej `npm run …` přímo. Vždy přes `make <cíl>`.
`make` bez argumentu zobrazí seznam příkazů.

V devcontaineru i mimo něj funguje stejně – Makefile sám pozná, kde běží.

Nejčastější cíle:

| Cíl                      | Účel                                                           |
| ------------------------ | -------------------------------------------------------------- |
| `make dev`               | Vývojový server na http://localhost:4321 + HMR                 |
| `make build`             | Produkční build do `dist/`                                     |
| `make lint`              | Prettier + ESLint + `astro check` (CI brána)                   |
| `make format`            | Auto-formátování (Prettier)                                    |
| `make mail`              | Mailpit UI na http://localhost:8025 (zachycuje e-maily)        |
| `make screenshot URL=/x` | Vizuální preview přes headless Chromium                        |
| `make generate-og`       | Přerenderuje `public/og-default.jpg` z `tools/og-default.html` |

### Nic se nikam neinstaluje ručně

Vše běží v Dockeru. Nový package se přidává příkazem
`docker compose run --rm web npm install <balíček>` (nebo z devcontaineru
přímo `npm install …`).

### Citlivá data (secrets)

Soubory typu `.env*` (kromě `.env.example`) jsou **zakázané ke čtení** –
PreToolUse hook v `.claude/settings.local.json` blokuje jakýkoli pokus
o jejich otevření. Pokud potřebuješ konkrétní hodnotu (SFTP, API klíč),
**požádej zákazníka** – pošle ji přímo do chatu.

[`.env.example`](./.env.example) je šablona pro GitHub Secrets – jen
deploy proměnné (FTPS hostname, user, heslo, path). Lokální vývoj
`.env` nepotřebuje; AI nástroje (Claude Code, Copilot CLI) drží auth
v Docker named volumes (`claude-config-redomecz`, `copilot-config-redomecz`).

**Runtime konfigurace PHP backendu** (kontaktní formulář, hCaptcha) jde
jednotně přes PHP config soubory – ne přes `.env` / `getenv()`. Wedos
hosting přes env neumí, proto stejný mechanismus pro lokál i produkci:

- [`public/api/config.php`](./public/api/config.php) – **public defaults**
  v gitu (hCaptcha site key, příjemce mailu). Sem nikdy nedávej secret.
- [`public/api/config.local.php`](./public/api/config.local.php.example) –
  **lokální override**, gitignored. Vytvoříš zkopírováním souboru
  `config.local.php.example` a doplněním skutečného hCaptcha secret.
  Po `make build` ho integrace `strip-local-php-config` v
  [`astro.config.mjs`](./astro.config.mjs) smaže z `dist/api/`, takže
  secret nikdy neproletí přes deploy stream.
- **Wedos produkce**: po prvním deployi nahraj ručně přes FTP soubor
  `config.local.php` do `subdom/<branch>/api/`. Při dalších deployech
  ho [`cli/deploy.sh`](./cli/deploy.sh) (krok 1b) sám přenese
  z live verze do nové `<branch>-next/api/`, takže atomic swap o něj
  nepřijde. Source bere:

  | Cílová větev | Source `config.local.php` |
  | ------------ | ------------------------- |
  | `www`        | vlastní live (`www/api/`) |
  | `nahled` i ostatní feature větve | `nahled/api/` (sdílený stage secret) |

  Alternativa pro speciální případy: stejná array struktura jde nahrát
  i jako `redome-config.php` do dokumentového kořene hostingu (mimo
  `subdom/`), `contact.php` ho najde přes
  `$_SERVER['DOCUMENT_ROOT'] . '/redome-config.php'` a deep-merge ho
  poslední do configu (tj. přebije i `config.local.php`).

Pokud secret chybí v obou cestách, `contact.php` vrátí HTTP 500
(fail-closed – raději odmítnout než pustit spam).

Struktura PHP array je připravená na budoucí přechod na Nette NEON
(až dorazí `nette/forms` pro samotný formulář) – stačí přejmenovat
soubor a `require` přepsat na `Neon::decodeFile()`.

### Devcontainer

Repo je připraveno pro DevContainery (VS Code, JetBrains, Codespaces).
`.devcontainer/devcontainer.json` skládá prostředí z oficiálních
devcontainer features:

- `git` – Git
- `docker-outside-of-docker` – `docker` CLI uvnitř kontejneru míří na
  hostitelský daemon (potřeba pro `make screenshot` / Compose)
- `github-cli` – `gh` CLI (auth, PR, Issues)
- `copilot-cli` – GitHub Copilot CLI (`copilot`)
- `anthropics/claude-code` – Claude Code CLI (`claude`)

Na úrovni Dockerfile se navíc instalují drobné QoL utility pro terminál:
`nano`, `mc`, `tree`.

VS Code extensions (ignoruje JetBrains): GitHub Copilot, Copilot Chat,
Claude Code. V JetBrains si pluginy nainstaluj ručně přes Marketplace.

**Persistence přihlášení.** `claude` i `copilot` se v interaktivním
režimu přihlašují přes browser OAuth a token si ukládají do `~/.claude`
resp. `~/.copilot`. Aby auth přežil rebuild kontejneru (a šel sdílet
napříč git worktrees téhož repa), jsou v `devcontainer.json` named
volumes s fixními jmény:

```json
"mounts": [
  "source=claude-config-redome,target=/home/node/.claude,type=volume",
  "source=copilot-config-redome,target=/home/node/.copilot,type=volume"
]
```

Fixní jména (bez `${devcontainerId}`) umožňují, aby všechny worktrees
i druhé clony redome.cz sdílely stejný login. Volumes drží jen Docker,
nejdou do gitu.

Smazat volumes (vynutit re-auth) lze ručně: `docker volume rm
claude-config-redome copilot-config-redome`.

V Codespaces se volume chová stejně jako lokálně – přežije stop/start
codespacu, ale smaže se při Rebuild Container nebo Delete codespace.

### Commit zprávy

Dodržujeme [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).
Zprávy píšeme **česky** – je to dokumentace pro zákazníka.

Příklady:

- `feat: kontaktní formulář na HP`
- `fix: oprava zalomení v patičce na mobilu`
- `chore: aktualizace závislostí`
- `docs: doplnění návodu pro Codespaces`

### Větve a nasazení

Jméno větve odpovídá subdoméně, kam se nasazuje:

- `nahled` → stage (`https://nahled.redome.cz`) – automaticky
- `www` ← merge z `nahled` přes PR → produkce (`https://www.redome.cz`) – automaticky

Nasazení obstará workflow [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml),
který volá [`cli/deploy.sh`](./cli/deploy.sh) – zero-downtime FTPS swap:

1. upload `dist/` → `<FTP_PATH>/<branch>-next` (vedle živé verze)
2. `<branch>` → `<branch>-prev` (záloha)
3. `<branch>-next` → `<branch>` (nový live)
4. smazání `<branch>-prev`

Při chybě uprostřed swapu (krok 3) script automaticky vrátí
`<branch>-prev` zpět na `<branch>`. Lokálně se stejný script
volá přes `make deploy` (potřebuje vyplněný `.env`).

Detail: [`docs/git-flow.md`](./docs/git-flow.md).

### Doména pro build (SITE_URL)

Absolutní URL pro `sitemap.xml`, `robots.txt`, canonical, OG a JSON-LD
se generuje z env proměnné `SITE_URL`:

| Větev / prostředí | `SITE_URL`                 | Výsledek v sitemap                |
| ----------------- | -------------------------- | --------------------------------- |
| `nahled` (stage)  | `https://nahled.redome.cz` | `<loc>https://nahled.redome.cz/…` |
| `www` (produkce)  | _nenastavovat_ (výchozí)   | `<loc>https://www.redome.cz/…`    |
| lokální debug     | `http://localhost:4321`    | `<loc>http://localhost:4321/…`    |

CI v GitHub Actions nastavuje `SITE_URL` před `make build`. Lokálně:

```bash
SITE_URL=https://nahled.redome.cz make build
```

### CTA konvence

Web používá jediný text výzvy k akci: **„Objednat terapii"**.

| Místo                  | Odkaz       | Důvod                              |
| ---------------------- | ----------- | ---------------------------------- |
| Hlavička (sticky)      | `/kontakty` | Z jakékoli stránky na kontakty     |
| Hero / sidebar / sekce | `#formular` | Scroll k formuláři na téže stránce |

Žádné jiné varianty („Rezervovat termín", „Domluvit setkání" apod.).

---

## Architektura webu

| Adresář                                | K čemu slouží                                                        |
| -------------------------------------- | -------------------------------------------------------------------- |
| `src/pages/`                           | Stránky webu (URL = cesta v adresáři)                                |
| `src/pages/[...slug].md.ts`            | Endpoint generující Markdown varianty stránek (vč. static routes)    |
| `src/pages/sitemap.xml.ts`             | Vlastní sitemap (jediný soubor, ne index)                            |
| `src/pages/robots.txt.ts`              | Robots.txt s odkazem na sitemap (`SITE_URL`-aware)                   |
| `src/pages/llms.txt.ts`                | Endpoint generující `llms.txt` (seznam stránek pro LLM)              |
| `src/pages/llms-full.txt.ts`           | Endpoint s plným obsahem všech stránek (LLM ingest)                  |
| `src/pages/odeslano.astro`             | Potvrzovací stránka po odeslání kontaktního formuláře (noindex)      |
| `src/lib/schema.ts`                    | Helper `addSchema(locals, data)` – registry pro JSON-LD `@graph`     |
| `tools/og-default.html`                | Šablona pro `public/og-default.jpg` (render přes `make generate-og`) |
| `src/components/ui/`                   | Znovupoužitelné UI komponenty (Button, TextField, Icon…)             |
| `src/components/layout/`               | Hlavička, patička, navigace, skip-link, drobečky                     |
| `src/components/sections/`             | Velké sekce HP (Hero, Services, Stories…)                            |
| `src/components/seo/`                  | Meta tagy, Open Graph, Twitter Cards                                 |
| `src/components/schema/`               | Schema.org – komponenty registrují data přes `addSchema`             |
| `src/components/seo/JsonLdGraph.astro` | Sloučí všechna registrovaná schemata do jednoho `@graph`             |
| `src/content/`                         | Obsah stránek v Markdown / MDX (přes content collections)            |
| `src/assets/images/`                   | Obrázky pro `astro:assets` (hash, WebP, srcset)                      |
| `src/lib/site.ts`                      | Centrální konfigurace (URL, kontakty, navigace, credits)             |
| `src/styles/tokens.css`                | Design tokeny – barvy, typografie, spacing (zdroj pravdy)            |
| `src/styles/global.css`                | Globální styly nad tokeny + Tailwind import                          |
| `public/.htaccess`                     | Apache pravidla (redirect, content negotiation, cache, CSP)          |
| `public/fonts/`                        | Self-hosted fonty (Playfair Display, Inter, woff2)                   |
| `public/favicon.svg`                   | Favicon (fixní URL pro browsery)                                     |
| `public/api/contact.php`               | Backend handler pro kontaktní formulář (PHP + msmtp)                 |
| `public/og-default.jpg`                | Výchozí Open Graph náhled (1200×630, JPG – FB/X nečtou SVG)          |

---

## Obrázky

| Kam                  | Co                                                         | Optimalizace                           |
| -------------------- | ---------------------------------------------------------- | -------------------------------------- |
| `src/assets/images/` | Content obrázky (hero, fotky, dekorace, logo, footer mark) | ✅ hash, WebP, `srcset`, cache busting |
| `public/`            | Fixní URL (favicon, OG image, manifest)                    | ❌ 1:1 kopie, žádný hash               |

Pro `<img>` v Astro komponentě:

```astro
---
import { Image } from 'astro:assets';
import hero from '~/assets/images/hero.jpg';
---

<Image src={hero} alt="…" widths={[800, 1200]} sizes="100vw" format="webp" />
```

Pro CSS `background-image` (Vite v scoped `<style>` neumí `url()` přes
astro:assets):

```astro
---
import decor from '~/assets/images/decor.png';
---

<section style={`--decor-url: url('${decor.src}')`}>…</section>
<style define:vars={{ decorUrl: `url('${decor.src}')` }}>
  .x::before {
    background: var(--decorUrl) …;
  }
</style>
```

---

## Vývojové služby (docker-compose)

| Služba    | Port | Účel                                                      |
| --------- | ---- | --------------------------------------------------------- |
| `web`     | 4321 | Astro dev server (HMR)                                    |
| `mailpit` | 8025 | UI pro zachycené e-maily (`make mail`)                    |
| `php`     | -    | PHP-CLI server pro `contact.php` (interní, proxy z vite)  |
| `browser` | -    | Headless Chromium pro `make screenshot` (profile `tools`) |

Kontaktní formulář v dev: POST `/api/contact.php` → vite proxy → `php` →
`mail()` přes msmtp → `mailpit:1025` → vidět v UI na `:8025`.

V produkci stejný `contact.php` v `dist/api/` obslouží Apache + PHP přímo.

---

## Co se generuje při buildu

`make build` vyplivne do `dist/`:

1. **HTML** všech stránek (statické)
2. **`sitemap.xml`** (vlastní endpoint, jediný soubor s `SITE_URL`)
3. **`robots.txt`** (s odkazem na sitemap, `SITE_URL`-aware)
4. **`llms.txt`** a **`llms-full.txt`** podle [llmstxt.org](https://llmstxt.org/)
5. **Markdown varianta každé stránky** (`/co-je-reiki` → `/co-je-reiki.md`,
   včetně přehledových stránek jako `/sluzby.md`, `/reiki-mistri.md`)
6. **`.htaccess`** s redirect/content-negotiation/cache/security pravidly
7. **Optimalizované obrázky** v `dist/_astro/*.webp` (přes `astro:assets`)
8. **`api/contact.php`** (kopírováno 1:1 z `public/`)

---

## SEO a strukturovaná data

Každá stránka musí mít:

- `<title>` a `<meta name="description">`
- canonical URL (z `SITE_URL`)
- Open Graph + Twitter Card meta
- `<link rel="alternate" type="text/markdown">` na MD variantu
- Schema.org JSON-LD relevantní danému obsahu

Globální schema.org: `LocalBusiness` (HealthAndBeautyBusiness), `WebSite`.
Stránkové schema.org: `Service`, `Person`, `FAQPage`, `BreadcrumbList`
dle obsahu.

**Architektura JSON-LD:** Schema komponenty (`LocalBusiness`, `WebSite`,
`Service`, `Person`, `FAQPage`, `Breadcrumbs`) **nic nerenderují** – jen
registrují svoje JSON-LD objekty přes `addSchema(Astro.locals, …)`.
Na konci `<head>` v `BaseLayout` je `<JsonLdGraph />`, který vše spojí
do **jednoho** `<script type="application/ld+json">` s `@graph`.
Tím jsou všechny `@id` reference (`#business`, `#website`) v rámci
jednoho dokumentu a parsery (Rich Results) je propojí bezpečně.

Stránkové schemata se vkládají do `<Fragment slot="head">`:

```astro
<BaseLayout title={pageTitle}>
  <Fragment slot="head">
    <BreadcrumbsSchema items={breadcrumbs} />
    <Service name={svcTitle} description={svcSummary} slug={svcId} />
  </Fragment>
  <!-- … obsah stránky … -->
</BaseLayout>
```

---

## Bezpečnost (`.htaccess`)

- **HTTPS vynucené** přes 301 redirect (HSTS úmyslně **nevynucujeme** –
  u laiků dělá medvědí službu)
- **Naked → www**: `redome.cz` → `https://www.redome.cz`
- **Stage doména**: `nahled.redome.cz` (kanonická = `www.redome.cz`)
- **CSP**: `default-src 'self'`, povoleno `'unsafe-inline'` ve style-src
- **Permissions-Policy**: zakázáno geolocation, mic, camera, payment,
  USB, MIDI, accelerometer + anti-tracking (interest-cohort,
  browsing-topics, attribution-reporting)
- **X-Frame-Options: SAMEORIGIN**, **X-Content-Type-Options: nosniff**
- **Cache strategie** přes `mod_headers`:
  - `/_astro/*` (hashované) → 1 rok + immutable
  - HTML → 5 min + must-revalidate
  - obrázky/SVG mimo `_astro` → 120 dní
  - sitemap/llms/robots → 1 hodina
  - MD varianty → 1 hodina + `Vary: Accept`
- **Skryté soubory** (`.git`, `.env*`, zálohy `*~`, `*.bak`, `*.swp`,
  lock soubory) → `Require all denied`

---

## Přístupnost (WCAG 2.2 AA)

- Sémantické HTML5 (`<main>`, `<nav>`, `<header>`, `<footer>`, `<article>`)
- Jeden `<h1>` na stránku
- Skip link jako první focusable element
- Viditelný `:focus-visible` styl
- `lang="cs"` na `<html>`
- Funkční ikony mají `aria-label`, dekorativní `aria-hidden="true"`
- Burger menu má `aria-expanded` + `aria-controls`, drží focus (focus trap,
  Esc zavírá)
- `prefers-reduced-motion` vypíná animace
- Formulářové prvky mají vždy `<label>` + `aria-describedby` pro chyby
- Drobečková navigace v JSON-LD i HTML (`aria-current="page"`)

---

## Source materiály

Designy a styleguide jsou ve Figmě:

- [Components](https://www.figma.com/design/vLP9sOV8vLyWU3nXdBX7J2/redome.cz?node-id=53-206&m=dev)
- [Styleguide](https://www.figma.com/design/vLP9sOV8vLyWU3nXdBX7J2/redome.cz?node-id=0-1&m=dev)
- [HP design](https://www.figma.com/design/vLP9sOV8vLyWU3nXdBX7J2/redome.cz?node-id=159-775&m=dev)
- [Subpage design](https://www.figma.com/design/vLP9sOV8vLyWU3nXdBX7J2/redome.cz?node-id=4106-1986&m=dev)
  (univerzální layout: `co-je-reiki` ho používá doslova)
- [Subpage2 design](https://www.figma.com/design/vLP9sOV8vLyWU3nXdBX7J2/redome.cz?node-id=6015-1315&m=dev)
  (šablona pro detail služeb – hero + sidebar + ContactForm)
