#!/usr/bin/env bash
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET="${1:-$HOME/GitHub/Anomancer}"
if [[ ! -d "$TARGET/.git" || ! -f "$TARGET/package.json" ]]; then
  echo "Virhe: kohde ei näytä Anomancer-git-repolta: $TARGET" >&2
  exit 2
fi
rsync -av "$HERE/files/" "$TARGET/"
cd "$TARGET"
npm install
npm run check
echo "✓ Anomancer 15.1.0 Public Core overlay asennettu ja testattu."
