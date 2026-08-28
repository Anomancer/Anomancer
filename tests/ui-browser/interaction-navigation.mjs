import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=file=>fs.readFileSync(file,'utf8');
let passed=0;
const test=(name,fn)=>{fn();passed++;console.log(`✓ ${name}`)};

test('URL-state omistaa workspace/view/section-tilan ja selaimen historian',()=>{
  const shell=read('admin-shell.js'),workspaces=read('admin-workspaces.js');
  assert.match(shell,/searchParams\.get\('view'\)/);
  assert.match(shell,/searchParams\.get\('section'\)/);
  assert.match(shell,/searchParams\.set\('workspace'/);
  assert.match(shell,/history\[mode===['"]replace['"]\?['"]replaceState['"]:['"]pushState['"]\]/);
  assert.match(shell,/addEventListener\('popstate'/);
  assert.match(workspaces,/workspaceFromUrl\(\)/);
});

test('paikallinen ja globaali navigaatio ilmaisevat aktiivisen sivun semanttisesti',()=>{
  const shell=read('admin-shell.js');
  assert.match(shell,/aria-current/);
  assert.match(shell,/data-local-section/);
});

test('pitkien työpintojen palaute nousee yhteiseen saavutettavaan status centeriin',()=>{
  const html=read('admin.html'),feedback=read('admin-feedback.js');
  assert.match(html,/id="systemFeedbackCenter"[^>]+role="status"[^>]+aria-live="polite"/);
  assert.match(html,/admin-feedback\.js/);
  assert.match(feedback,/window\.anomancerFeedback/);
  for(const file of ['admin.js','admin-mancer.js','admin-narramancer.js','admin-archive.js','admin-nanomancer.js'])assert.match(read(file),/anomancerFeedback\?\.report/);
});

test('Arkiston puhelinpolku on master → inspector → takaisin',()=>{
  const js=read('admin-archive.js'),componentCss=read('admin-archive.css'),responsive=read('admin-responsive.css');
  assert.match(js,/mobileView='browser'/);
  assert.match(js,/data-archive-back/);
  assert.match(js,/setMobileView\('inspector'/);
  assert.match(componentCss,/archive-mobile-back/);
  assert.match(responsive,/data-mobile-view="browser"/);
  assert.match(responsive,/data-mobile-view="inspector"/);
  assert.match(responsive,/archive-mobile-back/);
});

test('julkisen Coren 9-vaiheinen orkesteri seuraa 3×3 → 2 saraketta → aikajana -sopimusta',()=>{
  const css=read('core.css');
  assert.match(css,/data-step-count="9"\]\{grid-template-columns:repeat\(3,minmax\(0,1fr\)\);overflow:visible\}/);
  assert.match(css,/@media\(max-width:980px\)[\s\S]*data-step-count="9"\]\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)\}/);
  assert.match(css,/@media\(max-width:600px\)[\s\S]*data-step-count="9"\]\{position:relative;grid-template-columns:1fr/);
  assert.match(css,/nth-child\(3\)::after,[\s\S]*nth-child\(6\)::after\{content:"↓"/);
  assert.match(css,/nth-child\(4\)::after,[\s\S]*nth-child\(5\)::after\{content:"←"/);
  assert.match(css,/core-public-stage strong\{[^}]*overflow-wrap:anywhere/);
  assert.match(css,/core-public-stage small\{[^}]*overflow-wrap:anywhere/);
  assert.equal(css,read('public/core.css'),'core.css root/public drift');
});

test('admin-responsive käyttää yhtä kanonista blokkia per mediaehto',()=>{
  const css=read('admin-responsive.css');
  const heads=[...css.matchAll(/@media\s*([^\{]+)\{/g)].map(m=>m[1].replace(/\s+/g,'').toLowerCase());
  const counts=new Map();for(const h of heads)counts.set(h,(counts.get(h)||0)+1);
  assert.equal(counts.get('(max-width:760px)'),1);
  assert.deepEqual([...counts.entries()].filter(([,n])=>n>1),[]);
  assert.match(css,/canonical responsive cascade/);
});

test('safe-area viewport ja juuri/public-peilaus kuuluvat P2-sopimukseen',()=>{
  assert.match(read('admin.html'),/viewport-fit=cover/);
  for(const file of ['admin.html','admin.js','admin-shell.js','admin-shell.css','admin-workspaces.js','admin-mancer.js','admin-narramancer.js','admin-archive.js','admin-archive.css','admin-nanomancer.js','admin-responsive.css','admin-feedback.js'])assert.equal(read(file),read(`public/${file}`),`${file} root/public drift`);
});

test('P2-runtime kuuluu buildiin, PWA-kuoreen ja myöhäinen Mancer saa nykyisen workspace-kontekstin',()=>{
  assert.match(read('scripts/build-blog.mjs'),/admin-feedback\.js/);
  assert.match(read('lahetyskone-sw.js'),/\/admin-feedback\.js/);
  assert.match(read('admin-mancer.js'),/if\(window\.anomancerWorkspaces\?\.current\?\.\(\)\)applyWorkspace/);
  assert.match(read('INSTALL_TO_CURRENT.sh'),/PUBLIC_RUNTIME_ASSETS=/);
});

test('full-app admin story alkaa oikeasta kirjautumisesta ennen työtilapolkua',()=>{
  const story=read('tests/full-app-e2e/admin-workspace-story.mjs');
  assert.match(story,/__P2_AUTHENTICATED=false/);
  assert.match(story,/body\.password!==['"]p2-test-password['"]/);
  assert.match(story,/querySelector\('#loginForm'\)\.requestSubmit\(\)/);
  assert.match(story,/login → URL-työtila → Codemancer Project/);
});

console.log(`\n${passed}/${passed} P2 INTERACTION & NAVIGATION HARDENING -testiä läpi`);
