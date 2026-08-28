import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createPublicCoreView } from '../server/public-core.js';
import { renderPublicCore } from '../public-core-render.js';

let n=0;const test=(name,fn)=>{fn();n++;console.log(`✓ ${name}`)};
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const fiHome=fs.readFileSync('index.html','utf8');
const enHome=fs.readFileSync('en.html','utf8');
const fiCore=fs.readFileSync('core.html','utf8');
const enCore=fs.readFileSync('core-en.html','utf8');
const build=fs.readFileSync('scripts/build-blog.mjs','utf8');
const site=fs.readFileSync('site.js','utf8');
const styles=fs.readFileSync('styles.css','utf8');
const coreCss=fs.readFileSync('core.css','utf8');
const publicCore=createPublicCoreView();
const fiRender=renderPublicCore(publicCore,'fi');
const enRender=renderPublicCore(publicCore,'en');

test('release on 1.17.1 Public Clarity Pass',()=>{assert.equal(pkg.version,'1.18.5');assert.equal(publicCore.version,'1.18.5');});
test('etusivun vanheneva ikä- ja kolmen vuoden copy on poistettu molemmilla kielillä',()=>{assert.doesNotMatch(fiHome,/29-vuotias|Viimeiset kolme vuotta/);assert.doesNotMatch(enHome,/29-year-old|last three years/i);assert.match(fiHome,/Puran tekoälyä, agentteja, ohjelmistoja/);assert.match(enHome,/I take apart AI, agents, software/);});
test('julkinen Core käyttää kolmea päälukua ja yhdeksän alueen hakemistoa',()=>{for(const html of [fiCore,enCore]){assert.equal((html.match(/class="core-chapter"/g)||[]).length,3);assert.equal((html.match(/data-core-nav=/g)||[]).length,9);assert.doesNotMatch(html,/core-product-status live/);}assert.match(fiCore,/Mikä tämä on/);assert.match(fiCore,/Miten työ kulkee/);assert.match(fiCore,/Mikä pysyy rajattuna/);});
test('Core-fallback syntyy samasta snapshotista kuin client-renderi',()=>{assert.match(build,/syncPublicCoreFallback\('core\.html','fi',publicCore\)/);assert.match(build,/syncPublicCoreFallback\('core-en\.html','en',publicCore\)/);assert.ok(fiCore.includes(fiRender.agentsHtml));assert.ok(fiCore.includes(fiRender.orchestrasHtml));assert.ok(enCore.includes(enRender.agentsHtml));assert.ok(enCore.includes(enRender.orchestrasHtml));assert.match(fiCore,new RegExp(`CORE_FALLBACK:AGENT_COUNT:START -->${publicCore.agents.length}`));assert.match(fiCore,new RegExp(`CORE_FALLBACK:ORCHESTRA_COUNT:START -->${publicCore.orchestras.length}`));});
test('julkinen Core ei nimeä itseään ohjaustasoksi tai control planeksi',()=>{assert.doesNotMatch(fiCore,/Agenttien ohjaustaso|<p class="eyebrow">Ohjaustaso<\/p>/);assert.doesNotMatch(enCore,/Agent Control Plane|<p class="eyebrow">Control plane<\/p>/);assert.match(fiCore,/Julkinen rakennenäkymä/);assert.match(enCore,/Public Architecture View/);assert.equal((fiCore.match(/href="\/admin"/g)||[]).length,1);assert.equal((enCore.match(/href="\/admin"/g)||[]).length,1);});
test('Lähetysten buildissä yleisöfiltterit saavat määrät ja nollasisältöiset yleisöt jäävät pois',()=>{assert.match(build,/published\.some\(p=>\(p\.audience/);assert.match(build,/const count=id=>published\.filter/);assert.match(build,/audience-filter[^`]*<span>\$\{count\(id\)\}<\/span>/);});
test('mobiili yhdistää aihe- ja yleisöfiltterit bottom sheetiin sekä tarjoaa yhteenvedon ja tyhjennyksen',()=>{assert.match(build,/dispatch-filter-dialog/);assert.match(build,/dispatch-filter-summary/);assert.match(build,/data-filter-clear/);assert.match(site,/syncPressed\(categoryButtons/);assert.match(site,/syncPressed\(audienceButtons/);assert.match(site,/updateSummary/);assert.match(site,/dialog\.showModal/);assert.match(styles,/\.desktop-filter-surface\{display:none!important\}/);assert.match(styles,/\.dispatch-filter-sheet/);});
test('julkisen Coren uusi renderer toimitetaan public-outputtiin ja chapter-layout on responsiivinen',()=>{assert.match(build,/'site\.js','public-core-render\.js','core-public\.js'/);assert.ok(fs.existsSync('public/public-core-render.js'));assert.match(fs.readFileSync('public/core-public.js','utf8'),/from '.\/public-core-render\.js'/);assert.match(coreCss,/\.core-chapter-nav/);assert.match(coreCss,/\.core-structure-directory/);assert.match(coreCss,/@media\(max-width:680px\)[\s\S]*\.core-chapter-head/);});
console.log(`\n${n}/${n} PUBLIC CLARITY 1.17.1 -testiä läpi`);
