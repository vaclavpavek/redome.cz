# Makefile pro redome.cz – jednotný entry point pro všechny příkazy.
# Vychozí cíl je `help`. Cíle jsou pojmenované anglicky, popisy česky.
#
# Použití:
#   make            – zobrazí nápovědu
#   make help       – totéž
#   make <cíl>      – spustí konkrétní úlohu

.DEFAULT_GOAL := help
SHELL := /bin/bash

# --- Detekce prostředí ---------------------------------------------------------
# Pokud již běžíme uvnitř devcontaineru, voláme příkazy přímo.
# Pokud jsme na hostiteli, obalíme je do docker compose.
ifdef IN_CONTAINER
  RUN       :=
  RUN_PORTS :=
else
  RUN       := docker compose run --rm web
  RUN_PORTS := docker compose run --rm --service-ports web
endif

# Barvy do nápovědy
CYAN  := \033[36m
BOLD  := \033[1m
RESET := \033[0m

.PHONY: help install dev build preview check lint format test clean \
        docker-up docker-down docker-shell logs ps \
        generate-sitemap generate-llms generate-md deploy \
        screenshot browser-shell mail

## help: Zobrazí tuto nápovědu se seznamem příkazů
help:
	@printf "\n$(BOLD)Redome.cz – dostupné příkazy$(RESET)\n\n"
	@awk 'BEGIN {FS = ":[^#]*## "} /^## [a-zA-Z_-]+:/ { \
		gsub(/^## /, "", $$1); \
		printf "  $(CYAN)%-20s$(RESET) %s\n", $$1, $$2 \
	}' $(MAKEFILE_LIST)
	@printf "\nNejprve spusť: $(CYAN)make install$(RESET), pak $(CYAN)make dev$(RESET).\n\n"

## install: Nainstaluje závislosti (npm) uvnitř kontejneru
install:
	$(RUN) npm install

## dev: Spustí vývojový server s auto-reloadem na http://localhost:4321
dev:
	$(RUN_PORTS) npm run dev

## build: Sestaví produkční verzi do dist/ (vč. sitemap, llms.txt, MD variant)
build:
	$(RUN) npm run build

## preview: Spustí náhled produkčního buildu na http://localhost:4321
preview:
	$(RUN_PORTS) npm run preview

## check: Kontrola typů a Astro diagnostika (CI brána)
check:
	$(RUN) npm run check

## lint: Zkontroluje formátování kódu (Prettier)
lint:
	$(RUN) npm run lint

## format: Naformátuje kód podle pravidel Prettieru
format:
	$(RUN) npm run format

## test: Spustí testy
test:
	$(RUN) npm test

## clean: Smaže build artefakty a node_modules
clean:
	$(RUN) rm -rf dist .astro node_modules
	-docker compose down -v

## docker-up: Nastartuje docker-compose stack na pozadí
docker-up:
	docker compose up -d

## docker-down: Zastaví docker-compose stack
docker-down:
	docker compose down

## docker-shell: Otevře interaktivní shell uvnitř kontejneru
docker-shell:
	docker compose run --rm web sh

## logs: Zobrazí logy běžícího kontejneru
logs:
	docker compose logs -f web

## ps: Zobrazí stav kontejnerů
ps:
	docker compose ps

## generate-sitemap: Vygeneruje pouze sitemap.xml (běží v rámci build)
generate-sitemap: build
	@echo "Sitemap je v dist/sitemap-index.xml"

## generate-llms: Vygeneruje pouze llms.txt a llms-full.txt (běží v rámci build)
generate-llms: build
	@echo "llms.txt je v dist/llms.txt"

## generate-md: Vygeneruje pouze Markdown varianty stránek (běží v rámci build)
generate-md: build
	@echo "Markdown varianty jsou v dist/*.md"

## mail: Otevře schránku Mailpit (zachycuje všechny vývojové e-maily)
mail:
	@echo "📬 Otevři v prohlížeči: http://localhost:8025"
	@command -v open >/dev/null 2>&1 && open http://localhost:8025 || true

## screenshot: Vyfotí stránku přes headless Chrome (URL=/cesta [OUT=name.png])
# Browser kontejner běží vždy mimo (sourozenec), v devcontaineru/Codespaces
# musí mít docker-outside-of-docker feature.
screenshot:
	@mkdir -p screenshots
	@URL=$${URL:-/}; OUT=$${OUT:-screenshot.png}; \
	docker compose --profile tools run --rm browser sh -c " \
	  agent-browser open 'http://host.docker.internal:4321$$URL' \
	    --executable-path /usr/bin/chromium --viewport 1440 900 && \
	  agent-browser wait --load networkidle && \
	  agent-browser wait 1500 && \
	  agent-browser screenshot --full '/work/screenshots/'$$OUT && \
	  agent-browser close" && \
	echo "📷 screenshots/$$OUT (URL: $$URL)"

## browser-shell: Otevře shell uvnitř browser kontejneru (debug)
browser-shell:
	docker compose --profile tools run --rm browser bash

## deploy: Push do main – nasazení obstará GitHub Actions (stage); na produkci jde přes PR
deploy:
	@echo "Nasazení probíhá automaticky přes GitHub Actions."
	@echo "Stage: commit do větve 'main' → automatický deploy."
	@echo "Produkce: otevři PR z 'main' do 'production' a po merge se nasadí."
	@echo "Podrobnosti: code/docs/git-flow.md"
