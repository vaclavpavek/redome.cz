FROM node:22-bookworm-slim

# Debian base – kompatibilní s ghcr.io devcontainer features
# (docker-outside-of-docker apod.), které předpokládají apt-get.
# Alpine variant by ušetřil ~100 MB, ale rozbíjí features i některé
# binární moduly (sharp/fontconfig).
RUN apt-get update \
    && apt-get install -y --no-install-recommends git make bash ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Pro Dockerfile health a běh příkazů přes Make
ENV IN_CONTAINER=1 \
    NODE_ENV=development \
    HOST=0.0.0.0 \
    CHOKIDAR_USEPOLLING=true \
    WATCHPACK_POLLING=true \
    ASTRO_TELEMETRY_DISABLED=1

WORKDIR /workspace

# Aby named volume node_modules měl správného vlastníka (uid 1000 = node)
RUN mkdir -p /workspace/node_modules && chown -R node:node /workspace

USER node

# Defaultně držíme kontejner naživu, samotný server spouští `make dev`
CMD ["sleep", "infinity"]
