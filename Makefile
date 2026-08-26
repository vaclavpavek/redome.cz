# Makefile pro redome.cz – jednotný entry point pro všechny příkazy.
# Výchozí cíl je `help`. Cíle jsou pojmenované anglicky, popisy česky.
#
# Konvence pro `make help`:
#   ### Nadpis skupiny      – hlavička sekce v nápovědě
#   ## cil: Popis česky     – cíl + jeho popis
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
DIM   := \033[2m
RESET := \033[0m

.PHONY: help \
        install dev preview mail clean \
        docker-up docker-down docker-shell docker-logs docker-ps browser-shell \
        check lint format test pre-commit screenshot \
        build deploy generate-sitemap generate-llms generate-md generate-og

## help: Zobrazí tuto nápovědu se seznamem příkazů
help:
	@printf "\n$(BOLD)Redome.cz – dostupné příkazy$(RESET)\n"
	@awk ' \
		/^### / { \
			sub(/^### /, ""); \
			printf "\n  $(BOLD)%s$(RESET)\n", $$0; \
			next \
		} \
		/^## [a-zA-Z_-]+:/ { \
			sub(/^## /, ""); \
			idx = index($$0, ":"); \
			name = substr($$0, 1, idx - 1); \
			desc = substr($$0, idx + 2); \
			printf "    $(CYAN)%-18s$(RESET)  %s\n", name, desc \
		} \
	' $(MAKEFILE_LIST)
	@printf "\n  $(DIM)Nejprve spusť$(RESET) $(CYAN)make install$(RESET)$(DIM), pak$(RESET) $(CYAN)make dev$(RESET)$(DIM).$(RESET)\n\n"

### Lokální prostředí

## install: Nainstaluje závislosti (npm) uvnitř kontejneru
install:
	$(RUN) npm install

## dev: Spustí vývojový server s auto-reloadem na http://localhost:4321
# Když je stack zvednutý přes `make docker-up`, web kontejner už drží port
# 4321 → `run --service-ports` by selhal. V tom případě se přepojíme přes
# `docker compose exec` do běžícího webu. Když stack nestojí, spustíme web
# ad-hoc přes `run --rm`.
dev:
ifdef IN_CONTAINER
	npm run dev
else
	@if docker compose ps --services --filter status=running 2>/dev/null | grep -qx web; then \
		echo "→ web už běží (docker-up), spouštím dev server přes exec"; \
		docker compose exec web npm run dev; \
	else \
		echo "→ stack stojí, spouštím web ad-hoc přes run --rm"; \
		docker compose run --rm --service-ports web npm run dev; \
	fi
endif

## preview: Spustí náhled produkčního buildu na http://localhost:4321
preview:
ifdef IN_CONTAINER
	npm run preview
else
	@if docker compose ps --services --filter status=running 2>/dev/null | grep -qx web; then \
		docker compose exec web npm run preview; \
	else \
		docker compose run --rm --service-ports web npm run preview; \
	fi
endif

## mail: Otevře schránku Mailpit (zachycuje všechny vývojové e-maily)
mail:
	@echo "📬 Otevři v prohlížeči: http://localhost:8025"
	@command -v open >/dev/null 2>&1 && open http://localhost:8025 || true

## clean: Smaže build artefakty a node_modules
clean:
	$(RUN) rm -rf dist .astro node_modules
	-docker compose down -v

## docker-up: Nastartuje docker stack na pozadí
docker-up:
	docker compose up -d

## docker-down: Zastaví docker stack
docker-down:
	docker compose down

## docker-shell: Otevře interaktivní shell uvnitř web kontejneru
docker-shell:
	docker compose run --rm web sh

## docker-logs: Zobrazí logy běžícího web kontejneru
docker-logs:
	docker compose logs -f web

## docker-ps: Zobrazí stav kontejnerů
docker-ps:
	docker compose ps

## browser-shell: Otevře shell uvnitř browser kontejneru (debug)
browser-shell:
	docker compose --profile tools run --rm browser bash

### Kontrola

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

## pre-commit: Sada kontrol před commitem (lint + check + test)
pre-commit: lint check test
	@echo "✓ Pre-commit kontroly prošly."

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

### Release

## build: Sestaví produkční verzi do dist/ (vč. sitemap, llms.txt, MD variant)
# SITE_URL a build metadata se odvozují z aktuální git větve / commitu.
# Override: SITE_URL=https://… make build
build:
	@GIT_SHA=$$(git rev-parse --short HEAD 2>/dev/null || echo local-dev); \
	GIT_BRANCH=$$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo ${GITHUB_REF_NAME:-unknown}); \
	PUBLIC_GIT_SHA="$$GIT_SHA" PUBLIC_GIT_BRANCH="$$GIT_BRANCH" \
	SITE_URL=$$(bash cli/site-url.sh) $(RUN) npm run build

## deploy: Atomic FTPS deploy podle aktuální větve (cli/deploy.sh)
# Nahraje dist/ jako <branch>-next, prohodí se <branch>, smaže prev.
# Při chybě uprostřed swapu provede rollback. CI volá totéž
# (workflow předá FTP_* ze secrets a BRANCH z GITHUB_REF_NAME).
deploy: build
	$(RUN) bash cli/deploy.sh

## generate-sitemap: Vygeneruje pouze sitemap.xml (běží v rámci build)
generate-sitemap: build
	@echo "Sitemap je v dist/sitemap-index.xml"

## generate-llms: Vygeneruje pouze llms.txt a llms-full.txt (běží v rámci build)
generate-llms: build
	@echo "llms.txt je v dist/llms.txt"

## generate-md: Vygeneruje pouze Markdown varianty stránek (běží v rámci build)
generate-md: build
	@echo "Markdown varianty jsou v dist/*.md"

## generate-og: Přerenderuje public/og-default.jpg ze šablony tools/og-default.html
generate-og:
	@docker compose --profile tools run --rm \
		-v "$$(pwd)/tools:/work/tools" \
		-v "$$(pwd)/public:/work/public" \
		browser sh -c " \
		  agent-browser open 'file:///work/tools/og-default.html' \
		    --executable-path /usr/bin/chromium --viewport 1200 630 && \
		  agent-browser wait --load networkidle && \
		  agent-browser wait 800 && \
		  agent-browser screenshot '/work/tools/og-default.png' && \
		  agent-browser close"
	@$(RUN) node -e "require('sharp')('tools/og-default.png').resize(1200,630,{fit:'cover'}).jpeg({quality:85,progressive:true,mozjpeg:true}).toFile('public/og-default.jpg').then(i=>console.log('✓ public/og-default.jpg',i.size,'B'))"
	@rm -f tools/og-default.png
	@echo "✓ Hotovo: public/og-default.jpg"
