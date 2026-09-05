import assert from 'node:assert/strict';
import fs from 'node:fs';

let passed=0;
async function test(name,fn){try{await fn();passed++;console.log(`✓ ${name}`);}catch(error){console.error(`✗ ${name}`);throw error;}}
const read=file=>fs.readFileSync(file,'utf8');
const manifest=JSON.parse(read('manifest.webmanifest'));
const html=read('admin.html');
const worker=read('lighthouse-sw.js');
const pwa=read('lighthouse-pwa.js');
const vercel=JSON.parse(read('vercel.json'));
const build=read('scripts/build-blog.mjs');
const robots=read('public/robots.txt');
const discovery=JSON.parse(read('discovery-policy.json'));

await test('manifesti käynnistyy rajatussa Lighthouse-scope:ssa',()=>{
  assert.equal(manifest.id,'/lighthouse');
  assert.equal(manifest.start_url,'/lighthouse');
  assert.equal(manifest.scope,'/lighthouse');
  assert.equal(manifest.display,'standalone');
  assert.ok(manifest.icons.some(icon=>icon.sizes==='192x192'));
  assert.ok(manifest.icons.some(icon=>icon.sizes==='512x512'&&icon.purpose==='maskable'));
});

await test('admin-kuori ilmoittaa PWA:n ja säilyttää noindex-rajan',()=>{
  assert.match(html,/rel="manifest"/);
  assert.match(html,/content="noindex,nofollow,noarchive"/);
  assert.match(html,/data-install-app/);
  assert.match(html,/Julkaise eetteriin/);
  assert.match(html,/Konehuone/);
});

await test('service worker ei hallitse julkista Corea tai API-vastauksia',()=>{
  assert.match(worker,/APP_PATH = '\/lighthouse\/workbench'/);
  assert.match(worker,/url\.pathname\.startsWith\('\/api\/'\)/);
  assert.doesNotMatch(worker,/['"]\/core['"]/);
  assert.doesNotMatch(worker,/['"]\/lahetykset['"]/);
  assert.doesNotMatch(worker,/['"]\/dispatches['"]/);
});

await test('PWA rekisteröidään vain Lighthousen scopeen',()=>{
  assert.match(pwa,/register\('\/lighthouse-sw\.js', \{[\s\S]*?scope: '\/lighthouse',[\s\S]*?updateViaCache: 'none'[\s\S]*?\}\)/);
  assert.doesNotMatch(pwa,/localStorage|sessionStorage|indexedDB/);
});

await test('Vercel ohjaa vanhan admin-osoitteen sovellukseen ja suojaa uuden pinnan',()=>{
  assert.ok(vercel.redirects?.some(route=>route.source==='/admin'&&route.destination==='/lighthouse/workbench'));
  const appHeaders=vercel.headers?.find(route=>route.source==='/lighthouse/workbench')?.headers||[];
  assert.ok(appHeaders.some(header=>header.key==='Content-Security-Policy'&&header.value.includes("connect-src 'self'")));
  assert.ok(appHeaders.some(header=>header.key==='Service-Worker-Allowed'&&header.value==='/lighthouse'));
});

await test('hakukoneraja tunnistaa Lighthousen yksityiseksi pinnaksi',()=>{
  assert.match(robots,/Disallow: \/lighthouse/);
  assert.ok(discovery.privatePaths.includes('/lighthouse'));
  assert.ok(discovery.privatePaths.includes('/lahetyskone')); // legacy alias stays private
});

await test('build stageaa sovelluskuoren ja PWA-tiedostot public-outputtiin',()=>{
  for(const marker of ['manifest.webmanifest','lighthouse-sw.js','lighthouse-pwa.js','icons/lahetyskone-192.png','lahetyskone.html'])assert.ok(build.includes(marker),marker);
  assert.ok(build.includes("'lighthouse/login.html','lighthouse/workbench.html'"),'canonical Lighthouse route artifacts');
});

console.log(`\n${passed}/7 APP SPLIT 16.4 -testiä läpi`);
