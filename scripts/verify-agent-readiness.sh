#!/usr/bin/env bash
# Post-deploy verification of the agent-facing surface against a live origin.
#
#   scripts/verify-agent-readiness.sh                     # https://www.klokie.com
#   scripts/verify-agent-readiness.sh http://localhost:8787
#
# Checks: acceptmarkdown.com compliance (markdown for Accept: text/markdown,
# Vary: Accept, 406 on unsatisfiable Accept, q-values honored), real 404s with a
# markdown body, llms.txt, robots.txt, sitemap, JSON-LD, and the trust anchors.
set -uo pipefail

BASE="${1:-https://www.klokie.com}"
pass=0
fail=0

ok()   { printf '  \033[32m✓\033[0m %s\n' "$1"; pass=$((pass + 1)); }
bad()  { printf '  \033[31m✗\033[0m %s\n' "$1"; fail=$((fail + 1)); }

# check <label> <expected-substring> <actual>
# `grep -q` would exit early and SIGPIPE the printf, which `pipefail` then
# reports as a failed match on large bodies — read the whole stream instead.
check() {
  if printf '%s' "$3" | grep -iF -- "$2" >/dev/null; then ok "$1"; else
    bad "$1 (expected to contain '$2', got: $(printf '%s' "$3" | head -c 120 | tr '\n' ' '))"
  fi
}

status() { curl -s -o /dev/null -w '%{http_code}' "$@"; }
headers() { curl -sS -D - -o /dev/null "$@"; }

echo "Verifying $BASE"

echo "Markdown content negotiation (acceptmarkdown.com)"
for path in / /about/ /work/ /articles/ /privacy/; do
  h=$(headers -H 'Accept: text/markdown' "$BASE$path")
  check "$path serves text/markdown"        "content-type: text/markdown" "$h"
  check "$path sets Vary: Accept"           "vary: accept"                "$h"
done
check "HTML default for a browser Accept" "content-type: text/html" \
  "$(headers -H 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' "$BASE/about/")"
check "HTML response sets Vary: Accept" "vary: accept" \
  "$(headers -H 'Accept: text/html' "$BASE/about/")"
check "HTML advertises the .md twin (RFC 8288)" 'rel="alternate"' \
  "$(headers -H 'Accept: text/html' "$BASE/about/")"
check "q-values honored (md > html)" "content-type: text/markdown" \
  "$(headers -H 'Accept: text/markdown, text/html;q=0.8' "$BASE/about/")"
check "q-values honored (html > md)" "content-type: text/html" \
  "$(headers -H 'Accept: text/markdown;q=0.2, text/html;q=0.9' "$BASE/about/")"
check "q=0 on markdown falls back to HTML" "content-type: text/html" \
  "$(headers -H 'Accept: text/markdown;q=0, text/html' "$BASE/about/")"
[ "$(status -H 'Accept: application/pdf' "$BASE/about/")" = "406" ] \
  && ok "406 for an unsatisfiable Accept" || bad "406 for an unsatisfiable Accept"
check "direct .md sibling is text/markdown" "content-type: text/markdown" \
  "$(headers "$BASE/about/index.md")"

echo "404 handling"
miss="/some-path-that-does-not-exist"
for accept in "" "*/*" "text/markdown" "text/html"; do
  code=$([ -z "$accept" ] && status "$BASE$miss" || status -H "Accept: $accept" "$BASE$miss")
  [ "$code" = "404" ] && ok "404 for Accept: ${accept:-<none>}" || bad "404 for Accept: ${accept:-<none>} (got $code)"
done
body=$(curl -s -H 'Accept: */*' "$BASE$miss")
check "404 body is markdown"          "# 404"              "$body"
check "404 body links llms.txt"       "/llms.txt"          "$body"
check "404 body links the sitemap"    "/sitemap-index.xml" "$body"
check "404 body is text/markdown"     "content-type: text/markdown" \
  "$(headers -H 'Accept: */*' "$BASE$miss")"

echo "Machine-readable files"
llms=$(curl -s "$BASE/llms.txt")
check "llms.txt has an H1"                  "# Daniel"               "$llms"
check "llms.txt has a summary blockquote"   "> Senior"               "$llms"
check "llms.txt has when-to-use guidance"   "## When to use this site" "$llms"
check "llms.txt links markdown twins"       "/about/index.md"        "$llms"
check "llms-full.txt is present"            "# About"                "$(curl -s "$BASE/llms-full.txt")"
robots=$(curl -s "$BASE/robots.txt")
check "robots.txt points at the sitemap"    "Sitemap:"               "$robots"
check "robots.txt points at llms.txt"       "/llms.txt"              "$robots"
check "sitemap index is XML"                "<sitemapindex"          "$(curl -s "$BASE/sitemap-index.xml")"

echo "Identity and trust anchors"
home=$(curl -s "$BASE/")
check "JSON-LD present"          'application/ld+json' "$home"
check "JSON-LD @type Person"     '"@type":"Person"'    "$home"
check "JSON-LD name"             '"name":"Daniel Grossfeld"' "$home"
check "JSON-LD description"      '"description":"Daniel'     "$home"
check "JSON-LD url"              '"url":"https://www.klokie.com"' "$home"
for path in /about/ /contact/ /privacy/; do
  code=$(status "$BASE$path")
  chars=$(curl -s -H 'Accept: text/markdown' "$BASE$path" | wc -c | tr -d ' ')
  if [ "$code" = "200" ] && [ "$chars" -gt 500 ]; then
    ok "$path is a real page ($chars chars of markdown)"
  else
    bad "$path (status $code, $chars chars)"
  fi
done

echo
printf 'passed %d, failed %d\n' "$pass" "$fail"
[ "$fail" -eq 0 ]
