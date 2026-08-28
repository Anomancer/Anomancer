import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = file => fs.readFileSync(file,'utf8');
const exists = file => assert.ok(fs.existsSync(file),`${file} puuttuu`);

function pngSize(file){
  const b=fs.readFileSync(file);
  assert.equal(b.subarray(1,4).toString(),'PNG',`${file} ei ole PNG`);
  return {width:b.readUInt32BE(16),height:b.readUInt32BE(20)};
}

const assets = [
  'media/brand/anomancer-wordmark.png',
  'media/brand/anomancer-core-wordmark.png',
  'media/brand/anomancer-mark.png',
  'media/brand/core-mark.png',
  'media/brand/transmission-pulse.png'
];

for(const file of assets){
  exists(file);
  const {width,height}=pngSize(file);
  assert.ok(width>=700,`${file}: resoluutio liian pieni (${width}×${height})`);
  assert.ok(height>=120,`${file}: korkeus liian pieni (${width}×${height})`);
}
console.log('✓ BRAND SYSTEM · viisi kanonista brand-assettia elävät media/brand-rajassa');

for(const [file,w,h] of [
  ['icons/lahetyskone-192.png',192,192],
  ['icons/lahetyskone-512.png',512,512],
  ['icons/lahetyskone-maskable-512.png',512,512]
]){
  exists(file);
  assert.deepEqual(pngSize(file),{width:w,height:h},`${file}: väärä PWA-koko`);
}
console.log('✓ BRAND SYSTEM · favicon/PWA-markki tuottaa oikeat 192/512/maskable ikonit');

const fi=read('site/pages/index.html'), en=read('site/pages/en.html');
for(const [name,html] of [['FI home',fi],['EN home',en]]){
  assert.match(html,/\/media\/brand\/anomancer-mark\.png/);
  assert.match(html,/brand-wordmark-anomancer/);
  assert.match(html,/hero-brand-wordmark/);
  assert.doesNotMatch(html,/hero-signal-mark/);
  assert.doesNotMatch(html,/transmission-pulse\.png/);
  assert.match(html,/footer-polished/);
  assert.match(html,/aria-label="Anomancer"/);
}
console.log('✓ BRAND SYSTEM · Anomancer FI/EN käyttää pulssitonta hero-identiteettiä ja yhtenäistä footeria');
assert.match(fi,/Minimalistinen viisaus hiottu kiveksi/);
assert.doesNotMatch(fi,/Rakennan samalla omia järjestelmiä ja kokeiluja/);
console.log('✓ BRAND SYSTEM · FI Home käyttää päivitettyä minimalistista intro-copya');

const coreFi=read('site/pages/core.html'), coreEn=read('site/pages/core-en.html');
for(const [name,html] of [['FI Core',coreFi],['EN Core',coreEn]]){
  assert.match(html,/\/media\/brand\/core-mark\.png/);
  assert.match(html,/brand-wordmark-anomancer/);
  assert.match(html,/\/media\/brand\/anomancer-wordmark\.png/);
  assert.doesNotMatch(html,/brand-wordmark-core/);
  assert.match(html,/core-hero-wordmark/);
  assert.match(html,/anomancer-core-wordmark\.png/);
  assert.doesNotMatch(html,/core-public-status/);
  assert.doesNotMatch(html,/Agenttijärjestelmän rakennenäkymä|Agent-system architecture view/);
  assert.doesNotMatch(html,/core-brand-mark/);
  assert.doesNotMatch(html,/core-brand-signal/);
  assert.doesNotMatch(html,/transmission-pulse\.png/);
  assert.match(html,/footer-polished/);
}
console.log('✓ BRAND SYSTEM · Core FI/EN käyttää yhteistä Anomancer-headeria ja puhdasta Anomancer Core -heroa');

const build=read('scripts/build-blog.mjs');
assert.match(build,/\/media\/brand\/anomancer-mark\.png/);
assert.match(build,/brand-wordmark-anomancer/);
assert.match(build,/transmission-brand-mark/);
assert.match(build,/footer-brand/);
console.log('✓ BRAND SYSTEM · generoitu Lähetykset/Dispatches/artikkeli UI perii yhteisen Anomancer-brandin');

const admin=read('admin.html');
assert.match(admin,/\/media\/brand\/anomancer-mark\.png/);
assert.match(admin,/\/icons\/lahetyskone-192\.png/);

const manifest=JSON.parse(read('manifest.webmanifest'));
const iconSources=(manifest.icons||[]).map(x=>x.src);
for(const src of ['/icons/lahetyskone-192.png','/icons/lahetyskone-512.png','/icons/lahetyskone-maskable-512.png']){
  assert.ok(iconSources.includes(src),`manifestista puuttuu ${src}`);
}
console.log('✓ BRAND SYSTEM · private Core / PWA käyttää samaa Anomancer-markkia');

assert.match(read('styles.css'),/PHASE 7 · BRAND SYSTEM/);
assert.match(read('core.css'),/PHASE 7 · CORE BRAND/);

for(const file of assets){
  const out=`public/${file}`;
  exists(out);
  assert.deepEqual(pngSize(out),pngSize(file),`${out}: build-output ei vastaa source-assettia`);
}
assert.match(read('public/index.html'),/hero-brand-wordmark/);
assert.doesNotMatch(read('public/index.html'),/hero-signal-mark/);
assert.match(read('public/core.html'),/core-hero-wordmark/);
assert.doesNotMatch(read('public/core.html'),/core-brand-signal/);
assert.match(read('public/en/core.html'),/core-hero-wordmark/);
assert.doesNotMatch(read('public/en/core.html'),/core-brand-signal/);
console.log('✓ BRAND SYSTEM · build stageaa brand-assettien ja FI/EN-sivujen public-outputin');

console.log('\n7/7 PHASE 7 BRAND SYSTEM -porttia läpi');
