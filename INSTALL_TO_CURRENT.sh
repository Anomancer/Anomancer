#!/usr/bin/env bash
set -euo pipefail

SOURCE_DIR="$(cd "$(dirname "$0")" && pwd)"
TARGET_DIR="${1:-$HOME/GitHub/Anomancer}"
MODE="${2:-}"

if [[ -z "$TARGET_DIR" ]]; then
  echo "Käyttö: ./INSTALL_TO_CURRENT.sh [/täysi/polku/anomancer-projektiin] [--delete-stale]" >&2
  exit 2
fi
if [[ ! -d "$TARGET_DIR" || ! -f "$TARGET_DIR/package.json" ]]; then
  echo "VIRHE: kohteesta puuttuu package.json: $TARGET_DIR" >&2
  exit 1
fi
if ! command -v rsync >/dev/null 2>&1; then
  echo "VIRHE: rsync puuttuu." >&2
  exit 1
fi

TARGET_DIR="$(cd "$TARGET_DIR" && pwd)"
if [[ "$TARGET_DIR" == "/" || "$TARGET_DIR" == "$SOURCE_DIR" ]]; then
  echo "VIRHE: turvaton tai sama lähde- ja kohdepolku: $TARGET_DIR" >&2
  exit 1
fi

PACKAGE_NAME="$(node -p "require(process.argv[1]).name || ''" "$TARGET_DIR/package.json")"
if [[ "$PACKAGE_NAME" != "anomancer-lahetyskone" ]]; then
  echo "VIRHE: kohde ei ole Anomancer-projekti (package name: $PACKAGE_NAME)." >&2
  exit 1
fi

TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
BACKUP_REL=".anomancer-backups/$TIMESTAMP"
DELETE_ARGS=()
if [[ "$MODE" == "--delete-stale" ]]; then
  if [[ "${ANOMANCER_INSTALL_CONFIRM:-}" != "YES" ]]; then
    echo "VIRHE: --delete-stale vaatii ANOMANCER_INSTALL_CONFIRM=YES." >&2
    exit 2
  fi
  DELETE_ARGS=(--delete)
elif [[ -n "$MODE" ]]; then
  echo "VIRHE: tuntematon valinta: $MODE" >&2
  exit 2
fi

content_fingerprint() {
  local root="$1"
  if [[ ! -d "$root/content" ]]; then
    echo "missing"
    return
  fi
  find "$root/content" -type f -print0 | LC_ALL=C sort -z | xargs -0 sha256sum | sha256sum | awk '{print $1}'
}

CONTENT_BEFORE="$(content_fingerprint "$TARGET_DIR")"
CONTENT_COUNT_BEFORE="$(find "$TARGET_DIR/content" -type f -name '*.md' 2>/dev/null | wc -l | tr -d ' ')"

echo "ANOMANCER 1.18.3 · CODEMANCER WORKBENCH · CONTENT-SAFE INSTALL"
echo "Lähde: $SOURCE_DIR"
echo "Kohde: $TARGET_DIR"
echo "Varmuuskopio: $TARGET_DIR/$BACKUP_REL"
echo "Sisältösuoja: $CONTENT_COUNT_BEFORE Markdown-tiedostoa · content/ ja media/ jätetään koskematta"

rsync -a --itemize-changes --backup --backup-dir="$BACKUP_REL" "${DELETE_ARGS[@]}" \
  --exclude='.git/' \
  --exclude='.vercel/' \
  --exclude='node_modules/' \
  --exclude='.anomancer-backups/' \
  --exclude='.env' \
  --exclude='.env.*' \
  --exclude='.anomancer/' \
  --exclude='content/' \
  --exclude='media/' \
  --exclude='public/' \
  --exclude='lahetykset/' \
  --exclude='dispatches/' \
  --exclude='lahetykset.html' \
  --exclude='dispatches.html' \
  --exclude='content-manifest.json' \
  --exclude='evidence-manifest.json' \
  --exclude='discovery-manifest.json' \
  --exclude='release-provenance.json' \
  --exclude='rss.xml' \
  --exclude='rss-en.xml' \
  --exclude='sitemap.xml' \
  --exclude='llms.txt' \
  "$SOURCE_DIR/" "$TARGET_DIR/"

# public/ sisältää sekä generoituja sisältöartefakteja että sovelluksen staattisia
# runtime-tiedostoja. Sisältöpuoli jätetään koskematta, mutta 1.18.3:n muuttuneet
# admin/PWA-runtime-peilit synkronoidaan eksplisiittisellä allowlistillä.
PUBLIC_RUNTIME_ASSETS=(
  admin.html
  admin.js
  admin-shell.js
  admin-shell.css
  admin-workspaces.js
  admin-mancer.js
  admin-narramancer.js
  admin-archive.js
  admin-archive.css
  admin-nanomancer.js
  admin-responsive.css
  admin-feedback.js
  lahetyskone-sw.js
)
mkdir -p "$TARGET_DIR/public"
for asset in "${PUBLIC_RUNTIME_ASSETS[@]}"; do
  if [[ -f "$SOURCE_DIR/public/$asset" ]]; then
    rsync -a --backup --backup-dir="$BACKUP_REL" "$SOURCE_DIR/public/$asset" "$TARGET_DIR/public/$asset"
  fi
done

cd "$TARGET_DIR"
npm run check

CONTENT_AFTER="$(content_fingerprint "$TARGET_DIR")"
CONTENT_COUNT_AFTER="$(find "$TARGET_DIR/content" -type f -name '*.md' 2>/dev/null | wc -l | tr -d ' ')"
if [[ "$CONTENT_BEFORE" != "$CONTENT_AFTER" || "$CONTENT_COUNT_BEFORE" != "$CONTENT_COUNT_AFTER" ]]; then
  echo "VIRHE: content/-sisältö muuttui tarkistuksen aikana. Älä deployaa; tarkista git diff." >&2
  exit 1
fi

echo "✓ Anomancer 1.18.3 Codemancer Workbench asennettu ja tarkistettu."
echo "✓ content/ säilyi identtisenä: $CONTENT_COUNT_AFTER Markdown-tiedostoa."
echo "✓ Korvatut tiedostot ovat palautettavissa: $TARGET_DIR/$BACKUP_REL"
if [[ -d .git ]]; then
  echo "Seuraava vaihe: tarkista git status ja tee commit vasta oman katselmoinnin jälkeen."
fi
