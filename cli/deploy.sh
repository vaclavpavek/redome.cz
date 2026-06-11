#!/usr/bin/env bash
# ============================================================================
# Redome.cz – atomic deploy přes FTPS (zero-downtime swap)
# ============================================================================
#
# Postup:
#   1) nahraj dist/  →  <FTP_PATH>/<branch>-next     (vedle live verze)
#   2) přejmenuj      <FTP_PATH>/<branch>      →  <branch>-prev   (záloha)
#   3) přejmenuj      <FTP_PATH>/<branch>-next →  <branch>        (nový live)
#   4) smaž           <FTP_PATH>/<branch>-prev                    (úklid)
#
#   Při jakékoli chybě po kroku 2 se provede rollback (prev → live).
#
# Volání lokálně:
#   make deploy                       # použije aktuální git větev
#   BRANCH=nahled cli/deploy.sh       # explicit override
#
# Volání v GitHub Actions:
#   - job nastaví FTP_HOST/USER/PASSWORD/PATH ze secrets
#   - BRANCH dostane z GITHUB_REF_NAME automaticky
#
# Závislosti:
#   - lftp 4.x (apt-get install -y lftp / brew install lftp)
#   - dist/ s předbuildovaným statickým výstupem (`make build`)
# ============================================================================

set -euo pipefail

# ----- Konfigurace -----------------------------------------------------------

# Lokální .env (lftp ho potřebuje; v CI proměnné přicházejí z workflow env).
# shellcheck source=/dev/null
if [[ -f .env && -z "${CI:-}" ]]; then
  set -a
  source .env
  set +a
fi

if ! command -v lftp >/dev/null 2>&1; then
  echo "❌ Nenalezeno 'lftp'. Nainstaluj: apt-get install -y lftp (CI) nebo brew install lftp (macOS)." >&2
  exit 1
fi

: "${FTP_HOST:?FTP_HOST není nastaveno (.env nebo GitHub Secret)}"
: "${FTP_USER:?FTP_USER není nastaveno}"
: "${FTP_PASSWORD:?FTP_PASSWORD není nastaveno}"
: "${FTP_PATH:?FTP_PATH není nastaveno (base path, např. /www/subdom)}"

# Branch – override přes BRANCH env, jinak GitHub Actions ref, jinak git.
BRANCH="${BRANCH:-${GITHUB_REF_NAME:-$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo '')}}"
if [[ -z "$BRANCH" ]]; then
  echo "❌ Nelze zjistit větev (nastav BRANCH=… nebo pusť uvnitř git repa)" >&2
  exit 1
fi

# Slug – bezpečný název pro subdoménu i FTP cestu.
# Příklad: 'fix/123_NEW' → 'fix-123-new'
#   1) malá písmena
#   2) lomítka, podtržítka, tečky, mezery → pomlčka
#   3) všechno mimo a-z 0-9 - pryč (diakritika tedy zmizí beze stopy –
#      branche pojmenovávej ASCII, hláška to upozorní)
#   4) sloučení vícenásobných pomlček + ořez okrajů
slugify() {
  printf '%s' "$1" \
    | tr '[:upper:]' '[:lower:]' \
    | sed -E 's@[/_. ]+@-@g; s/[^a-z0-9-]//g; s/-+/-/g; s/^-+//; s/-+$//'
}

SLUG="$(slugify "$BRANCH")"
if [[ -z "$SLUG" ]]; then
  echo "❌ Slug z větve '$BRANCH' je prázdný – přejmenuj větev." >&2
  exit 1
fi

LOCAL_DIR="${LOCAL_DIR:-dist}"
if [[ ! -d "$LOCAL_DIR" ]]; then
  echo "❌ Adresář '$LOCAL_DIR' neexistuje – nejdřív 'make build'." >&2
  exit 1
fi

# Cesty na FTP (slug, ne raw branch – víc-úrovňové názvy větví by jinak
# vytvořily nechtěnou adresářovou strukturu).
REMOTE_BASE="${FTP_PATH%/}"
REMOTE_LIVE="${REMOTE_BASE}/${SLUG}"
REMOTE_NEXT="${REMOTE_LIVE}-next"
REMOTE_PREV="${REMOTE_LIVE}-prev"

# ----- lftp wrapper ----------------------------------------------------------

# Spustí libovolný lftp skript proti FTPS (explicit, port 21).
# `set net:max-retries 2` – při výpadku jen pár pokusů, ať to dlouho neviselo.
lftp_run() {
  lftp -c "
    set ssl:verify-certificate yes
    set ftp:ssl-force true
    set ftp:ssl-protect-data true
    set net:max-retries 2
    set net:reconnect-interval-base 5
    set cmd:fail-exit true
    open -u \"$FTP_USER\",\"$FTP_PASSWORD\" \"ftp://$FTP_HOST\"
    $*
  "
}

# ----- Rollback --------------------------------------------------------------

ROLLBACK_NEEDED=0
trap rollback ERR

rollback() {
  local exit_code=$?
  if [[ $ROLLBACK_NEEDED -eq 1 ]]; then
    echo "⚠️  Chyba uprostřed swapu – vracím '$REMOTE_PREV' zpět na '$REMOTE_LIVE'…" >&2
    lftp_run "
      mv '$REMOTE_PREV' '$REMOTE_LIVE'
    " || echo "❌ Rollback selhal – zkontroluj stav na FTP ručně." >&2
  fi
  exit "$exit_code"
}

# ----- Vlastní deploy --------------------------------------------------------

echo "▶ Branch:       $BRANCH"
if [[ "$SLUG" != "$BRANCH" ]]; then
  echo "▶ Slug:         $SLUG"
fi
echo "▶ Lokál:        $LOCAL_DIR/"
echo "▶ FTP cíl:      ftps://$FTP_HOST$REMOTE_LIVE"
echo

# 1) Upload do <branch>-next (live verze běží bez přerušení vedle)
echo "1/4  Nahrávám $LOCAL_DIR/ → $REMOTE_NEXT …"
lftp_run "
  mkdir -p '$REMOTE_NEXT'
  mirror --reverse --delete --parallel=4 --verbose=1 '$LOCAL_DIR/' '$REMOTE_NEXT'
"

# 2) <branch> → <branch>-prev (záloha staré verze)
echo "2/4  Záloha: $REMOTE_LIVE → $REMOTE_PREV"
lftp_run "
  rm -r '$REMOTE_PREV'
" 2>/dev/null || true   # předchozí prev (pokud existuje) smažeme
lftp_run "
  mv '$REMOTE_LIVE' '$REMOTE_PREV'
" 2>/dev/null || true   # první deploy: live ještě neexistuje, OK

# Od teď je swap rozjetý – jakákoli chyba spustí rollback.
ROLLBACK_NEEDED=1

# 3) <branch>-next → <branch> (nová verze online)
echo "3/4  Aktivace: $REMOTE_NEXT → $REMOTE_LIVE"
lftp_run "
  mv '$REMOTE_NEXT' '$REMOTE_LIVE'
"

# Swap proběhl OK – rollback už není potřeba.
ROLLBACK_NEEDED=0

# 4) Úklid staré verze
echo "4/4  Mažu $REMOTE_PREV"
lftp_run "
  rm -r '$REMOTE_PREV'
" 2>/dev/null || echo "ℹ️  $REMOTE_PREV nebyl nalezen (první deploy), pokračuji."

echo
echo "✓ Hotovo – '$BRANCH' je živý na https://$SLUG.redome.cz"
