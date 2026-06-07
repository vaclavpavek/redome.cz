FROM node:22-alpine

# Astro a Vite čeká non-root uživatele; node:alpine ho má (uid 1000)
RUN apk add --no-cache git make bash

# Pro Dockerfile health a běh příkazů přes Make
ENV IN_CONTAINER=1 \
    NODE_ENV=development \
    HOST=0.0.0.0 \
    CHOKIDAR_USEPOLLING=true \
    WATCHPACK_POLLING=true

WORKDIR /workspace

# Aby named volume node_modules měl správného vlastníka (uid 1000 = node)
RUN mkdir -p /workspace/node_modules && chown -R node:node /workspace

USER node

# Defaultně držíme kontejner naživu, samotný server spouští `make dev`
CMD ["sleep", "infinity"]
