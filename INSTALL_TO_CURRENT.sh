#!/usr/bin/env bash
set -euo pipefail

SOURCE_DIR="$(cd "$(dirname "$0")" && pwd)"
TARGET_DIR="${1:-}"
MODE="${2:-}"

if [[ -z "$TARGET_DIR" ]]; then
  echo "Käyttö: ./INSTALL_TO_CURRENT.sh /täysi/polku/anomancer-projektiin [--delete-stale]" >&2
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

echo "ANOMANCER 14.2 · SAFE INSTALL"
echo "Lähde: $SOURCE_DIR"
echo "Kohde: $TARGET_DIR"
echo "Varmuuskopio: $TARGET_DIR/$BACKUP_REL"

rsync -a --itemize-changes --backup --backup-dir="$BACKUP_REL" "${DELETE_ARGS[@]}" \
  --exclude='.git/' \
  --exclude='.vercel/' \
  --exclude='node_modules/' \
  --exclude='.anomancer-backups/' \
  --exclude='.env' \
  --exclude='.env.*' \
  "$SOURCE_DIR/" "$TARGET_DIR/"

cd "$TARGET_DIR"
npm run check

echo "✓ Anomancer 14.2 asennettu ja tarkistettu."
echo "✓ Korvatut tiedostot ovat palautettavissa: $TARGET_DIR/$BACKUP_REL"
if [[ -d .git ]]; then
  echo "Seuraava vaihe: tarkista git status ja tee commit vasta oman katselmoinnin jälkeen."
fi
