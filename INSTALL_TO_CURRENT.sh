#!/usr/bin/env bash
set -euo pipefail

SOURCE_DIR="$(cd "$(dirname "$0")" && pwd)"
TARGET_DIR="${1:-$HOME/Anomancer/Anomancer}"
MODE="${2:-}"
BACKUP_ROOT="${ANOMANCER_BACKUP_DIR:-$HOME/.anomancer-backups}"

if [[ "$MODE" != "" && "$MODE" != "--deploy" ]]; then
  echo "Käyttö: ./INSTALL_TO_CURRENT.sh [/polku/Anomancer] [--deploy]" >&2
  exit 2
fi
if [[ ! -d "$TARGET_DIR" || ! -f "$TARGET_DIR/package.json" ]]; then
  echo "VIRHE: kohteesta puuttuu Anomancerin package.json: $TARGET_DIR" >&2
  exit 1
fi
for cmd in rsync node npm sha256sum tar; do
  command -v "$cmd" >/dev/null 2>&1 || { echo "VIRHE: $cmd puuttuu." >&2; exit 1; }
done

TARGET_DIR="$(cd "$TARGET_DIR" && pwd)"
if [[ "$TARGET_DIR" == "/" || "$TARGET_DIR" == "$SOURCE_DIR" ]]; then
  echo "VIRHE: lähde ja kohde eivät saa olla sama hakemisto." >&2
  exit 1
fi

PACKAGE_NAME="$(node -p "require(process.argv[1]).name || ''" "$TARGET_DIR/package.json")"
if [[ "$PACKAGE_NAME" != "anomancer-lahetyskone" ]]; then
  echo "VIRHE: kohde ei ole Anomancer (package name: $PACKAGE_NAME)." >&2
  exit 1
fi

fingerprint_dir() {
  local root="$1" rel="$2"
  if [[ ! -d "$root/$rel" ]]; then echo "missing"; return; fi
  find "$root/$rel" -type f -print0 | LC_ALL=C sort -z | xargs -0 -r sha256sum | sha256sum | awk '{print $1}'
}

# Compatibility name retained for the content-safe installer contract.
content_fingerprint() { fingerprint_dir "$@"; }

CONTENT_BEFORE="$(content_fingerprint "$TARGET_DIR" content)"
MEDIA_BEFORE="$(content_fingerprint "$TARGET_DIR" media)"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$BACKUP_ROOT"
BACKUP_FILE="$BACKUP_ROOT/anomancer-before-1.25.0-$TIMESTAMP.tar.gz"

echo "ANOMANCER 1.25.0 · UI ARCHITECTURE HARDENING · PRESERVE GIT"
echo "Lähde: $SOURCE_DIR"
echo "Kohde: $TARGET_DIR"
echo "Turvakopio: $BACKUP_FILE"

tar -C "$TARGET_DIR" -czf "$BACKUP_FILE" \
  --exclude='./node_modules' \
  --exclude='./public' \
  --exclude='./.anomancer-backups' \
  --exclude='./.visual-regression' \
  --exclude='./test-results' \
  .

# Poista vain generoidut/release-tulokset. Git- ja GitHub-metadata säilytetään.
rm -rf \
  "$TARGET_DIR/.anomancer-backups" \
  "$TARGET_DIR/.visual-regression" \
  "$TARGET_DIR/test-results" \
  "$TARGET_DIR/public" \
  "$TARGET_DIR/node_modules"

# Asenna nykyinen lähdepuu. Git/GitHub, aineisto, salaisuudet, paikallinen state ja Vercel-linkitys säilyvät.
rsync -a --delete \
  --exclude='.vercel/' \
  --exclude='.env' \
  --exclude='.env.*' \
  --exclude='.anomancer/state/' \
  --exclude='content/' \
  --exclude='media/' \
  --exclude='/public/' \
  --exclude='node_modules/' \
  --exclude='.git/' \
  --exclude='.github/' \
  --exclude='.anomancer-backups/' \
  --exclude='test-results/' \
  --exclude='lahetykset/' \
  --exclude='dispatches/' \
  "$SOURCE_DIR/" "$TARGET_DIR/"

# Source boundary: these root files are compatibility aliases, never independent copies.
# Recreate them after extraction/rsync so ZIP tools that dereference symlinks cannot break the build contract.
rm -f \
  "$TARGET_DIR/index.html" \
  "$TARGET_DIR/en.html" \
  "$TARGET_DIR/core.html" \
  "$TARGET_DIR/core-en.html"
ln -s site/pages/index.html "$TARGET_DIR/index.html"
ln -s site/pages/en.html "$TARGET_DIR/en.html"
ln -s site/pages/core.html "$TARGET_DIR/core.html"
ln -s site/pages/core-en.html "$TARGET_DIR/core-en.html"

cd "$TARGET_DIR"
npm ci --include=dev
npm run check

CONTENT_AFTER="$(content_fingerprint "$TARGET_DIR" content)"
MEDIA_AFTER="$(content_fingerprint "$TARGET_DIR" media)"
if [[ "$CONTENT_BEFORE" != "$CONTENT_AFTER" ]]; then
  echo "VIRHE: content/ muuttui. Älä deployaa. Turvakopio: $BACKUP_FILE" >&2
  exit 1
fi
if [[ "$MEDIA_BEFORE" != "$MEDIA_AFTER" ]]; then
  echo "VIRHE: media/ muuttui. Älä deployaa. Turvakopio: $BACKUP_FILE" >&2
  exit 1
fi

echo "✓ content/ säilyi identtisenä."
echo "✓ media/ säilyi identtisenä."
echo "✓ Release gate läpi."
echo "✓ Turvakopio: $BACKUP_FILE"

if [[ "$MODE" == "--deploy" ]]; then
  command -v vercel >/dev/null 2>&1 || { echo "VIRHE: Vercel CLI puuttuu." >&2; exit 1; }
  vercel --prod
else
  echo "Tuotantoon: cd '$TARGET_DIR' && npm run deploy:prod"
fi
