#!/usr/bin/env bash
# ============================================================================
# Redome.cz – tiskne SITE_URL pro aktuální větev (subdoména = slug větve).
#
# Volání:
#   bash cli/site-url.sh                 # podle git rev-parse
#   BRANCH=nahled bash cli/site-url.sh   # explicit override
#   SITE_URL=… bash cli/site-url.sh      # úplně přebije derivation
#
# Použití (build):
#   SITE_URL=$(bash cli/site-url.sh) npm run build
# ============================================================================

set -euo pipefail

# shellcheck source=./lib/_site-url.sh
source "$(dirname "$0")/lib/_site-url.sh"

site_url
