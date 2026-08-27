import assert from 'node:assert/strict';
import fs from 'node:fs';
import { CORE_VERSION } from '../server/core-registry.js';
import { ANOMANCER_TEMPLATE_ID, NARRAMANCER_TEMPLATE_ID, getWorkspaceTemplate } from '../server/workspace-templates.js';

let passed=0;
async function test(name,fn){try{await fn();passed++;console.log(`✓ ${name}`);}catch(error){console.error(`✗ ${name}`);throw error;}}
const read=file=>fs.readFileSync(file,'utf8');
const pkg=JSON.parse(read('package.json'));
const html=read('admin.html');
const shell=read('admin-shell.js');
const workspaces=read('admin-workspaces.js');
const narramancer=read('admin-narramancer.js');
const build=read('scripts/build-blog.mjs');
const worker=read('lahetyskone-sw.js');
const installer=read('INSTALL_TO_CURRENT.sh');

await test('Core ja paketti säilyttävät Navigation Shell 16.7 -arkkitehtuurin 16.7.1:ssä',()=>{
  assert.equal(pkg.version,'16.7.1');
  assert.equal(CORE_VERSION,'16.7.1');
  assert.match(html,/ANOMANCER CORE/);
  assert.match(html,/16\.7\.1 · navigation shell/);
});

await test('Core Shell on pysyvä globaali navigaatiokerros',()=>{
  for(const route of ['workspaces','dispatches','artifacts','machine'])assert.match(html,new RegExp(`data-shell-route="${route}"`));
  assert.match(html,/id="coreSettingsButton"/);
  assert.match(html,/id="workspaceContextKicker"/);
  assert.match(html,/id="workspaceSelect"/);
  assert.match(html,/id="orchestraSelect"/);
  assert.match(html,/id="workspaceSaveIndicator"/);
});

await test('Työtilat, Artefaktit ja Konehuone ovat omia Core-surfaceja',()=>{
  for(const view of ['workspaces','artifacts','machine'])assert.match(html,new RegExp(`data-shell-view="${view}"`));
  assert.match(html,/id="workspaceHomeCards"/);
  assert.match(html,/id="artifactHomeSummary"/);
  assert.match(html,/id="coreMachineHost"/);
  assert.match(shell,/machineHost\.appendChild\(corePanel\)/);
});

await test('Konehuone ei ole enää Anomancer-editorin paikallinen tabi',()=>{
  assert.doesNotMatch(html,/data-editor-tab="core"/);
  assert.match(shell,/navigate\('machine'\)|route==='machine'|showCoreView\(route\)/);
});

await test('Anomancerin paikallisnavigaatio tulee Workspace Templaten metadatasta',()=>{
  const t=getWorkspaceTemplate(ANOMANCER_TEMPLATE_ID);
  assert.deepEqual(t.editorDefinition.navigation.groups.map(g=>[g.label,...g.items]),[
    ['Luo','write'],['Tarkista','evidence','agents'],['Ulos','publish']
  ]);
  assert.deepEqual(t.editorDefinition.sections.map(s=>s.id),['write','evidence','agents','publish']);
});

await test('Narramancerin paikallisnavigaatio on ryhmitelty metadataan eikä kovakoodattu shelliin',()=>{
  const t=getWorkspaceTemplate(NARRAMANCER_TEMPLATE_ID);
  assert.deepEqual(t.editorDefinition.navigation.groups.map(g=>[g.label,...g.items]),[
    ['Luo','project','world','characters','plot'],
    ['Kirjoita','chapters','timeline','canon'],
    ['Jalosta','orchestra'],
    ['Ulos','export']
  ]);
  assert.match(shell,/template\(\)\?\.editorDefinition/);
  assert.match(shell,/group\.items/);
  assert.doesNotMatch(shell,/\['project','world','characters','plot'/);
});

await test('Työtilakortti on ensisijainen kotipesä ja dropdown vain pikavaihtaja',()=>{
  assert.match(html,/id="workspaceHomeNew"/);
  assert.match(workspaces,/workspaceHomeCards/);
  assert.match(workspaces,/Avaa työtila/);
  assert.match(workspaces,/Vaihda ja avaa/);
  assert.match(workspaces,/workspaceSelect/);
});

await test('Navigointi ei ohita tallentamattomien muutosten workspace-porttia',()=>{
  assert.match(shell,/const switched=window\.anomancerWorkspaces\?\.switchTo\?\.\('default'\)/);
  assert.match(shell,/if\(!switched\)\{setRouteButtons\(\);return false;\}/);
  assert.match(workspaces,/if\(changed\)window\.anomancerShell\?\.navigate/);
});

await test('Narramancer-orkesteri näyttää vaiheet ja säilyttää session checkpointin jatkamista varten',()=>{
  assert.match(narramancer,/runCheckpoint/);
  assert.match(narramancer,/narramancerResume/);
  assert.match(narramancer,/Jatka vaiheesta/);
  assert.match(narramancer,/data-narrative-stage/);
  assert.match(narramancer,/NARRAMANCER_STAGE_PAUSED/);
  assert.match(narramancer,/Runtime Snapshot/);
});

await test('16.7 shell stageataan buildiin ja PWA-cacheen',()=>{
  assert.match(html,/admin-shell\.js/);
  assert.match(build,/admin-shell\.js/);
  assert.match(worker,/admin-shell\.js/);
  assert.match(worker,/v16\.7\.1/);
});

await test('Content-safe asennus ei koske julkaistuihin lähteisiin tai generoituun sisältöön',()=>{
  for(const path of ['content/','media/','public/','lahetykset/','dispatches/'])assert.match(installer,new RegExp(`--exclude='${path.replace('/','\\/')}'`));
  assert.match(installer,/content_fingerprint/);
  assert.match(installer,/CONTENT_BEFORE/);
  assert.match(installer,/CONTENT_AFTER/);
});

await test('Admin HTML:ssa ei ole päällekkäisiä id-arvoja',()=>{
  const ids=[...html.matchAll(/\sid="([^"]+)"/g)].map(m=>m[1]);
  const duplicates=ids.filter((id,i)=>ids.indexOf(id)!==i);
  assert.deepEqual([...new Set(duplicates)],[]);
});

console.log(`\n${passed}/12 NAVIGATION SHELL 16.7 -testiä läpi.`);
