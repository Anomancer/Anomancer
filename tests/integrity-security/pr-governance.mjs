import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=path=>fs.readFileSync(path,'utf8');
const workflow=read('.github/workflows/pr-release-gate.yml');
const capability=read('.github/workflows/anomancer-capability-gate.yml');
const enable=read('scripts/governance/enable-master-protection.sh');
const verify=read('scripts/governance/verify-master-protection.sh');
let ok=0;
const test=(name,fn)=>{fn();ok++;console.log(`✓ PR GOVERNANCE · ${name}`);};

test('PR workflow targets master with a stable Release Gate context',()=>{
  assert.match(workflow,/name: PR Release Gate/);
  assert.match(workflow,/on:\n  pull_request:\n    branches:\n      - master/);
  assert.match(workflow,/jobs:\n  release-gate:\n    name: Release Gate/);
  assert.doesNotMatch(workflow,/pull_request_target|workflow_dispatch|\n  push:/);
});

test('PR workflow token is read-only and checkout cannot persist credentials',()=>{
  assert.match(workflow,/permissions:\n  contents: read/);
  assert.match(workflow,/persist-credentials: false/);
  assert.doesNotMatch(workflow,/contents:\s*write|pull-requests:\s*write|id-token:\s*write/);
});

test('PR workflow runs locked install before the complete release gate',()=>{
  assert.match(workflow,/actions\/setup-node@v4/);
  assert.match(workflow,/node-version: 22/);
  assert.match(workflow,/CHROMIUM_BIN/);
  const install=workflow.indexOf('run: npm ci');
  const gate=workflow.indexOf('run: npm run check');
  assert.ok(install>=0&&gate>install,'npm ci pitää ajaa ennen npm run check -porttia');
});

test('PR workflow has no deployment or secret authority',()=>{
  assert.doesNotMatch(workflow,/secrets\.|VERCEL_|vercel@|\bdeploy\b|\bproduction\b|\brollback\b/);
});

test('operation capability workflow remains separate and explicitly dispatched',()=>{
  assert.match(capability,/workflow_dispatch:/);
  assert.doesNotMatch(capability,/\n  pull_request:/);
});

test('master protection activation is explicit, PR-bound and fail-closed',()=>{
  assert.match(enable,/ANOMANCER_PROTECTION_CONFIRM/);
  assert.match(enable,/Anomancer\/Anomancer/);
  assert.match(enable,/Release Gate/);
  assert.match(enable,/gh pr list/);
  assert.ok(enable.includes('--head "$CURRENT_BRANCH"'));
  assert.ok(enable.includes('--base "$BRANCH"'));
  assert.match(enable,/check-runs/);
  assert.match(enable,/"strict": true/);
  assert.match(enable,/"enforce_admins": true/);
  assert.match(enable,/"required_pull_request_reviews": \{/);
  assert.match(enable,/"required_approving_review_count": 0/);
  assert.match(enable,/"allow_force_pushes": false/);
  assert.match(enable,/"allow_deletions": false/);
  assert.match(enable,/"required_conversation_resolution": true/);
});

test('governance verification checks required status, PR rule and destructive-operation guards',()=>{
  assert.match(verify,/required_status_checks/);
  assert.match(verify,/required_pull_request_reviews/);
  assert.match(verify,/required_conversation_resolution/);
  assert.match(verify,/allow_force_pushes/);
  assert.match(verify,/allow_deletions/);
  assert.match(verify,/Release Gate/);
});

console.log(`\n${ok}/${ok} PR GOVERNANCE -porttia läpi`);
