# shellcheck shell=bash
#
# Slugify: jméno větve → bezpečný subdomain/path slug.
#
# Pravidla:
#   1) lowercase
#   2) lomítka, podtržítka, tečky, mezery → pomlčka
#   3) všechno mimo a-z 0-9 - pryč (diakritika tedy zmizí – branche pojmenovávej ASCII)
#   4) sloučení vícenásobných pomlček + ořez okrajů
#
# Použití:
#   source cli/lib/_slugify.sh
#   slug=$(slugify "fix/123_FOO")   # → fix-123-foo

slugify() {
  printf '%s' "$1" \
    | tr '[:upper:]' '[:lower:]' \
    | sed -E 's@[/_. ]+@-@g; s/[^a-z0-9-]//g; s/-+/-/g; s/^-+//; s/-+$//'
}
