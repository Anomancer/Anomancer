import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=file=>fs.readFileSync(file,'utf8');
let passed=0;
const test=(name,fn)=>{fn();passed++;console.log(`✓ ${name}`);};

test('Operations-pinta kuuluu adminiin, buildiin, PWA-kuoreen ja installeriin',()=>{
  const html=read('admin.html'),build=read('scripts/build-blog.mjs'),worker=read('lahetyskone-sw.js'),installer=read('INSTALL_TO_CURRENT.sh');
  assert.match(html,/<script src="\/admin-operations\.js" type="module"><\/script>/);
  assert.match(build,/admin-operations\.js/);assert.match(worker,/\/admin-operations\.js/);assert.match(installer,/admin-operations\.js/);
});

test('Operations UI erottaa plan-, kirjallisen hyväksynnän ja execution-vaiheet',()=>{
  const ui=read('admin-operations.js');
  for(const action of ["action:'plan'","action:'decide'","action:'execute'","action:'refresh'"])assert.match(ui,new RegExp(action.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  assert.match(ui,/confirmationPhrase/);assert.match(ui,/expectedRevision/);assert.match(ui,/Default-haaraa ei kirjoiteta suoraan/);
  assert.match(ui,/lastMessage/);assert.match(ui,/requestEpoch=epoch/);assert.match(ui,/loaded&&loadedWorkspace/);
});

test('operaatio-API vaatii admin-istunnon, CSRF:n, same-originin ja Codemancer-kontekstin',()=>{
  const api=read('server/admin-routes/operations.js'),router=read('api/admin/core.js');
  assert.match(router,/\['operations',operationsHandler\]/);assert.match(api,/getSession/);assert.match(api,/requireCsrf/);assert.match(api,/sameOrigin/);assert.match(api,/OPERATION_CODEMANCER_REQUIRED/);assert.match(api,/readJson\(req,60_000\)/);
});

test('backend ei ota vastaan mielivaltaista komentoa tai kirjoita default-haaraa',()=>{
  const capabilities=read('server/operation-capabilities.js'),github=read('server/github.js');
  assert.doesNotMatch(capabilities,/child_process|execFile|spawn\(|shell\s*:/);assert.doesNotMatch(github,/child_process|execFile|spawn\(/);
  assert.match(github,/safeWorkflowMode/);assert.match(github,/operationBranches:'anomancer\/op-\*'/);assert.match(github,/directDefaultBranchWrite:false/);
  assert.match(github,/refs\/heads\/\$\{branch\}/);assert.doesNotMatch(github,/refs\/heads\/\$\{baseBranch\}[^\n]*method:'PATCH'/);
});

test('GitHub Actions ajaa testit ennen Vercel prebuilt -deployta ja suojaa productionin',()=>{
  const workflow=read('.github/workflows/anomancer-capability-gate.yml');
  assert.match(workflow,/VERCEL_CLI_VERSION: '[0-9]+\.[0-9]+\.[0-9]+'/);assert.match(workflow,/npm run check/);
  assert.match(workflow,/vercel@\$\{VERCEL_CLI_VERSION\} pull/);assert.match(workflow,/vercel@\$\{VERCEL_CLI_VERSION\} build/);assert.match(workflow,/deploy --prebuilt --prod/);
  assert.match(workflow,/environment: production/);assert.match(workflow,/rollback "\$INPUT_ROLLBACK_TARGET"/);assert.match(workflow,/persist-credentials: false/);
  assert.doesNotMatch(workflow,/run:\s*[^\n]*\$\{\{\s*inputs\./);
});

test('mobiilityyli pysyy yhdessä kanonisessa breakpointissa',()=>{
  const component=read('admin-mancer.css'),responsive=read('admin-responsive.css'),heads=[...responsive.matchAll(/@media\s*([^\{]+)\{/g)].map(match=>match[1].replace(/\s+/g,''));
  assert.doesNotMatch(component,/@media\s*\(/);assert.equal(heads.filter(head=>head==='(max-width:760px)').length,1);
  assert.match(responsive,/operation-console-head/);assert.match(responsive,/operation-runtime/);assert.match(responsive,/operation-actions/);
});

test('1.18.7 Package Spec ilmoittaa vain hyväksyntäportilliset sivuvaikutuskyvykkyydet',()=>{
  const pkg=JSON.parse(read('package.json')),manifest=JSON.parse(read('mancers/codemancer/manifest.json')),boundary=JSON.parse(read('mancers/codemancer/artifact-boundary.json'));
  assert.equal(pkg.version,'1.22.0-lighthouse-actuator.1');assert.equal(manifest.version,'1.3.0');
  for(const capability of ['repository.write.approved','tests.run.approved','git.pull-request.approved','deploy.production.approved','repository.rollback.approved','deploy.rollback.approved'])assert.ok(manifest.capabilities.includes(capability));
  for(const forbidden of ['direct-default-branch-write','automatic-pr-merge','arbitrary-command-execution','secret-exposure'])assert.ok(boundary.forbidden.includes(forbidden));
});

console.log(`\n${passed}/${passed} P3 OPERATION UI 1.18.4 checks passed.`);
