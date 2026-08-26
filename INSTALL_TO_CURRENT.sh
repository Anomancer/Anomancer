#!/usr/bin/env bash
set -euo pipefail

SOURCE="$(cd "$(dirname "$0")" && pwd)"
TARGET="${1:-$HOME/Lataukset/ANOMANCER_V13_2_ADMIN_VISIBILITY_FIX}"

echo "ANOMANCER V13.14 DOMAIN MIGRATION"
echo "SOURCE: $SOURCE"
echo "TARGET: $TARGET"

if [[ ! -f "$TARGET/package.json" ]]; then
  echo "VIRHE: targetista puuttuu package.json: $TARGET" >&2
  exit 1
fi

if ! command -v rsync >/dev/null 2>&1; then
  echo "VIRHE: rsync puuttuu. Asenna: sudo apt install rsync" >&2
  exit 1
fi

rsync -a --delete \
  --exclude='.git/' \
  --exclude='.vercel/' \
  --exclude='node_modules/' \
  --exclude='.env' \
  --exclude='.env.local' \
  --exclude='.env.production.local' \
  "$SOURCE/" "$TARGET/"

cd "$TARGET"
npm run build
npm run check

echo
echo "✓ V13.14 asennettu nykyiseen projektiin."
if [[ -d .git ]]; then
  echo "✓ .git säilyi. Seuraava totuusliike:"
  echo "  git status"
  echo "  git add -A && git commit -m 'ANOMANCER 13.14 domain migration' && git push origin master"
else
  echo "! Tässä targetissa ei ole .git-kansiota. Älä julkaise CMS:llä ennen kuin GitHub-repo on synkattu."
fi
