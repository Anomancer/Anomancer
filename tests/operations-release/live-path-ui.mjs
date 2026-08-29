import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=file=>fs.readFileSync(file,'utf8');
let passed=0;const test=(name,fn)=>{fn();passed++;console.log(`✓ ${name}`);};

test('Operation Console näyttää live-repo-lukon ja koko polun portit',()=>{
  const ui=read('admin-operations.js');
  assert.match(ui,/Live-repo-lukko/);assert.match(ui,/ANOMANCER_OPERATION_REPO_ALLOWLIST/);assert.match(ui,/operation-live-path/);
  for(const label of ['Repository','Tests','PR','Preview','Production','Rollback'])assert.match(ui,new RegExp(`'${label}'`));
});

test('plan ja execution evidenssi näkyvät käyttöliittymässä',()=>{
  const ui=read('admin-operations.js');
  for(const term of ['Plan hash','Artefakti','Default ennen','Default jälkeen','Workflow run','Workflow-sidonta','PR head','Merge SHA'])assert.match(ui,new RegExp(term));
  assert.match(ui,/operation-evidence/);assert.match(ui,/defaultBranchUnchanged/);
});

test('drift sulkee testipolun ja tarjoaa vain operation-haaran palautuksen',()=>{
  const ui=read('admin-operations.js');
  assert.match(ui,/drifted:'Pohjahaara muuttui'/);assert.match(ui,/operation\.status==='drifted'/);assert.match(ui,/Palauta operation-haara/);
});

test('live-polku reflowaa puhelimella yhteisen breakpointin sisällä',()=>{
  const component=read('admin-mancer.css'),responsive=read('admin-responsive.css');
  assert.match(component,/operation-live-path/);assert.match(component,/operation-evidence/);assert.match(responsive,/operation-live-path\{grid-template-columns:repeat\(2/);assert.match(responsive,/operation-evidence dl\{grid-template-columns:1fr/);
});

console.log(`\n${passed}/${passed} LIVE PATH UI 1.18.6 checks passed.`);
