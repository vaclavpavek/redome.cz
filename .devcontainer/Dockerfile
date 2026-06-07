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

# Defaultně držíme kontejner naživu, samotný server spouští `make dev`
CMD ["sleep", "infinity"]
