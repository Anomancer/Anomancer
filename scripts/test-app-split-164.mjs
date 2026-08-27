import assert from 'node:assert/strict';
import fs from 'node:fs';

let passed=0;
async function test(name,fn){try{await fn();passed++;console.log(`✓ ${name}`);}catch(error){console.error(`✗ ${name}`);throw error;}}
const read=file=>fs.readFileSync(file,'utf8');
const manifest=JSON.parse(read('manifest.webmanifest'));
const html=read('admin.html');
const worker=read('lahetyskone-sw.js');
const pwa=read('lahetyskone-pwa.js');
const vercel=JSON.parse(read('vercel.json'));
const build=read('scripts/build-blog.mjs');
const robots=read('robots.txt');
const discovery=JSON.parse(read('discovery-policy.json'));

await test('manifesti käynnistyy rajatussa Lähetyskone-scope:ssa',()=>{
  assert.equal(manifest.id,'/lahetyskone');
  assert.equal(manifest.start_url,'/lahetyskone');
  assert.equal(manifest.scope,'/lahetyskone');
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
  assert.match(worker,/APP_PATH = '\/lahetyskone'/);
  assert.match(worker,/url\.pathname\.startsWith\('\/api\/'\)/);
  assert.doesNotMatch(worker,/['"]\/core['"]/);
  assert.doesNotMatch(worker,/['"]\/lahetykset['"]/);
  assert.doesNotMatch(worker,/['"]\/dispatches['"]/);
});

await test('PWA rekisteröidään vain Lähetyskoneen scopeen',()=>{
  assert.match(pwa,/register\('\/lahetyskone-sw\.js', \{ scope: '\/lahetyskone' \}\)/);
  assert.doesNotMatch(pwa,/localStorage|sessionStorage|indexedDB/);
});

await test('Vercel ohjaa vanhan admin-osoitteen sovellukseen ja suojaa uuden pinnan',()=>{
  assert.ok(vercel.redirects?.some(route=>route.source==='/admin'&&route.destination==='/lahetyskone'));
  const appHeaders=vercel.headers?.find(route=>route.source==='/lahetyskone')?.headers||[];
  assert.ok(appHeaders.some(header=>header.key==='Content-Security-Policy'&&header.value.includes("connect-src 'self'")));
  assert.ok(appHeaders.some(header=>header.key==='Service-Worker-Allowed'&&header.value==='/lahetyskone'));
});

await test('hakukoneraja tunnistaa Lähetyskoneen yksityiseksi pinnaksi',()=>{
  assert.match(robots,/Disallow: \/lahetyskone/);
  assert.ok(discovery.privatePaths.includes('/lahetyskone'));
});

await test('build stageaa sovelluskuoren ja PWA-tiedostot public-outputtiin',()=>{
  for(const marker of ['manifest.webmanifest','lahetyskone-sw.js','lahetyskone-pwa.js','icons/lahetyskone-192.png','lahetyskone.html'])assert.ok(build.includes(marker),marker);
});

console.log(`\n${passed}/7 APP SPLIT 16.4 -testiä läpi`);
