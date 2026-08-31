import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createPublicCoreView } from '../../server/public-core.js';
import { renderPublicCore } from '../../public-core-render.js';

let n=0;const test=(name,fn)=>{fn();n++;console.log(`✓ ${name}`)};
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const fiHome=fs.readFileSync('index.html','utf8');
const enHome=fs.readFileSync('en.html','utf8');
const fiCoreSource=fs.readFileSync('core.html','utf8');
const enCoreSource=fs.readFileSync('core-en.html','utf8');
const fiCore=fs.readFileSync('public/core.html','utf8');
const enCore=fs.readFileSync('public/en/core.html','utf8');
const build=fs.readFileSync('scripts/build-blog.mjs','utf8');
const site=fs.readFileSync('site.js','utf8');
const styles=fs.readFileSync('styles.css','utf8');
const coreCss=fs.readFileSync('core.css','utf8');
const publicCore=createPublicCoreView();
const fiRender=renderPublicCore(publicCore,'fi');
const enRender=renderPublicCore(publicCore,'en');

test('julkinen Core säilyy vakaana Lighthouse-rakennushaarassa',()=>{assert.match(pkg.version,/^1\.25\./);assert.equal(publicCore.version,'1.18.7');});
test('etusivun vanheneva ikä- ja kolmen vuoden copy on poistettu molemmilla kielillä',()=>{assert.doesNotMatch(fiHome,/29-vuotias|Viimeiset kolme vuotta/);assert.doesNotMatch(enHome,/29-year-old|last three years/i);assert.match(fiHome,/Puran tekoälyä, agentteja, ohjelmistoja/);assert.match(enHome,/I take apart AI, agents, software/);});
test('julkinen Core käyttää kolmea päälukua ja yhdeksän alueen hakemistoa',()=>{for(const html of [fiCore,enCore]){assert.equal((html.match(/class="core-chapter"/g)||[]).length,3);assert.equal((html.match(/data-core-nav=/g)||[]).length,9);assert.doesNotMatch(html,/core-product-status live/);}assert.match(fiCore,/Mikä tämä on/);assert.match(fiCore,/Miten työ kulkee/);assert.match(fiCore,/Mikä pysyy rajattuna/);});
test('Core-fallback syntyy samasta snapshotista kuin client-renderi',()=>{assert.match(build,/write\('core\.html',renderPublicCoreFallback\('core\.html','fi',publicCore\)\)/);assert.match(build,/write\('en\/core\.html',renderPublicCoreFallback\('core-en\.html','en',publicCore\)\)/);assert.ok(fiCore.includes(fiRender.agentsHtml));assert.ok(fiCore.includes(fiRender.orchestrasHtml));assert.ok(enCore.includes(enRender.agentsHtml));assert.ok(enCore.includes(enRender.orchestrasHtml));assert.match(fiCoreSource,/CORE_FALLBACK:AGENT_COUNT:START/);assert.match(enCoreSource,/CORE_FALLBACK:AGENT_COUNT:START/);assert.match(fiCore,new RegExp(`CORE_FALLBACK:AGENT_COUNT:START -->${publicCore.agents.length}`));assert.match(fiCore,new RegExp(`CORE_FALLBACK:ORCHESTRA_COUNT:START -->${publicCore.orchestras.length}`));});
test('julkinen Core ei nimeä itseään ohjaustasoksi ja Home/Core tarjoavat Lighthouse-reitin footerissa',()=>{assert.doesNotMatch(fiCore,/Agenttien ohjaustaso|<p class="eyebrow">Ohjaustaso<\/p>/);assert.doesNotMatch(enCore,/Agent Control Plane|<p class="eyebrow">Control plane<\/p>/);assert.match(fiCore,/Julkinen rakennenäkymä/);assert.match(enCore,/Public Architecture View/);for(const html of [fiCore,enCore]){assert.ok((html.match(/href="\/lighthouse\/login"/g)||[]).length>=1);assert.match(html,/footer-admin-link/);}for(const html of [fiHome,enHome])assert.match(html,/class="footer-admin-link" href="\/lighthouse\/login">Lighthouse<\/a>/);});
test('Lähetysten buildissä yleisöfiltterit saavat määrät ja nollasisältöiset yleisöt jäävät pois',()=>{assert.match(build,/published\.some\(p=>\(p\.audience/);assert.match(build,/const count=id=>published\.filter/);assert.match(build,/audience-filter[^`]*<span>\$\{count\(id\)\}<\/span>/);});
test('mobiili yhdistää aihe- ja yleisöfiltterit bottom sheetiin sekä tarjoaa yhteenvedon ja tyhjennyksen',()=>{assert.match(build,/dispatch-filter-dialog/);assert.match(build,/dispatch-filter-summary/);assert.match(build,/data-filter-clear/);assert.match(site,/syncPressed\(categoryButtons/);assert.match(site,/syncPressed\(audienceButtons/);assert.match(site,/updateSummary/);assert.match(site,/dialog\.showModal/);assert.match(styles,/\.desktop-filter-surface\{display:none!important\}/);assert.match(styles,/\.dispatch-filter-sheet/);});
test('julkisen Coren uusi renderer toimitetaan public-outputtiin ja chapter-layout on responsiivinen',()=>{assert.match(build,/'site\.js','public-core-render\.js','public-core-v3-render\.js','core-public\.js'/);assert.ok(fs.existsSync('public/public-core-render.js'));assert.match(fs.readFileSync('public/core-public.js','utf8'),/from '.\/public-core-render\.js'/);assert.match(coreCss,/\.core-chapter-nav/);assert.match(coreCss,/\.core-structure-directory/);assert.match(coreCss,/@media\(max-width:680px\)[\s\S]*\.core-chapter-head/);});
test('Core käyttää mobiilissa progressiivista sisältöavausta ilman muutoksia Lighthouse Labiin tai adminiin',()=>{const client=fs.readFileSync('core-public.js','utf8');assert.match(client,/function initMobileDisclosure\(\)/);assert.match(client,/max-width: 760px/);assert.match(client,/Näytä sisältö/);assert.match(client,/exclusive:true/);assert.match(coreCss,/\.core-mobile-disclosure-toggle/);assert.match(coreCss,/@media\(max-width:760px\)[\s\S]*\.core-chapter-nav\{display:none\}/);assert.match(coreCss,/core-product-section\[data-core-section\]:not\(\.is-mobile-open\)/);});
test('Lähetykset käyttää yhtä täysleveää julkaisupalstaa myös desktopissa',()=>{assert.match(styles,/\.dispatch-grid \{ display:grid; grid-template-columns:minmax\(0,1fr\); gap:16px; \}/);assert.doesNotMatch(styles,/\.dispatch-grid \{ display:grid; grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);});

test('julkinen sivusto tarjoaa muistettavan vaalean teeman ilman admin- tai Lighthouse-kytkentää',()=>{assert.match(site,/PUBLIC_THEME_KEY='anomancer-public-theme'/);assert.match(site,/data-theme-toggle/);assert.match(styles,/html\[data-theme=\"light\"\]/);assert.match(build,/data-theme-toggle/);for(const html of [fiHome,enHome,fiCoreSource,enCoreSource]){assert.match(html,/data-theme-toggle/);assert.match(html,/anomancer-public-theme/);}assert.doesNotMatch(fs.readFileSync('admin.html','utf8'),/data-theme-toggle/);});

console.log(`\n${n}/${n} PUBLIC CLARITY 1.17.1 -testiä läpi`);


test('etusivun teemakytkin lataa site.js:n molemmilla kielillä',()=>{for(const html of [fiHome,enHome]){assert.match(html,/type=\"module\" src=\"\/site\.js\"/);}});
test('vaalea julkinen teema koventaa dark-only tekstivärit',()=>{for(const selector of ['.card-arrow','.identity-copy strong','.contact-form label','.article-body'])assert.match(styles,new RegExp('html\\[data-theme=\"light\"\\].*'+selector.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'s'));assert.match(styles,/html\[data-theme="light"\] \.contact-form input[\s\S]*background:#fff[\s\S]*color:#17171b/);});


test('vaalea Core käyttää omia luettavia kortti- ja metadata-tokenien arvoja',()=>{
  assert.match(coreCss,/PUBLIC CORE · LIGHT THEME FULL READABILITY SURGERY R8/);
  assert.match(coreCss,/--core-light-muted:#4d4b52/);
  assert.match(coreCss,/--core-light-dim:#625f67/);
  assert.match(coreCss,/\.core-evidence-flow article[\s\S]*border-top:3px solid/);
  assert.match(coreCss,/\.core-v3-runtime-grid dt[\s\S]*opacity:1/);
  assert.match(coreCss,/\.core-v3-code-list code[\s\S]*background:#efebe5/);
  assert.match(coreCss,/\.core-agent-search input::placeholder\{color:#6a666f;opacity:1\}/);
  assert.match(coreCss,/\.core-product-status\.live\{color:#176b3a/);
  assert.match(coreCss,/\.core-product-page code,[\s\S]*opacity:1/);
});

test('Core light model target code keeps accessible contrast',()=>{
  assert.match(coreCss,/html\[data-theme="light"\] \.core-public-page \.core-model-targets span > code\{[\s\S]*?color:#17171b !important;[\s\S]*?opacity:1 !important;/);
});

test('vaalea julkinen teema ei peri valkoista tekstiä bioon, filttereihin tai evidenssiin',()=>{
  assert.match(styles,/PUBLIC LIGHT THEME · WHITE-TEXT SENTINEL R10/);
  assert.match(styles,/PUBLIC LIGHT THEME · ACTIVE FILTER COUNT A11Y R11/);
  assert.match(styles,/audience-filter\.is-active > span[\s\S]*color:#5b2630/);
  assert.match(styles,/html\[data-theme="light"\] \.hero-highlights strong\{[\s\S]*?color:#3f3b44;/);
  assert.match(styles,/html\[data-theme="light"\] \.pinned-tag\{[\s\S]*?color:#9d1831;/);
  assert.match(styles,/html\[data-theme="light"\] \.audience-filter\.is-active,[\s\S]*?color:#17171b;/);
  assert.match(styles,/html\[data-theme="light"\] \.article-evidence>summary strong,[\s\S]*?color:#17171b;/);
  assert.match(styles,/html\[data-theme="light"\] \.evidence-claim p\{[\s\S]*?color:#343139;/);
  assert.match(styles,/html\[data-theme="light"\] \.evidence-refs a,[\s\S]*?color:#8b1530;/);
});

test('light Core has a complete contrast sweep for hashes and inherited microcopy',()=>{
  const css=coreCss;
  assert.match(css,/PUBLIC CORE · LIGHT THEME COMPLETE CONTRAST SWEEP R12/);
  assert.match(css,/html\[data-theme=\"light\"\] \.core-public-page \.core-public-lead\s*\{[^}]*color:var\(--core-light-muted\) !important/s);
  assert.match(css,/html\[data-theme=\"light\"\] \.core-public-page code\s*\{[^}]*color:var\(--core-light-ink-2\) !important/s);
  assert.match(css,/\.core-receipt-demo code\s*\{[^}]*color:#28262c !important/s);
  assert.match(css,/\.core-workspace-public-grid strong code\s*\{[^}]*color:#2f2c33 !important/s);
});


test('mobiilivalikko käyttää yhtä yhteistä click-controlleria eikä etusivu tuplatogglesta itseään kiinni',()=>{
  for(const html of [fiHome,enHome]){
    assert.match(html,/type="module" src="\/site\.js"/);
    assert.doesNotMatch(html,/const button = document\.querySelector\('\.menu-toggle'\)/);
    assert.doesNotMatch(html,/menu\.classList\.toggle\('is-open'\)/);
  }
  assert.match(site,/const setMenuOpen=open=>/);
  assert.match(site,/setMenuOpen\(!menu\?\.classList\.contains\('is-open'\)\)/);
  assert.match(site,/aria-expanded/);
  assert.match(site,/Sulje valikko/);
  assert.match(site,/Close menu/);
});
