#!/usr/bin/env bash
set -euo pipefail

REPO="Anomancer/Anomancer"
BRANCH="master"
REQUIRED_CHECK="Release Gate"

command -v gh >/dev/null 2>&1 || { echo "VIRHE: gh CLI puuttuu." >&2; exit 1; }
gh auth status >/dev/null 2>&1 || { echo "VIRHE: gh ei ole autentikoitu." >&2; exit 1; }

PROTECTION_JSON="$(gh api -H "Accept: application/vnd.github+json" "repos/$REPO/branches/$BRANCH/protection")"
PROTECTION_JSON="$PROTECTION_JSON" REQUIRED_CHECK="$REQUIRED_CHECK" node <<'NODE'
const p=JSON.parse(process.env.PROTECTION_JSON||'{}');
const required=process.env.REQUIRED_CHECK;
const enabled=value=>value===true||value?.enabled===true;
const fail=message=>{console.error(`VIRHE: ${message}`);process.exit(1);};
const checks=[...(p.required_status_checks?.contexts||[]),...(p.required_status_checks?.checks||[]).map(x=>x.context)];
if(p.required_status_checks?.strict!==true) fail('required status checks eivät ole strict');
if(!checks.includes(required)) fail(`${required} ei ole pakollinen status check`);
if(!enabled(p.enforce_admins)) fail('protection ei koske admineita');
if(!p.required_pull_request_reviews) fail('pull request -vaatimus puuttuu');
if(Number(p.required_pull_request_reviews.required_approving_review_count)!==0) fail('solo-maintainer approval count ei ole 0');
if(!enabled(p.required_conversation_resolution)) fail('conversation resolution ei ole pakollinen');
if(enabled(p.allow_force_pushes)) fail('force push on sallittu');
if(enabled(p.allow_deletions)) fail('branch deletion on sallittu');
console.log(`✓ GitHub governance: master protected · PR required · ${required} required · admins enforced · force/delete blocked`);
NODE
