import assert from 'node:assert/strict';
import fs from 'node:fs';
import { ANOMANCER_TEMPLATE_ID, NARRAMANCER_TEMPLATE_ID, getWorkspaceTemplate } from '../../server/workspace-templates.js';
import { readAdminCss } from '../../scripts/read-admin-css.mjs';

let passed=0;
async function test(name,fn){await fn();passed++;console.log(`✓ ${name}`);}
const read=file=>fs.readFileSync(file,'utf8');
const pkg=JSON.parse(read('package.json'));
const html=read('admin.html');
const shell=read('admin-shell.js');
const overlays=read('admin-overlays.js');
const admin=read('admin.js');
const css=readAdminCss();
const worker=read('lighthouse-sw.js');

await test('16.8.1 kyvykkyydet toimitetaan 16.8.4 full releasessa',()=>{
  assert.match(pkg.version,/^1\.25\./);
  const releaseVersion=pkg.version.match(/^(\d+\.\d+\.\d+)/)?.[1];
  assert.ok(releaseVersion,'package semver missing');
  const cacheVersionPattern=new RegExp(`anomancer-lighthouse-v${releaseVersion.replace(/\./g,'\\.')}-[a-z0-9]+`);
  assert.match(worker,cacheVersionPattern);
  assert.match(worker,/admin-overlays\.js/);
  assert.match(read('scripts/build-blog.mjs'),/'admin-overlays\.js'/);
});

await test('mobiilin ensisijaiset työkalut tulevat Workspace Templatesta',()=>{
  const anomancer=getWorkspaceTemplate(ANOMANCER_TEMPLATE_ID).editorDefinition.navigation.mobilePrimary;
  const narramancer=getWorkspaceTemplate(NARRAMANCER_TEMPLATE_ID).editorDefinition.navigation.mobilePrimary;
  assert.deepEqual(anomancer.map(x=>x.id),['write','evidence','preview']);
  assert.deepEqual(narramancer.map(x=>x.id),['project','characters','chapters','orchestra']);
  assert.ok(anomancer.length<=4&&narramancer.length<=4);
  assert.match(shell,/navigation\|\|\{\}/);
  assert.match(shell,/mobilePrimary\.slice\(0,3\)/);
});

await test('sama metadata rakentaa mobiilidokin ja Lisää-pinnan',()=>{
  assert.match(html,/id="mobileDock"/);
  assert.match(html,/id="workspaceMobileSheet"/);
  assert.match(html,/id="workspaceMobileMoreNav"/);
  assert.match(html,/id="mobileWorkspaceSelect"/);
  assert.match(shell,/function renderMobileNavigation\(\)/);
  assert.match(shell,/function mobileSecondary\(\)/);
  assert.match(shell,/data-mobile-command="workspaces"/);
  assert.match(shell,/data-mobile-command="more"/);
  assert.match(shell,/\['workspaces','◇','Mancerit'\]/);
});

await test('Narramancerin vanha mobiilipoikkeus yliajetaan yhteisellä dokilla',()=>{
  assert.match(css,/Responsive Workspace Navigation/);
  assert.match(css,/body\[data-workspace-template="narrative-authoring"\] \.mobile-dock:not\(\[hidden\]\)\{\s*display:grid/s);
  assert.match(css,/\.workspace-local-sidebar,\s*body\[data-workspace-template="narrative-authoring"\] \.workspace-local-sidebar\{display:none\}/s);
  assert.match(css,/html,body\{overflow-x:clip\}/);
});

await test('yhteinen overlay-controller omistaa Escape-, inert- ja fokuspalautuksen',()=>{
  assert.match(overlays,/if\(activeName&&activeName!==name\)close\(activeName,\{restore:false\}\)/);
  assert.match(overlays,/setAttribute\('inert',''\)/);
  assert.match(overlays,/event\.key==='Escape'/);
  assert.match(overlays,/trigger\?\.isConnected/);
  assert.match(overlays,/event\.key!=='Tab'/);
  assert.match(shell,/register\?\.\('workspace-sheet'/);
  assert.match(admin,/register\?\.\('dispatch-library'/);
  assert.match(admin,/register\?\.\('editor-preview'/);
});

await test('mobiilin pakolliset kosketuskohteet ja labelit eivät putoa mikrotekstiksi',()=>{
  assert.match(css,/--mobile-dock-h:var\(--mobile-dock-height\)/);
  assert.match(css,/\.mobile-dock button\{min-height:54px;min-width:44px/);
  assert.match(css,/\.mobile-dock button>small\{font-size:var\(--font-size-meta\)/);
  assert.match(css,/\.core-shell-nav button\{min-height:44px;font-size:var\(--font-size-ui\)/);
  assert.match(css,/\.narramancer-workspace input,.narramancer-workspace textarea,.narramancer-workspace select\{font-size:16px\}/);
});

await test('bottom sheet on natiivi dialog eikä uusi irrallinen drawer-erikoistapaus',()=>{
  assert.match(html,/<dialog[^>]+class="workspace-mobile-sheet"[^>]+id="workspaceMobileSheet"/);
  assert.match(shell,/kind:'dialog',element:'#workspaceMobileSheet',bodyClass:'workspace-sheet-open'/);
  assert.match(css,/\.workspace-mobile-sheet::backdrop/);
});

console.log(`\n${passed}/7 RESPONSIVE WORKSPACE NAVIGATION 16.8.1 -testiä läpi.`);
