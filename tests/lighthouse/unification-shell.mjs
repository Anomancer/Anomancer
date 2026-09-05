import assert from 'node:assert/strict';
import fs from 'node:fs';
import {lighthouseAppAllowed,lighthouseLabAllowed,lighthouseLabRequiresAuth} from '../../core/authority/lab-policy.js';
import {readLighthouseCss} from '../../scripts/read-lighthouse-css.mjs';

const read=file=>fs.readFileSync(file,'utf8');
const json=file=>JSON.parse(read(file));

const pkg=json('package.json');
const vercel=json('vercel.json');
const discovery=json('discovery-policy.json');
const manifest=json('manifest.webmanifest');
const light=read('app/lighthouse/lab.html');
const lightCss=readLighthouseCss();
const workbench=read('admin.html');
const workbenchCss=read('lighthouse-workbench.css');
const coreFi=read('site/pages/core.html');
const coreEn=read('site/pages/core-en.html');
const homeFi=read('site/pages/index.html');
const homeEn=read('site/pages/en.html');
const packageManifest=json('mancers/toimituskone/manifest.json');
const build=read('scripts/build-lighthouse.mjs');
const adminRoute=read('server/admin-routes/core.js');

assert.match(pkg.version,/^1\.35\./);
assert.equal(lighthouseAppAllowed({VERCEL_ENV:'production'}),true);
assert.equal(lighthouseLabAllowed({VERCEL_ENV:'preview'}),true);
assert.equal(lighthouseAppAllowed({VERCEL_ENV:'production',ANOMANCER_LIGHTHOUSE_APP:'0'}),false);
assert.equal(lighthouseLabRequiresAuth({VERCEL_ENV:'production'}),true);

const redirect=(source,destination)=>vercel.redirects.some(item=>item.source===source&&item.destination===destination);
assert.ok(redirect('/admin','/lighthouse/workbench'));
assert.ok(redirect('/lahetyskone','/lighthouse/workbench'));
assert.ok(redirect('/lab','/lighthouse'));
assert.ok(!vercel.rewrites.some(item=>['/lighthouse/login','/lighthouse/workbench'].includes(item.source)));
assert.ok(fs.existsSync('public/lighthouse/login.html'));

assert.ok(fs.existsSync('public/lighthouse/workbench.html'));

assert.ok(vercel.headers.some(item=>item.source==='/lighthouse'));
assert.ok(vercel.headers.some(item=>item.source==='/lighthouse/(.*)'));

for(const path of ['/lighthouse','/lighthouse/','/admin','/lahetyskone','/api/admin/','/api/lab/']){
  assert.ok(discovery.privatePaths.includes(path),`private path missing: ${path}`);
}

assert.equal(manifest.id,'/lighthouse');
assert.equal(manifest.start_url,'/lighthouse');
assert.equal(manifest.scope,'/lighthouse');
assert.equal(manifest.theme_color,'#160d26');

assert.match(light,/class="one-room-shell"/);
assert.doesNotMatch(light,/class="lighthouse-mode-switch"/);
assert.match(light,/href="\/lighthouse\/workbench"/);
assert.match(light,/Kirjaudu Lighthouseen/);
assert.match(light,/Mikä Lighthouse on\?/);
assert.match(light,/Lighthouse → Mancer → Orkesteri → Agentti → Kyvykkyys/);
assert.match(lightCss,/#160d23|#160d26|#241337|#654884/);

assert.match(workbench,/aria-label="Lighthouse"[^>]*>.*<strong>Lighthouse<\/strong>/s);
assert.doesNotMatch(workbench,/data-shell-route="workspaces"[^>]*>Mancerit/);
assert.match(workbench,/Konepellin alla/);
assert.match(workbench,/Mancer \/ työtila/);
assert.match(workbench,/TYÖTILA \/ ANOMANCER/);
assert.match(workbench,/Kirjaudu Lighthouseen/);
assert.match(workbenchCss,/#150c21|#4d2a6c|#8a61ab|#a982c8/);
assert.match(workbench,/lighthouse-mark-48\.png/);
assert.match(workbenchCss,/--lh-panel:/);
assert.match(workbenchCss,/Lighthouse Workbench Visual Unification/);
assert.match(workbenchCss,/body\[data-workspace-template=\"editorial-platform\"\] \.workspace-local-sidebar/);

for(const page of [homeFi,homeEn])assert.match(page,/href="\/lighthouse\/login">Lighthouse<\/a>/);
for(const page of [coreFi,coreEn]){
  assert.match(page,/href="\/lighthouse\/login"/);
  assert.match(page,/Lighthouse/);
  assert.match(page,/Mancer/);
}
assert.match(coreFi,/core-concept-chain/);
for(const term of ['Lighthouse','Mancer','Orkesteri','Agentti','Kyvykkyys'])assert.match(coreFi,new RegExp(term));

assert.equal(packageManifest.visibility,'internal-compat');
assert.equal(packageManifest.legacyOf,'anomancer');
assert.match(adminRoute,/filter\(userVisiblePackage\)/);
assert.match(adminRoute,/item\?\.manifest\?\.id!==['"]toimituskone['"]/);

assert.match(build,/public['"],['"]lighthouse\.html|LIGHTHOUSE_HTML/);
assert.match(build,/M5 · Workbench 2.0/);
assert.match(build,/id:'anomancer'/);
assert.match(build,/filter\(pkg=>pkg\.manifest\.id!==['"]toimituskone['"]\)/);

if(fs.existsSync('public/lighthouse.html')){
  const built=read('public/lighthouse.html');
  assert.doesNotMatch(built,/__LIGHTHOUSE_BOOTSTRAP__/);
  assert.match(built,/M5 · Workbench 2.0/);
}

console.log('✓ Lighthouse 1.24 unification · routes, modes, taxonomy, privacy and compatibility boundary');
