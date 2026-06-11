#!/usr/bin/env bash
# ============================================================================
# Redome.cz – sanity check sitemap.xml
# ============================================================================
#
# Stáhne sitemap.xml, pro každou URL ověří:
#   - HTML varianta (default Accept):
#       * HTTP 200
#       * Content-Type obsahuje "text/html"
#       * Content-Type obsahuje "utf-8" (case-insensitive)
#       * Tělo začíná "<!DOCTYPE"
#   - Markdown varianta (Accept: text/markdown):
#       * HTTP 200
#       * Content-Type obsahuje "text/markdown"
#       * Content-Type obsahuje "utf-8"
#       * Tělo začíná "# " (Markdown heading)
#
# Volání:
#   bash cli/check-sitemap.sh                            # default nahled
#   BASE=https://www.redome.cz bash cli/check-sitemap.sh # produkce
# ============================================================================

set -euo pipefail

BASE="${BASE:-https://nahled.redome.cz}"
SITEMAP="${BASE%/}/sitemap.xml"

CYAN='\033[36m'; GREEN='\033[32m'; RED='\033[31m'; DIM='\033[2m'; RESET='\033[0m'

printf "${CYAN}▶ Sitemap:${RESET} %s\n\n" "$SITEMAP"

# Stáhni sitemap a vytáhni URL.
SITEMAP_BODY=$(curl -sSfL "$SITEMAP" || { echo "❌ Sitemap nedostupná: $SITEMAP" >&2; exit 1; })
URLS=$(printf '%s' "$SITEMAP_BODY" | grep -oE '<loc>[^<]+</loc>' | sed -E 's|</?loc>||g')

if [[ -z "$URLS" ]]; then
  echo "❌ Sitemap je prázdná nebo bez <loc>" >&2
  exit 1
fi

TOTAL=$(printf '%s\n' "$URLS" | wc -l | tr -d ' ')
PASS=0
FAIL=0
declare -a FAILED_URLS=()

# Ověří jeden request (URL + Accept) na status, content-type a začátek body.
check_variant() {
  local url="$1" accept="$2" expect_ctype="$3" expect_start="$4"

  # Stáhni headers + body, oddělené ASCII NUL by se mohly vázat na binární data;
  # spolehlivější je rozdělit response přes konec headers.
  local tmp_headers tmp_body
  tmp_headers=$(mktemp)
  tmp_body=$(mktemp)
  trap "rm -f '$tmp_headers' '$tmp_body'" RETURN

  local status
  status=$(curl -sSL \
    -H "Accept: $accept" \
    -D "$tmp_headers" \
    -o "$tmp_body" \
    -w "%{http_code}" \
    "$url" || echo "000")

  local ctype
  ctype=$(awk -F': *' 'tolower($1)=="content-type" { print $2 }' "$tmp_headers" \
    | tail -1 | tr -d '\r')

  local first_line
  first_line=$(head -c 200 "$tmp_body" | head -1)

  # Lowercase přes tr (kompatibilita s bash 3.2 na macOS).
  local ctype_lc
  ctype_lc=$(printf '%s' "$ctype" | tr '[:upper:]' '[:lower:]')

  local errs=()
  [[ "$status" != "200" ]] && errs+=("HTTP $status")
  [[ "$ctype_lc" != *"$expect_ctype"* ]] && errs+=("Content-Type: $ctype")
  [[ "$ctype_lc" != *"utf-8"* ]] && errs+=("missing utf-8 charset")
  [[ "$first_line" != "$expect_start"* ]] && errs+=("body not starting with '$expect_start'")

  if [[ ${#errs[@]} -eq 0 ]]; then
    return 0
  else
    printf '    %s\n' "${errs[@]}" >&2
    return 1
  fi
}

while IFS= read -r url; do
  [[ -z "$url" ]] && continue
  printf "${DIM}━━ %s${RESET}\n" "$url"

  html_ok=1; md_ok=1
  printf "  HTML  ... "
  if check_variant "$url" "text/html" "text/html" "<!DOCTYPE"; then
    printf "${GREEN}OK${RESET}\n"
  else
    printf "${RED}FAIL${RESET}\n"
    html_ok=0
  fi

  printf "  MD    ... "
  if check_variant "$url" "text/markdown" "text/markdown" "# "; then
    printf "${GREEN}OK${RESET}\n"
  else
    printf "${RED}FAIL${RESET}\n"
    md_ok=0
  fi

  if [[ $html_ok -eq 1 && $md_ok -eq 1 ]]; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
    FAILED_URLS+=("$url")
  fi
  echo
done <<< "$URLS"

printf "${CYAN}──────────────${RESET}\n"
printf "  Celkem: %d\n" "$TOTAL"
printf "  ${GREEN}PASS:${RESET}   %d\n" "$PASS"
printf "  ${RED}FAIL:${RESET}   %d\n" "$FAIL"

if [[ $FAIL -gt 0 ]]; then
  echo
  echo "Failed URLs:"
  for u in "${FAILED_URLS[@]}"; do
    echo "  - $u"
  done
  exit 1
fi
