#!/usr/bin/env bash
set -euo pipefail

REPO="Anomancer/Anomancer"
BRANCH="master"
REQUIRED_CHECK="Release Gate"

if [[ "${ANOMANCER_PROTECTION_CONFIRM:-}" != "YES" ]]; then
  echo "VIRHE: master-protection vaatii eksplisiittisen ANOMANCER_PROTECTION_CONFIRM=YES vahvistuksen." >&2
  exit 2
fi

command -v gh >/dev/null 2>&1 || { echo "VIRHE: gh CLI puuttuu." >&2; exit 1; }
gh auth status >/dev/null 2>&1 || { echo "VIRHE: gh ei ole autentikoitu." >&2; exit 1; }

CURRENT_BRANCH="$(git branch --show-current 2>/dev/null || true)"
if [[ -z "$CURRENT_BRANCH" || "$CURRENT_BRANCH" == "$BRANCH" ]]; then
  echo "VIRHE: aja tämä Phase 6 PR-haaralta ennen mergeä, ei masterilta." >&2
  exit 1
fi

PR_NUMBER="$(gh pr list --repo "$REPO" --head "$CURRENT_BRANCH" --base "$BRANCH" --state open --json number,isDraft --jq '.[] | select(.isDraft==false) | .number' | head -n1)"
if [[ -z "$PR_NUMBER" ]]; then
  echo "VIRHE: nykyiselle haaralle ei löytynyt avointa ei-draft PR:ää masteriin." >&2
  exit 1
fi

HEAD_SHA="$(gh pr view "$PR_NUMBER" --repo "$REPO" --json headRefOid --jq '.headRefOid')"
CHECK_CONCLUSION="$(gh api "repos/$REPO/commits/$HEAD_SHA/check-runs" --jq '.check_runs[] | select(.name=="Release Gate") | .conclusion' | head -n1)"
CHECK_APP_ID="$(gh api "repos/$REPO/commits/$HEAD_SHA/check-runs" --jq '.check_runs[] | select(.name=="Release Gate" and .conclusion=="success") | .app.id' | head -n1)"

if [[ "$CHECK_CONCLUSION" != "success" || -z "$CHECK_APP_ID" ]]; then
  echo "VIRHE: PR #$PR_NUMBER ei vielä sisällä onnistunutta Release Gate -checkiä. Protectionia ei muuteta." >&2
  exit 1
fi

MASTER_SHA="$(gh api "repos/$REPO/branches/$BRANCH" --jq '.commit.sha')"
echo "Aktivoidaan master-protection"
echo "Repo: $REPO"
echo "Master: $MASTER_SHA"
echo "PR: #$PR_NUMBER"
echo "PR head: $HEAD_SHA"
echo "Required check: $REQUIRED_CHECK · GitHub App id $CHECK_APP_ID"

gh api --method PUT \
  -H "Accept: application/vnd.github+json" \
  "repos/$REPO/branches/$BRANCH/protection" \
  --input - <<JSON >/dev/null
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["$REQUIRED_CHECK"]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": false,
    "require_code_owner_reviews": false,
    "required_approving_review_count": 0,
    "require_last_push_approval": false
  },
  "restrictions": null,
  "required_linear_history": false,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "block_creations": false,
  "required_conversation_resolution": true,
  "lock_branch": false,
  "allow_fork_syncing": false
}
JSON

"$(dirname "$0")/verify-master-protection.sh"
echo "✓ master-protection aktivoitu. PR #$PR_NUMBER voidaan mergeää vasta vaaditun Release Gate -portin läpi."
