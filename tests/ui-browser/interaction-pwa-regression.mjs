import assert from 'node:assert/strict';
import fs from 'node:fs';

let passed=0;
const read=file=>fs.readFileSync(file,'utf8');
const pkg=JSON.parse(read('package.json'));
const css=read('admin-mancer.css');
const responsive=read('admin-responsive.css');
const html=read('admin.html');
const sw=read('lighthouse-sw.js');
const pwa=read('lighthouse-pwa.js');
const mancer=read('admin-mancer.js');
const installer=read('INSTALL_TO_CURRENT.sh');
async function test(name,fn){try{await fn();passed++;console.log(`✓ ${name}`);}catch(error){console.error(`✗ ${name}`);throw error;}}

await test('kaikki Mancer-polkuohjaimet käyttävät yhteistä tokenoitua kontrolliprimitiiviä',()=>{
  assert.match(css,/#mancerPanel :is\(input,select,textarea\)\[data-mancer-path\]/);
  assert.match(css,/\[data-mancer-path\]:focus-visible/);
  assert.match(css,/\[data-mancer-path\]:disabled/);
  assert.match(css,/\.mancer-form :is\(input,select,textarea\)/);
});

await test('Workbenchin dynaamisilla toiminnoilla on delegoidut action-handlerit',()=>{
  for(const action of ['data-mancer-select-item','data-mancer-add','data-mancer-remove','data-mancer-undo','data-mancer-runs-refresh','data-mancer-machine']) assert.ok(mancer.includes(action),action);
  assert.match(mancer,/#mancerPanel[^\n]*addEventListener\('click'/);
});

await test('kapea Core-nav käyttää lyhyitä semanttisia label-varianteja ilman DOM-duplikaattia',()=>{
  for(const pair of [['workspaces','Mancerit'],['workspace','Työ'],['archive','Arkisto'],['machine','Kone']]){
    assert.match(html,new RegExp(`data-shell-route="${pair[0]}"[^>]+data-short-label="${pair[1]}"`));
  }
  assert.match(responsive,/@media\(max-width:420px\)[\s\S]*?\.core-shell-nav button\[data-short-label\]/);
  assert.match(responsive,/content:attr\(data-short-label\)/);
});

await test('PWA shell käyttää network-firstia eikä vanhaa cache-first split-brainia',()=>{
  const releaseVersion=pkg.version.match(/^(\d+\.\d+\.\d+)/)?.[1];
  assert.ok(releaseVersion,'package semver missing');
  const cacheVersionPattern=new RegExp(`anomancer-lighthouse-v${releaseVersion.replace(/\./g,'\\.')}-[a-z0-9]+`);
  assert.match(sw,cacheVersionPattern);
  assert.match(sw,/if \(!SHELL_URLS\.includes\(url\.pathname\)\) return;[\s\S]*?fetch\(request\)[\s\S]*?\.catch\(\(\) => caches\.match\(request\)\)/);
  assert.doesNotMatch(sw,/caches\.match\(request\)\.then\(cached => cached \|\| fetch\(request\)/);
});

await test('service worker haetaan verkosta ja aktiivisen workerin vaihto käsitellään',()=>{
  assert.match(pwa,/updateViaCache: 'none'/);
  assert.match(pwa,/registration\.update\(\)/);
  assert.match(pwa,/addEventListener\('controllerchange'/);
});

await test('PWA ei reloadaa dirty-työtä uuden version alta',()=>{
  assert.match(pwa,/hasAnyUnsavedChanges/);
  assert.match(pwa,/hasUnsavedChanges/);
  assert.match(pwa,/Uusi sovellusversio on valmis\. Tallenna työ ja päivitä sivu\./);
  assert.match(pwa,/window\.location\.reload\(\)/);
  assert.doesNotMatch(pwa,/localStorage|sessionStorage|indexedDB/);
});

await test('hotfix ei lisää komponentti-CSS:ään uusia media queryja',()=>{
  for(const file of ['admin-shell.css','admin-workspace.css','admin-editorial.css','admin-narrative.css','admin-control-plane.css','admin-archive.css','admin-nanomancer.css','admin-mancer.css']){
    assert.doesNotMatch(read(file),/@media\s*\(/,file);
  }
});

await test('PWA:n feedback-pinta käyttää olemassa olevaa yhteistä feedback-kanavaa',()=>{
  assert.match(pwa,/window\.anomancerFeedback\?\.show/);
  assert.match(read('admin-feedback.js'),/window\.anomancerFeedback/);
});

await test('content-safe installer synkronoi lähdepuun ja ajaa regressioportin',()=>{
  assert.match(installer,/rsync -a --delete/);
  assert.match(installer,/--exclude='content\/'/);
  assert.match(installer,/--exclude='media\/'/);
  const installMatch=installer.match(/npm\s+(?:ci|install)(?:\s+--include=dev)?/);
  const installPos=installMatch?.index ?? -1;
  const checkPos=installer.indexOf('npm run check');
  assert.ok(installPos >= 0 && checkPos > installPos, 'installer order must be npm ci/install -> check');
});

console.log(`\n${passed}/9 INTERACTION + CSS HOTFIX 1.18.4 checks passed.`);
