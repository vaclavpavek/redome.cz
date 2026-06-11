FROM node:24-bookworm-slim

# Debian base – kompatibilní s ghcr.io devcontainer features
# (docker-outside-of-docker, claude-code, copilot-cli, git, github-cli),
# které předpokládají apt-get. Alpine variant by ušetřil ~100 MB, ale
# rozbíjí features i některé binární moduly (sharp/fontconfig).
# Git instaluje feature `git:1`. nano/mc/tree jsou QoL nástroje,
# iputils-ping + dnsutils (ping, nslookup, dig) pro síťovou diagnostiku.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        make bash ca-certificates curl nano mc tree \
        iputils-ping dnsutils \
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
    PATH=/home/node/.local/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

WORKDIR /workspace

# Aby named volume node_modules a ~/.local měly správného vlastníka
# (uid 1000 = node). ~/.claude, ~/.copilot a /commandhistory jsou
# named volumes v devcontainer.json (persistují OAuth tokeny, session
# a bash history přes rebuildy) – cesty předpřipravíme s node
# ownership, aby docker při mountu nevytvořil root-owned dir.
RUN mkdir -p /workspace/node_modules /home/node/.local/bin \
        /home/node/.claude /home/node/.copilot /commandhistory \
    && chown -R node:node /workspace /home/node/.local \
        /home/node/.claude /home/node/.copilot /commandhistory

# Bash history – symlink ~/.bash_history → /commandhistory/.bash_history
# (default HISTFILE bashe, žádný explicit export není potřeba).
# Soubor v /commandhistory vznikne při prvním zápisu bashe.
# PROMPT_COMMAND='history -a' appenduje po každém příkazu, ne až při
# exitu shellu – jinak by rebuild kontejneru ztratil aktuální session.
RUN ln -sf /commandhistory/.bash_history /home/node/.bash_history \
    && chown -h node:node /home/node/.bash_history \
    && echo "export PROMPT_COMMAND='history -a'" >> /etc/bash.bashrc

USER node

# Defaultně držíme kontejner naživu, samotný server spouští `make dev`
CMD ["sleep", "infinity"]
