# Redome.cz

Web pro Reiki a terapeutické služby (Kanit Hauel).
Postavený na [Astro](https://astro.build/) – generuje statické HTML, takže je rychlý a levný na hosting.

---

## Jak s projektem pracovat

Nepotřebuješ na svém počítači instalovat Node.js ani nic jiného.
Stačí **Docker Desktop** – nebo úplně bez instalace přes **GitHub Codespaces**.

### Rychlý start

```bash
make          # zobrazí seznam všech příkazů
make install  # nainstaluje závislosti (poprvé)
make dev      # spustí web na http://localhost:4321 s živým náhledem
```

Otevři v prohlížeči `http://localhost:4321` – jakákoli změna v souborech se v prohlížeči
sama obnoví.

### GitHub Codespaces

V repu na GitHubu klikni na **Code → Codespaces → Create codespace**.
Prostředí si samo nainstaluje vše potřebné a po spuštění `make dev` ti GitHub
nabídne otevřít náhled webu v prohlížeči.

---

## Struktura

| Cesta | Co tam je |
|---|---|
| `src/pages/` | Jednotlivé stránky webu |
| `src/components/` | Opakovaně použité kousky (tlačítka, hlavička, patička…) |
| `src/content/` | Texty a obsah stránek (Markdown) |
| `src/styles/` | Styly a barvy projektu |
| `public/` | Soubory, které jdou na web tak jak jsou (favicon, fonty, `.htaccess`) |
| `dist/` | Hotový web po `make build` – co se nahrává na server |

---

## Nasazení

Nasazení probíhá **automaticky** přes GitHub Actions:

1. **Stage** (testovací web) – commit do větve `main` se sám nahraje.
2. **Produkce** (ostrý web) – otevři Pull Request z `main` do `production`, po
   merge se sám nahraje.

Podrobný návod krok za krokem: [`docs/git-flow.md`](./docs/git-flow.md).

---

## Co web umí navíc

Při buildu se kromě HTML generuje:

- **`sitemap.xml`** – mapa webu pro vyhledávače
- **`llms.txt`** – seznam stránek pro jazykové modely ([standard llmstxt.org](https://llmstxt.org/))
- **Markdown varianta každé stránky** – dostupná přes hlavičku `Accept: text/markdown`
- **Schema.org metadata** – aby Google rozuměl, že jde o terapeutické služby
- **Open Graph / Twitter Cards** – hezké náhledy při sdílení na sociálních sítích
