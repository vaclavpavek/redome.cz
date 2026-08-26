FROM node:24-bookworm-slim

# Debian base – kompatibilní s ghcr.io devcontainer features
# (docker-outside-of-docker, claude-code, copilot-cli, git, github-cli),
# které předpokládají apt-get. Alpine variant by ušetřil ~100 MB, ale
# rozbíjí features i některé binární moduly (sharp/fontconfig).
# Git je v base, aby `docker compose run --rm web` (bez devcontainer
# features) měl k dispozici `git rev-parse` – potřeba pro deploy script,
# který odvozuje větev. Devcontainer feature `git:1` ho pak může
# přeinstalovat na novější verzi, kolize nevadí.
# nano/mc/tree jsou QoL nástroje, iputils-ping + dnsutils (ping,
# nslookup, dig) pro síťovou diagnostiku, lftp pro FTPS deploy.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        git make bash ca-certificates curl nano mc tree \
        iputils-ping dnsutils lftp \
    && rm -rf /var/lib/apt/lists/*

# Update npm na nejnovější (image přichází se starší verzí, která pak
# při každém npm příkazu vypisuje upgrade notice).
RUN npm install -g npm@latest \
    && npm config set fund false -g \
    && npm config set update-notifier false -g

# Pro Dockerfile health a běh příkazů přes Make.
# ~/.local/bin doplněn do PATH – install.sh skripty (Claude Code, Copilot)
# tam jako non-root user instalují binárky.
ENV IN_CONTAINER=1 \
    NODE_ENV=development \
    HOST=0.0.0.0 \
    CHOKIDAR_USEPOLLING=true \
    WATCHPACK_POLLING=true \
    ASTRO_TELEMETRY_DISABLED=1 \
    PATH=/home/node/.local/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin \
    # Compose CLI běží v kontejneru, BuildKit démon na hostiteli
    # (docker-outside-of-docker) – zápis --metadata-file do defaultního
    # /tmp kontejneru končí "permission denied". TMPDIR přesměruje
    # dočasné soubory Docker CLI do adresáře, který node reálně vlastní.
    TMPDIR=/home/node/.cache/tmp

WORKDIR /workspace

# Aby named volume node_modules a ~/.local měly správného vlastníka
# (uid 1000 = node). ~/.claude, ~/.copilot a /commandhistory jsou
# named volumes v devcontainer.json (persistují OAuth tokeny, session
# a bash history přes rebuildy) – cesty předpřipravíme s node
# ownership, aby docker při mountu nevytvořil root-owned dir.
RUN mkdir -p /workspace/node_modules /home/node/.local/bin \
        /home/node/.claude /home/node/.copilot /commandhistory \
        /home/node/.cache/tmp \
    && chown -R node:node /workspace /home/node/.local \
        /home/node/.claude /home/node/.copilot /commandhistory \
        /home/node/.cache/tmp

# Bash history – symlink ~/.bash_history → /commandhistory/.bash_history
# (default HISTFILE bashe, žádný explicit export není potřeba).
# Soubor v /commandhistory vznikne při prvním zápisu bashe.
# PROMPT_COMMAND='history -a' appenduje po každém příkazu, ne až při
# exitu shellu – jinak by rebuild kontejneru ztratil aktuální session.
RUN ln -sf /commandhistory/.bash_history /home/node/.bash_history \
    && chown -h node:node /home/node/.bash_history \
    && echo "export PROMPT_COMMAND='history -a'" >> /etc/bash.bashrc

# V Codespaces je /var/run/docker.sock symlink na /var/run/docker-host.sock,
# který vlastní root:800 (GID 800 = hostitelská `docker` skupina, uvnitř
# kontejneru bez jména). Bez členství v této skupině `docker` z devcontaineru
# hlásí permission denied. Přidání i do skupiny 0 (root) pokrývá případy,
# kdy je sock vlastněn root:root (jiné prostředí než Codespaces).
RUN groupadd -f -g 800 docker-host \
    && usermod -aG root,docker-host node

USER node

# Bind mountovaný /workspace má UID hostitele (501 na macOS), uvnitř
# běžíme jako node (1000). Bez tohoto by git hlásil "dubious ownership"
# a deploy script by nemohl odvodit větev.
RUN git config --global --add safe.directory '*'

# Defaultně držíme kontejner naživu, samotný server spouští `make dev`
CMD ["sleep", "infinity"]
