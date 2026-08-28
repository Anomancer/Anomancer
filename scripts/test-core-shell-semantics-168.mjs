import assert from 'node:assert/strict';
import fs from 'node:fs';
import { CORE_VERSION } from '../server/core-registry.js';
import { ANOMANCER_TEMPLATE_ID, BLANK_PRIVATE_TEMPLATE_ID, getWorkspaceTemplate } from '../server/workspace-templates.js';
import { readAdminCss } from './read-admin-css.mjs';

let passed=0;
async function test(name,fn){try{await fn();passed++;console.log(`✓ ${name}`);}catch(error){console.error(`✗ ${name}`);throw error;}}
const read=file=>fs.readFileSync(file,'utf8');
const pkg=JSON.parse(read('package.json'));
const html=read('admin.html');
const shell=read('admin-shell.js');
const css=readAdminCss();
const admin=read('admin.js');
const workspaces=read('admin-workspaces.js');
const worker=read('lahetyskone-sw.js');

await test('Julkaisu ja Core ovat 16.8.4',()=>{
  assert.equal(pkg.version,'1.18.3');
  assert.equal(CORE_VERSION,'1.18.3');
  assert.match(worker,/anomancer-lahetyskone-v1\.18\.3/);
});

await test('Globaali Core Shell sisältää vain globaalit kohteet',()=>{
  const routes=[...html.matchAll(/<button[^>]+data-shell-route="([^"]+)"/g)].map(match=>match[1]);
  assert.deepEqual(routes,['workspaces','workspace','archive','machine']);
  assert.match(html,/>Työtilat</);
  assert.match(html,/>Nykyinen työ</);
  assert.match(html,/>Arkisto</);
  assert.match(html,/>Konehuone</);
  assert.doesNotMatch(html,/data-shell-route="(?:dispatches|artifacts|materials)"/);
});

await test('Anomancerin Lähetyskone-toiminnot tulevat paikallisesta työtilasopimuksesta',()=>{
  const template=getWorkspaceTemplate(ANOMANCER_TEMPLATE_ID);
  assert.deepEqual(template.editorDefinition.sections.map(section=>section.id),['dispatches','write','evidence','agents','orchestra','publish','materials']);
  assert.equal(template.editorDefinition.sections.find(section=>section.id==='dispatches').label,'Lähetykset');
  assert.equal(template.editorDefinition.sections.find(section=>section.id==='orchestra').label,'Orkesteriajo');
  assert.equal(template.editorDefinition.sections.find(section=>section.id==='materials').kind,'shell-surface');
  assert.match(shell,/openDispatchLibrary/);
  assert.match(shell,/openOrchestraRun/);
  assert.match(admin,/openOrchestraRun/);
});

await test('Globaali reitti ei vaihda Anomancer-työtilaan sivuvaikutuksena',()=>{
  assert.doesNotMatch(shell,/next==='dispatches'/);
  assert.doesNotMatch(shell,/switchTo\?\.\('default'\)/);
  assert.match(shell,/\['workspace','workspaces','archive','materials','machine'\]/);
});

await test('Tyhjä yksityinen työtila saa oman turvallisen kotinäkymän',()=>{
  const template=getWorkspaceTemplate(BLANK_PRIVATE_TEMPLATE_ID);
  assert.equal(template.kind,'blank-private');
  assert.equal(template.outputAdapterId,'workspace/no-publication/v1');
  assert.equal(template.capabilities.includes('publication.publish'),false);
  assert.match(html,/id="blankWorkspace"/);
  assert.match(html,/Ei editoria sidottuna/);
  assert.match(shell,/function isBlank\(\)/);
  assert.match(shell,/editorGrid\)editorGrid\.hidden=true/);
  assert.match(css,/data-workspace-template="blank-private"/);
});

await test('Aineisto ja ulostulo pysyvät valitun työtilan paikallisena pintana',()=>{
  assert.match(html,/data-shell-view="materials"/);
  assert.match(shell,/if\(name==='materials'\)renderArtifactHome\(\)/);
  assert.match(shell,/artifactStoreId/);
  assert.match(shell,/outputAdapterId/);
});

await test('Julkaisunumero on siirretty työpinnasta järjestelmätietoihin',()=>{
  for(const legacy of ['16.2 ·','16.3 ·','16.7 ·','navigation shell'])assert.doesNotMatch(html,new RegExp(legacy.replace('.','\\.'),'i'));
  assert.match(html,/Järjestelmätiedot/);
  assert.match(html,/id="systemCoreVersion">1\.18\.3/);
  assert.match(html,/Työtilamalli \+ perustuslaki/);
  assert.match(html,/Yksityinen työpöytä/);
});

await test('Selaintilan avaimet siirtyvät 16.8:aan jatkuvuusmigraatiolla',()=>{
  assert.match(shell,/route\.v16\.8/);
  assert.match(shell,/route\.v16\.7/);
  assert.match(workspaces,/workspace\.v16\.8/);
  assert.match(workspaces,/workspace\.v16\.7/);
});

await test('Dokumentti-identiteetti erottaa Core-työpöydän työtiloista',()=>{
  assert.match(html,/<title>Anomancer Core · Työpöytä<\/title>/);
  assert.match(shell,/:'Lähetyskone'/);
  assert.match(shell,/if\(isNarrative\(\)\)\{window\.anomancerNarramancer\?\.refreshDocumentTitle/);
  assert.match(shell,/document\.title=`Anomancer Core · \$\{name\}`/);
  assert.match(html,/ANOMANCER CORE · YKSITYINEN/);
});

await test('Admin HTML:ssa ei ole päällekkäisiä id-arvoja',()=>{
  const ids=[...html.matchAll(/\sid="([^"]+)"/g)].map(match=>match[1]);
  assert.deepEqual([...new Set(ids.filter((id,index)=>ids.indexOf(id)!==index))],[]);
});

console.log(`\n${passed}/10 CORE SHELL SEMANTICS 16.8.4 -testiä läpi.`);
