import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=file=>fs.readFileSync(file,'utf8');
let passed=0;
const test=async(name,fn)=>{await fn();passed++;console.log(`✓ ${name}`);};

await test('1.18.6 lukitsee live-operaatiot eksplisiittiseen repository-allowlistiin',async()=>{
  process.env.GITHUB_CONTENT_TOKEN='live-path-test-token';
  process.env.GITHUB_REPO='example/allowed';
  process.env.GITHUB_BRANCH='master';
  process.env.ANOMANCER_OPERATION_REQUIRE_ALLOWLIST='1';
  process.env.ANOMANCER_OPERATION_REPO_ALLOWLIST='example/allowed';
  const {githubOperationStatus,getRepositoryHead}=await import('../../server/github.js');
  let status=githubOperationStatus();
  assert.equal(status.repoGuard.required,true);assert.equal(status.repoGuard.allowed,true);
  process.env.GITHUB_REPO='example/blocked';
  status=githubOperationStatus();assert.equal(status.repoGuard.allowed,false);
  await assert.rejects(()=>getRepositoryHead(),error=>error.code==='GITHUB_OPERATION_REPO_NOT_ALLOWED');
  process.env.GITHUB_REPO='example/allowed';
});

await test('testit ja preview sidotaan hyväksyttyyn commit SHA:han, PR säilyttää operation-haaran',async()=>{
  const source=read('server/operation-capabilities.js');
  assert.match(source,/sourceBranch:source\.execution\.branch,sourceRef:source\.execution\.commitSha/);
  assert.match(source,/sourceRef:kind==='deploy\.preview'\?source\.plan\.commitSha:source\.plan\.sourceBranch/);
  assert.match(source,/OPERATION_PR_HEAD_DRIFT/);
});

await test('repository-write tallentaa default-haaran ennen/jälkeen evidenssin',async()=>{
  const github=read('server/github.js');
  assert.match(github,/defaultBranchShaBefore/);assert.match(github,/defaultBranchShaAfter/);assert.match(github,/defaultBranchUnchanged/);
  const capabilities=read('server/operation-capabilities.js');assert.match(capabilities,/drifted/);
});

await test('workflow-evidenssi sidotaan täsmälliseen operation id + mode run-nameen',async()=>{
  const github=read('server/github.js'),workflow=read('.github/workflows/anomancer-capability-gate.yml');
  assert.match(workflow,/run-name: Anomancer \$\{\{ inputs\.operation_id \}\} · \$\{\{ inputs\.mode \}\}/);
  assert.match(github,/expectedTitle=`Anomancer \$\{id\} · \$\{selected\}`/);
  assert.match(github,/evidenceMatched:true/);
});

await test('preview-portti ei saa production-aliasia ensimmäisen deploymentin provider-poikkeuksessa',async()=>{
  const workflow=read('.github/workflows/anomancer-capability-gate.yml');
  assert.match(workflow,/build --target=preview/);
  assert.match(workflow,/deploy --prebuilt --target=preview --skip-domain/);
  assert.match(workflow,/environment: production/);
});

await test('1.18.6 paketti ja Codemancer Package Spec ovat päivittyneet',async()=>{
  const pkg=JSON.parse(read('package.json')),manifest=JSON.parse(read('mancers/codemancer/manifest.json')),gate=read('tests/release-gate.mjs');
  assert.equal(pkg.version,'1.18.6');assert.equal(manifest.version,'1.3.0');assert.match(pkg.scripts.check,/tests\/release-gate\.mjs/);assert.match(gate,/tests\/operations-release\/live-path-verification\.mjs/);
});

console.log(`\n${passed}/${passed} LIVE PATH VERIFICATION 1.18.6 checks passed.`);
