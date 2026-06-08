# Instrukce pro AI agenty

Tento dokument popisuje, jak v tomto repozitáři pracovat. Píšu ho tak, aby
mu rozuměl i zákazník bez technického zázemí.

---

## Co je tohle za projekt

Statický web **Redome.cz** (Reiki a terapeutické služby, Karel Háněl).
Postavený na [Astro 5](https://astro.build/) + Tailwind, výstup je čisté HTML
a nasazuje se přes SFTP na Apache hosting.

---

## Pravidla pro vývoj

### Veškerá interakce přes Makefile

Nikdy nevolej `npm run …` přímo. Vždy přes `make <cíl>`.
`make` bez argumentu zobrazí seznam příkazů.

V devcontaineru i mimo něj funguje stejně – Makefile sám pozná, kde běží.

### Nic se nikam neinstaluje ručně

Vše běží v Dockeru. Nový package se přidává příkazem
`docker compose run --rm web npm install <balíček>` (nebo z devcontaineru
přímo `npm install …`).

### Commit zprávy

Dodržujeme [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).
Zprávy píšeme **česky** – je to dokumentace pro zákazníka.

Příklady:

- `feat: kontaktní formulář na HP`
- `fix: oprava zalomení v patičce na mobilu`
- `chore: aktualizace závislostí`
- `docs: doplnění návodu pro Codespaces`

### Větve a nasazení

- `main` → stage (automaticky)
- `production` ← merge z `main` přes PR → produkce (automaticky)

Detail: [`docs/git-flow.md`](./docs/git-flow.md).

---

## Architektura webu

| Adresář                     | K čemu slouží                                                |
| --------------------------- | ------------------------------------------------------------ |
| `src/pages/`                | Stránky webu (URL = cesta v adresáři)                        |
| `src/pages/[...slug].md.ts` | Endpoint generující Markdown varianty stránek                |
| `src/pages/llms.txt.ts`     | Endpoint generující `llms.txt`                               |
| `src/components/ui/`        | Znovupoužitelné UI komponenty (Button, TextField, Icon…)     |
| `src/components/layout/`    | Hlavička, patička, navigace, skip-link                       |
| `src/components/sections/`  | Velké sekce HP (Hero, Services, Stories…)                    |
| `src/components/seo/`       | Meta tagy, Open Graph, Twitter Cards                         |
| `src/components/schema/`    | Schema.org JSON-LD (LocalBusiness, Service, Person, FAQPage) |
| `src/content/`              | Obsah stránek v Markdown / MDX (přes content collections)    |
| `src/styles/tokens.css`     | Design tokeny – barvy, typografie, spacing (zdroj pravdy)    |
| `src/styles/global.css`     | Globální styly nad tokeny                                    |
| `public/.htaccess`          | Apache pravidla, content negotiation pro MD varianty         |
| `public/fonts/`             | Self-hosted fonty (Playfair Display, Inter)                  |

---

## Co se generuje při buildu

`make build` vyplivne do `dist/`:

1. **HTML** všech stránek
2. **`sitemap.xml`** (vlastní endpoint, jediný soubor – ne index)
3. **`llms.txt`** a **`llms-full.txt`** podle [llmstxt.org](https://llmstxt.org/)
4. **Markdown varianta každé stránky** (`/co-je-reiki` → `/co-je-reiki.md`)
5. **`.htaccess`** s pravidly pro content negotiation a bezpečnostní hlavičky
6. **Optimalizované obrázky** (přes `astro:assets`)

---

## SEO a strukturovaná data

Každá stránka musí mít:

- `<title>` a `<meta name="description">`
- canonical URL
- Open Graph + Twitter Card meta
- `<link rel="alternate" type="text/markdown">` na MD variantu
- Schema.org JSON-LD relevantní danému obsahu

Globální schema.org: `LocalBusiness` (HealthAndBeautyBusiness), `WebSite`.
Stránkové schema.org: `Service`, `Person`, `FAQPage`, `BreadcrumbList`
dle obsahu.

---

## Přístupnost (WCAG 2.2 AA)

- Sémantické HTML5 (`<main>`, `<nav>`, `<header>`, `<footer>`, `<article>`)
- Jeden `<h1>` na stránku
- Skip link jako první focusable
- Viditelný `:focus-visible` styl
- `lang="cs"` na `<html>`
- Funkční ikony mají `aria-label`, dekorativní `aria-hidden="true"`
- Burger menu má `aria-expanded` + `aria-controls`, drží focus
- `prefers-reduced-motion` vypíná animace
- Formulářové prvky mají vždy `<label>`

---

## Source materiály

Designy a styleguide jsou ve Figmě:

- [Components](https://www.figma.com/design/vLP9sOV8vLyWU3nXdBX7J2/redome.cz?node-id=53-206&m=dev)
- [Styleguide](https://www.figma.com/design/vLP9sOV8vLyWU3nXdBX7J2/redome.cz?node-id=0-1&m=dev)
- [Design](https://www.figma.com/design/vLP9sOV8vLyWU3nXdBX7J2/redome.cz?node-id=2-1213&m=dev)
