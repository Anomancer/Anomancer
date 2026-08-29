import assert from 'node:assert/strict';
import fs from 'node:fs';
import { CORE_VERSION } from '../../server/core-registry.js';
import { readAdminCss } from '../../scripts/read-admin-css.mjs';

let passed=0;
async function test(name,fn){try{await fn();passed++;console.log(`✓ ${name}`);}catch(error){console.error(`✗ ${name}`);throw error;}}
const read=file=>fs.readFileSync(file,'utf8');
const pkg=JSON.parse(read('package.json'));
const html=read('admin.html');
const css=readAdminCss();
const worker=read('lahetyskone-sw.js');
const installer=read('INSTALL_TO_CURRENT.sh');

await test('Core ja paketti ovat 16.8.4 ja säilyttävät 16.7.1 Visual Hardeningin',()=>{
  assert.equal(pkg.version,'1.18.6');
  assert.equal(CORE_VERSION,'1.18.6');
  assert.match(html,/Yksityinen työpöytä/);
});

await test('Vanhan 320px app-gridin vuoto Core Shelliin on eksplisiittisesti nollattu',()=>{
  assert.match(css,/Navigation Shell Visual Hardening/);
  assert.match(css,/\.app\{[\s\S]*?grid-template-columns:minmax\(0,1fr\)/);
  assert.match(css,/\.core-shell,\.workspace\{grid-column:1\/-1/);
});

await test('Core Shellillä on selkeä kolmitasoinen desktop-hierarkia',()=>{
  assert.match(css,/\.core-shell\{[\s\S]*?grid-template-columns:minmax\(220px,auto\) minmax\(0,1fr\) auto/);
  assert.match(css,/\.core-shell-nav\{[\s\S]*?border-radius:12px/);
  assert.match(css,/\.core-shell-nav button\.active\{[\s\S]*?inset 0 -2px 0/);
  assert.match(css,/\.core-shell \.connection-state\{[\s\S]*?border-radius:999px/);
});

await test('Workspace Context Bar erottaa kontekstin ja kontrollit',()=>{
  assert.match(css,/\.workspace-context-bar\{[\s\S]*?grid-template-columns:minmax\(280px,1fr\) auto/);
  assert.match(css,/\.workspace-switcher\.orchestra-switcher\{min-width:250px/);
  assert.match(css,/\.workspace-save-indicator\{[\s\S]*?color:#9bdcad/);
});

await test('Konehuone käyttää hallittua sisältöleveyttä ja seitsemän mittarin desktop-riviä',()=>{
  assert.match(css,/--shell-content-max:1480px/);
  assert.match(css,/#coreMachineHost \.core-metrics\{grid-template-columns:repeat\(7,minmax\(0,1fr\)\)/);
  assert.match(css,/#coreMachineHost \.workspace-contract-summary\{[\s\S]*?grid-template-columns:minmax\(0,1fr\)/);
});

await test('Responsiivinen mittarirytmi laskee hallitusti',()=>{
  assert.match(css,/@media\(max-width:1220px\)[\s\S]*?core-metrics\{grid-template-columns:repeat\(4/);
  assert.match(css,/@media\(max-width:980px\)[\s\S]*?core-metrics\{grid-template-columns:repeat\(3/);
  assert.match(css,/@media\(max-width:760px\)[\s\S]*?core-metrics\{grid-template-columns:repeat\(2/);
});

await test('Mobiilissa shell palaa yhteen sarakkeeseen eikä amputoi asetuksia',()=>{
  assert.match(css,/@media\(max-width:760px\)[\s\S]*?\.app\{grid-template-columns:minmax\(0,1fr\)/);
  assert.match(html,/id="mobileSettingsBtn"/);
  assert.match(html,/id="mobileSaveBtn"/);
  assert.match(html,/id="mobilePublishBtn"/);
});

await test('PWA-cache bustataan 16.8.4:een',()=>{
  assert.match(worker,/v1\.18\.6-p1/);
});

await test('Content-safe installer säilyttää sisältö- ja julkaisurajat',()=>{
  for(const path of ['content/','media/','public/','lahetykset/','dispatches/'])assert.match(installer,new RegExp(`--exclude='${path.replace('/','\\/')}'`));
  assert.match(installer,/CONTENT_BEFORE/);
  assert.match(installer,/CONTENT_AFTER/);
});

await test('Admin HTML:ssa ei ole päällekkäisiä id-arvoja',()=>{
  const ids=[...html.matchAll(/\sid="([^"]+)"/g)].map(m=>m[1]);
  assert.deepEqual([...new Set(ids.filter((id,i)=>ids.indexOf(id)!==i))],[]);
});

console.log(`\n${passed}/10 NAVIGATION SHELL VISUAL HARDENING -regressiotestiä läpi.`);
