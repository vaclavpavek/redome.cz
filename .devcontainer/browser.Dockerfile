# Samostatný image pro agent-browser (https://github.com/vercel-labs/agent-browser).
# Slouží jen k pořizování screenshotů a kontrole UI z agentích nástrojů –
# neinstaluje se na hostiteli.

FROM node:22-bookworm-slim

# Chromium z apt (funguje na amd64 i arm64; agent-browser Chrome for Testing
# ARM64 build nenabízí) + běhové závislosti pro headless režim
RUN apt-get update && apt-get install -y --no-install-recommends \
      ca-certificates curl tini \
      chromium fonts-liberation fonts-noto-color-emoji fonts-unifont \
  && rm -rf /var/lib/apt/lists/*

RUN npm install -g agent-browser

# Předáme cestu k systémovému Chromiu – agent-browser ho použije
# místo stahování Chrome for Testing.
ENV AGENT_BROWSER_EXECUTABLE_PATH=/usr/bin/chromium \
    AGENT_BROWSER_HEADLESS=true \
    PATH=/usr/local/bin:$PATH

WORKDIR /work

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["sleep", "infinity"]
