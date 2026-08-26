# shellcheck shell=bash
#
# Odvození SITE_URL podle git větve.
#
# Priorita:
#   1) explicitní SITE_URL env – nepřepisovat (override pro test produkce z lokálu)
#   2) BRANCH env (CI ho předá z github.ref_name nebo PR base.ref)
#   3) git rev-parse --abbrev-ref HEAD (lokál)
#   4) fallback https://www.redome.cz (produkce)
#
# Kanonické branchy:
#   nahled -> https://nahled.redome.cz
#   www    -> https://www.redome.cz
#
# Použití:
#   source cli/lib/_site-url.sh
#   url=$(site_url)

# Závislost: slugify (jen pokud ještě není načten).
if ! declare -F slugify >/dev/null 2>&1; then
  # shellcheck source=./_slugify.sh
  source "$(dirname "${BASH_SOURCE[0]}")/_slugify.sh"
fi

site_url() {
  if [[ -n "${SITE_URL:-}" ]]; then
    printf '%s\n' "$SITE_URL"
    return
  fi

  local branch="${BRANCH:-${GITHUB_REF_NAME:-$(git rev-parse --abbrev-ref HEAD 2>/dev/null || true)}}"

  if [[ -z "$branch" ]]; then
    printf '%s\n' 'https://www.redome.cz'
    return
  fi

  local branch_slug="${branch,,}"
  case "$branch_slug" in
    "www")
      printf '%s\n' 'https://www.redome.cz'
      ;;
    "nahled")
      printf '%s\n' 'https://nahled.redome.cz'
      ;;
    *)
      printf 'https://%s.redome.cz\n' "$(slugify "$branch")"
      ;;
  esac
}
